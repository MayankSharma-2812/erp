const Admission = require('../models/Admission');
const Student = require('../models/Student');
const Class = require('../models/Class');
const FeeStructure = require('../models/FeeStructure');
const FeeLedger = require('../models/FeeLedger');

const createEnquiry = async (req, res, next) => {
  try {
    const enquiry = await Admission.create(req.body);
    return res.status(201).json({
      success: true,
      data: enquiry,
      message: 'Enquiry created successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getEnquiries = async (req, res, next) => {
  try {
    const { stage, classAppliedFor, studentName } = req.query;
    const query = {};

    if (stage) query.stage = stage;
    if (classAppliedFor) query.classAppliedFor = classAppliedFor;
    if (studentName) {
      query.studentName = { $regex: studentName, $options: 'i' };
    }

    const enquiries = await Admission.find(query).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: enquiries,
    });
  } catch (error) {
    next(error);
  }
};

const getEnquiryById = async (req, res, next) => {
  try {
    const enquiry = await Admission.findById(req.params.id).populate('studentId');
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found',
      });
    }
    return res.status(200).json({
      success: true,
      data: enquiry,
    });
  } catch (error) {
    next(error);
  }
};

const updateEnquiry = async (req, res, next) => {
  try {
    const enquiry = await Admission.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found',
      });
    }
    return res.status(200).json({
      success: true,
      data: enquiry,
      message: 'Enquiry updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

const applyEnquiry = async (req, res, next) => {
  try {
    const enquiry = await Admission.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found',
      });
    }

    enquiry.stage = 'applied';
    await enquiry.save();

    return res.status(200).json({
      success: true,
      data: enquiry,
      message: 'Enquiry converted to active application',
    });
  } catch (error) {
    next(error);
  }
};

const enterTestScore = async (req, res, next) => {
  try {
    const { testDate, testScore, testRemarks } = req.body;
    const enquiry = await Admission.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found',
      });
    }

    enquiry.testDate = testDate || new Date();
    enquiry.testScore = testScore;
    enquiry.testRemarks = testRemarks;
    enquiry.stage = 'test_appeared';
    await enquiry.save();

    return res.status(200).json({
      success: true,
      data: enquiry,
      message: 'Test score entered successfully',
    });
  } catch (error) {
    next(error);
  }
};

const allocateSeat = async (req, res, next) => {
  try {
    const { seatAllocated, decisionNote, stage } = req.body;
    const enquiry = await Admission.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found',
      });
    }

    enquiry.seatAllocated = seatAllocated; // format: "Class XII - A" or "Class X"
    enquiry.decisionNote = decisionNote;
    enquiry.decisionBy = req.user.id;
    enquiry.decisionDate = new Date();
    enquiry.stage = stage || 'offer_sent'; // offer_sent, waitlisted, rejected
    await enquiry.save();

    return res.status(200).json({
      success: true,
      data: enquiry,
      message: `Seat allocated and status updated to ${enquiry.stage}`,
    });
  } catch (error) {
    next(error);
  }
};

const confirmAdmission = async (req, res, next) => {
  try {
    const { classId, section, session } = req.body;
    const enquiry = await Admission.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found',
      });
    }

    // Verify class exists
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(400).json({
        success: false,
        message: 'Assigned Class does not exist',
      });
    }

    // Generate unique Admission Number for student
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    const admissionNumber = `ADM-${year}-${random}`;

    // Auto-create Student record from applicant data
    const student = await Student.create({
      admissionNumber,
      name: enquiry.studentName,
      dob: enquiry.dob,
      gender: enquiry.gender,
      class: classId,
      section: section || 'A',
      session: session || '2025-26',
      admissionDate: new Date(),
      status: 'active',
      father: {
        name: enquiry.fatherName,
        phone: enquiry.contactPhone,
        email: enquiry.contactEmail,
      },
      mother: {
        name: enquiry.motherName,
      },
      guardian: {
        name: enquiry.fatherName,
        relation: 'Father',
        phone: enquiry.contactPhone,
      },
      address: {
        line1: 'Boarding School Campus',
        city: 'School Town',
        state: 'School State',
        pincode: '000000',
      },
    });

    // Update Admission record
    enquiry.stage = 'confirmed';
    enquiry.studentId = student._id;
    enquiry.admissionFeeStatus = 'pending';
    await enquiry.save();

    // Auto-create fee ledger for this student in fee_ledgers collection
    try {
      const activeSession = session || '2025-26';
      const feeStructure = await FeeStructure.findOne({
        class: classId,
        session: activeSession,
      });

      if (!feeStructure) {
        console.warn(`[WARNING] No fee structure found for class ${classId} and session ${activeSession}. Ledger created empty.`);
        await FeeLedger.create({
          student: student._id,
          session: activeSession,
          entries: [],
          totalDue: 0,
          totalPaid: 0,
          balance: 0,
        });
      } else {
        const calculateDueDate = (dueDay) => {
          const now = new Date();
          let year = now.getFullYear();
          let month = now.getMonth();
          if (now.getDate() > dueDay) {
            month += 1;
            if (month > 11) {
              month = 0;
              year += 1;
            }
          }
          return new Date(year, month, dueDay);
        };

        const entries = feeStructure.heads.map((head) => ({
          head: head.name,
          amount: head.amount,
          dueDate: calculateDueDate(head.dueDay),
          status: 'pending',
          paidAmount: 0,
          waivedAmount: 0,
        }));

        const totalDue = entries.reduce((sum, entry) => sum + entry.amount, 0);

        await FeeLedger.create({
          student: student._id,
          session: activeSession,
          entries,
          totalDue,
          totalPaid: 0,
          balance: totalDue,
        });
      }
    } catch (ledgerError) {
      console.error('[ERROR] Failed to auto-create fee ledger for student:', ledgerError);
    }

    return res.status(200).json({
      success: true,
      data: {
        admission: enquiry,
        student,
      },
      message: 'Admission confirmed. Student profile created successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEnquiry,
  getEnquiries,
  getEnquiryById,
  updateEnquiry,
  applyEnquiry,
  enterTestScore,
  allocateSeat,
  confirmAdmission,
};
