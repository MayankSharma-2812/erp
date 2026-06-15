const HealthProfile = require('../models/HealthProfile');
const ClinicVisit = require('../models/ClinicVisit');
const MedicationLog = require('../models/MedicationLog');
const SickbayRegister = require('../models/SickbayRegister');

// Helper to mask health data based on user role
const maskRestrictedFields = (role, item) => {
  const allowed = ['principal', 'vice_principal', 'medical_officer'];
  if (!role || !allowed.includes(role)) {
    // Return a copy with masked values
    const itemObj = item.toObject ? item.toObject() : { ...item };
    if (itemObj.examination !== undefined) itemObj.examination = '[RESTRICTED - MEDICAL ONLY]';
    if (itemObj.diagnosis !== undefined) itemObj.diagnosis = '[RESTRICTED - MEDICAL ONLY]';
    if (itemObj.progressNotes !== undefined) {
      itemObj.progressNotes = itemObj.progressNotes.map(n => ({
        ...n,
        note: '[RESTRICTED - MEDICAL ONLY]',
      }));
    }
    return itemObj;
  }
  return item;
};

// --- HEALTH PROFILE ---
const upsertHealthProfile = async (req, res, next) => {
  try {
    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Missing studentId' });
    }

    const profile = await HealthProfile.findOneAndUpdate(
      { student: studentId },
      req.body,
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: profile,
      message: 'Health profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getHealthProfile = async (req, res, next) => {
  try {
    const profile = await HealthProfile.findOne({ student: req.params.studentId }).populate('student');
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Health profile not found' });
    }
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

// --- CLINIC VISITS ---
const createClinicVisit = async (req, res, next) => {
  try {
    const visitData = {
      ...req.body,
      attendedBy: req.user.id,
    };
    const visit = await ClinicVisit.create(visitData);

    // If medications are logged, create medication logs
    if (req.body.medications && req.body.medications.length > 0) {
      const logs = req.body.medications.map(m => ({
        visit: visit._id,
        student: req.body.student,
        medication: m.medication,
        dosage: m.dosage,
        quantity: m.quantity || 1,
        dispensedBy: req.user.id,
      }));
      await MedicationLog.insertMany(logs);
    }

    res.status(201).json({
      success: true,
      data: visit,
      message: 'Clinic visit recorded successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getClinicVisits = async (req, res, next) => {
  try {
    const { studentId } = req.query;
    const query = {};
    if (studentId) query.student = studentId;

    const visits = await ClinicVisit.find(query)
      .populate('student')
      .populate('attendedBy', 'name email role')
      .sort({ visitDate: -1 });

    // Apply role-based field masking
    const masked = visits.map(v => maskRestrictedFields(req.user?.role, v));

    res.status(200).json({
      success: true,
      data: masked,
    });
  } catch (error) {
    next(error);
  }
};

// --- SICKBAY REGISTER ---
const admitToSickbay = async (req, res, next) => {
  try {
    const { student, admitDate, admitTime, condition, bed } = req.body;
    if (!student || !admitDate || !condition) {
      return res.status(400).json({ success: false, message: 'Missing student, admitDate, or condition' });
    }

    const record = await SickbayRegister.create({
      student,
      admitDate: new Date(admitDate),
      admitTime,
      condition,
      bed,
      progressNotes: [],
    });

    res.status(201).json({
      success: true,
      data: record,
      message: 'Student admitted to sickbay successfully',
    });
  } catch (error) {
    next(error);
  }
};

const updateSickbayProgress = async (req, res, next) => {
  try {
    const record = await SickbayRegister.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Sickbay record not found' });
    }

    const { note } = req.body;
    if (!note) {
      return res.status(400).json({ success: false, message: 'Missing progress note text' });
    }

    record.progressNotes.push({ note, date: new Date() });
    await record.save();

    const masked = maskRestrictedFields(req.user?.role, record);

    res.status(200).json({
      success: true,
      data: masked,
      message: 'Progress note added successfully',
    });
  } catch (error) {
    next(error);
  }
};

const dischargeFromSickbay = async (req, res, next) => {
  try {
    const { dischargeDate, dischargeTime, followUp } = req.body;
    const record = await SickbayRegister.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Sickbay record not found' });
    }

    record.dischargeDate = dischargeDate ? new Date(dischargeDate) : new Date();
    record.dischargeTime = dischargeTime;
    record.followUp = followUp;
    await record.save();

    res.status(200).json({
      success: true,
      data: record,
      message: 'Student discharged from sickbay successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getActiveSickbay = async (req, res, next) => {
  try {
    // active = dischargeDate is null
    const activeRecords = await SickbayRegister.find({ dischargeDate: null })
      .populate('student')
      .sort({ admitDate: -1 });

    const masked = activeRecords.map(r => maskRestrictedFields(req.user?.role, r));

    res.status(200).json({
      success: true,
      data: masked,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upsertHealthProfile,
  getHealthProfile,
  createClinicVisit,
  getClinicVisits,
  admitToSickbay,
  updateSickbayProgress,
  dischargeFromSickbay,
  getActiveSickbay,
};
