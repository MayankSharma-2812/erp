const HostelBlock = require('../models/HostelBlock');
const HostelAllocation = require('../models/HostelAllocation');
const HostelAttendance = require('../models/HostelAttendance');
const OutingRequest = require('../models/OutingRequest');
const VisitorLog = require('../models/VisitorLog');
const MessMenu = require('../models/MessMenu');
const Student = require('../models/Student');
const FeeLedger = require('../models/FeeLedger');

// --- HOSTEL BLOCK CRUD ---
const createBlock = async (req, res, next) => {
  try {
    const block = await HostelBlock.create(req.body);
    res.status(201).json({
      success: true,
      data: block,
      message: 'Hostel block created successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getBlocks = async (req, res, next) => {
  try {
    const blocks = await HostelBlock.find({}).sort({ name: 1 });
    res.status(200).json({
      success: true,
      data: blocks,
    });
  } catch (error) {
    next(error);
  }
};

const updateBlock = async (req, res, next) => {
  try {
    const block = await HostelBlock.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!block) {
      return res.status(404).json({ success: false, message: 'Hostel block not found' });
    }
    res.status(200).json({
      success: true,
      data: block,
      message: 'Hostel block updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

const deleteBlock = async (req, res, next) => {
  try {
    const block = await HostelBlock.findByIdAndDelete(req.params.id);
    if (!block) {
      return res.status(404).json({ success: false, message: 'Hostel block not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Hostel block deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// --- ROOM ALLOCATION & VACATING ---
const allocateRoom = async (req, res, next) => {
  try {
    const { studentId, blockId, roomNumber, bedNumber, session } = req.body;
    if (!studentId || !blockId || !roomNumber || !bedNumber || !session) {
      return res.status(400).json({
        success: false,
        message: 'Missing required allocation fields',
      });
    }

    const block = await HostelBlock.findById(blockId);
    if (!block) {
      return res.status(404).json({ success: false, message: 'Hostel block not found' });
    }

    const room = block.rooms.find(r => r.roomNumber === roomNumber);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found in this block' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Check if bed is already occupied in this block/room/bed for the session and not vacated
    const existingAlloc = await HostelAllocation.findOne({
      block: blockId,
      roomNumber,
      bedNumber,
      session,
      vacatedDate: { $exists: false },
    });

    if (existingAlloc) {
      return res.status(400).json({
        success: false,
        message: `Bed ${bedNumber} in room ${roomNumber} is already occupied.`,
      });
    }

    // Create allocation
    const allocation = await HostelAllocation.create({
      student: studentId,
      block: blockId,
      roomNumber,
      bedNumber,
      session,
      allottedBy: req.user.id,
      allottedDate: new Date(),
    });

    // Update Student boarding status
    student.isBoarding = true;
    await student.save();

    // Map room type to fee amount
    let feeAmount = 12000; // default for double
    if (room.type === 'dormitory') feeAmount = 10000;
    else if (room.type === 'single') feeAmount = 15000;

    // FINANCE LINKAGE: Charge Hostel Accommodation Fee to FeeLedger
    const ledger = await FeeLedger.findOne({ student: studentId, session });
    if (ledger) {
      const hasFee = ledger.entries.some(e => e.head === 'Hostel Accommodation Fee');
      if (!hasFee) {
        ledger.entries.push({
          head: 'Hostel Accommodation Fee',
          amount: feeAmount,
          dueDate: new Date(),
          status: 'pending',
          paidAmount: 0,
          waivedAmount: 0,
        });

        ledger.totalDue = ledger.entries.reduce((sum, e) => sum + e.amount, 0);
        const totalPaid = ledger.entries.reduce((sum, e) => sum + e.paidAmount, 0);
        const totalWaived = ledger.entries.reduce((sum, e) => sum + e.waivedAmount, 0);
        ledger.balance = ledger.totalDue - totalPaid - totalWaived;
        await ledger.save();
      }
    }

    res.status(201).json({
      success: true,
      data: allocation,
      message: 'Student allocated to hostel room successfully. Fee applied to ledger.',
    });
  } catch (error) {
    next(error);
  }
};

const vacateRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allocation = await HostelAllocation.findById(id);
    if (!allocation) {
      return res.status(404).json({ success: false, message: 'Allocation not found' });
    }

    if (allocation.vacatedDate) {
      return res.status(400).json({ success: false, message: 'Room already vacated' });
    }

    allocation.vacatedDate = new Date();
    await allocation.save();

    // Update Student
    const student = await Student.findById(allocation.student);
    if (student) {
      student.isBoarding = false;
      await student.save();
    }

    res.status(200).json({
      success: true,
      data: allocation,
      message: 'Student vacated room successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getAllocations = async (req, res, next) => {
  try {
    const { studentId, blockId, session } = req.query;
    const query = {};
    if (studentId) query.student = studentId;
    if (blockId) query.block = blockId;
    if (session) query.session = session;

    const allocations = await HostelAllocation.find(query)
      .populate('student')
      .populate('block')
      .sort({ allottedDate: -1 });

    res.status(200).json({
      success: true,
      data: allocations,
    });
  } catch (error) {
    next(error);
  }
};

// --- HOSTEL ATTENDANCE ---
const markAttendance = async (req, res, next) => {
  try {
    const { date, session_type, records } = req.body;
    if (!date || !session_type || !records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing fields' });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    const attendance = await HostelAttendance.findOneAndUpdate(
      { date: attendanceDate, session_type },
      { records, markedBy: req.user.id },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: attendance,
      message: 'Hostel attendance saved successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getAttendance = async (req, res, next) => {
  try {
    const { date, session_type } = req.query;
    if (!date || !session_type) {
      return res.status(400).json({ success: false, message: 'Missing date or session_type' });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    const attendance = await HostelAttendance.findOne({ date: attendanceDate, session_type })
      .populate('records.student')
      .populate('markedBy', 'name role');

    res.status(200).json({
      success: true,
      data: attendance || { date: attendanceDate, session_type, records: [] },
    });
  } catch (error) {
    next(error);
  }
};

// --- OUTINGS ---
const createOuting = async (req, res, next) => {
  try {
    const { studentId, destination, purpose, departDate, returnDate, contactDuring } = req.body;
    if (!studentId || !destination || !purpose || !departDate || !returnDate) {
      return res.status(400).json({ success: false, message: 'Missing required outing fields' });
    }

    const outing = await OutingRequest.create({
      student: studentId,
      destination,
      purpose,
      departDate: new Date(departDate),
      returnDate: new Date(returnDate),
      contactDuring,
      requestedBy: req.user.id,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      data: outing,
      message: 'Outing request submitted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const approveOuting = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const outing = await OutingRequest.findById(id);
    if (!outing) {
      return res.status(404).json({ success: false, message: 'Outing request not found' });
    }

    if (outing.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Outing request is already processed' });
    }

    // Check duration in hours
    const durationMs = new Date(outing.returnDate) - new Date(outing.departDate);
    const durationHours = durationMs / (1000 * 60 * 60);

    const userRole = req.user.role;

    // Outing Duration Approval Thresholds:
    // - Asst Warden: <= 24 hours
    // - Hostel Warden: <= 48 hours
    // - Principal / Vice Principal: any duration (required > 48 hours)
    let isAuthorized = false;
    let approvalLevel = 'asst_warden';

    if (durationHours <= 24) {
      if (['asst_hostel_warden', 'hostel_warden', 'principal', 'vice_principal'].includes(userRole)) {
        isAuthorized = true;
        approvalLevel = userRole.includes('asst') ? 'asst_warden' : (userRole.includes('warden') ? 'warden' : 'principal');
      }
    } else if (durationHours <= 48) {
      if (['hostel_warden', 'principal', 'vice_principal'].includes(userRole)) {
        isAuthorized = true;
        approvalLevel = userRole.includes('warden') ? 'warden' : 'principal';
      }
    } else {
      if (['principal', 'vice_principal'].includes(userRole)) {
        isAuthorized = true;
        approvalLevel = 'principal';
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Your role (${userRole}) is not authorized to approve an outing of duration ${durationHours.toFixed(1)} hours.`,
      });
    }

    outing.status = status;
    outing.approvalLevel = approvalLevel;
    outing.approvedBy = req.user.id;
    outing.approvedAt = new Date();
    await outing.save();

    res.status(200).json({
      success: true,
      data: outing,
      message: `Outing request ${status} successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

const getOutings = async (req, res, next) => {
  try {
    const { studentId, status } = req.query;
    const query = {};
    if (studentId) query.student = studentId;
    if (status) query.status = status;

    const outings = await OutingRequest.find(query)
      .populate('student')
      .populate('approvedBy', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: outings,
    });
  } catch (error) {
    next(error);
  }
};

const returnFromOuting = async (req, res, next) => {
  try {
    const { id } = req.params;
    const outing = await OutingRequest.findById(id);
    if (!outing) {
      return res.status(404).json({ success: false, message: 'Outing request not found' });
    }

    if (outing.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Outing request is not in approved state' });
    }

    outing.status = 'returned';
    outing.actualReturnDate = new Date();
    await outing.save();

    res.status(200).json({
      success: true,
      data: outing,
      message: 'Student marked returned from outing',
    });
  } catch (error) {
    next(error);
  }
};

// --- VISITOR LOG ---
const createVisitorLog = async (req, res, next) => {
  try {
    const { visitorName, visitorId, idType, meetingStudent, purpose } = req.body;
    if (!visitorName || !visitorId || !idType || !meetingStudent) {
      return res.status(400).json({ success: false, message: 'Missing required visitor fields' });
    }

    const log = await VisitorLog.create({
      visitorName,
      visitorId,
      idType,
      meetingStudent,
      purpose,
      loggedBy: req.user.id,
      inTime: new Date(),
    });

    res.status(201).json({
      success: true,
      data: log,
      message: 'Visitor log recorded successfully',
    });
  } catch (error) {
    next(error);
  }
};

const checkoutVisitor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const log = await VisitorLog.findById(id);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Visitor log not found' });
    }

    log.outTime = new Date();
    await log.save();

    res.status(200).json({
      success: true,
      data: log,
      message: 'Visitor checked out successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getVisitorLogs = async (req, res, next) => {
  try {
    const { meetingStudent } = req.query;
    const query = {};
    if (meetingStudent) query.meetingStudent = meetingStudent;

    const logs = await VisitorLog.find(query)
      .populate('meetingStudent')
      .populate('loggedBy', 'name role')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

// --- MESS MENU ---
const saveMessMenu = async (req, res, next) => {
  try {
    const { weekStartDate, menu } = req.body;
    if (!weekStartDate || !menu || !Array.isArray(menu)) {
      return res.status(400).json({ success: false, message: 'Missing or invalid weekStartDate or menu' });
    }

    const start = new Date(weekStartDate);
    start.setUTCHours(0, 0, 0, 0);

    const messMenu = await MessMenu.findOneAndUpdate(
      { weekStartDate: start },
      { menu, createdBy: req.user.id },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: messMenu,
      message: 'Mess menu saved successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getMessMenu = async (req, res, next) => {
  try {
    const { weekStartDate } = req.query;
    if (!weekStartDate) {
      return res.status(400).json({ success: false, message: 'Missing weekStartDate' });
    }

    const start = new Date(weekStartDate);
    start.setUTCHours(0, 0, 0, 0);

    const messMenu = await MessMenu.findOne({ weekStartDate: start });
    res.status(200).json({
      success: true,
      data: messMenu || { weekStartDate: start, menu: [] },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBlock,
  getBlocks,
  updateBlock,
  deleteBlock,
  allocateRoom,
  vacateRoom,
  getAllocations,
  markAttendance,
  getAttendance,
  createOuting,
  approveOuting,
  getOutings,
  returnFromOuting,
  createVisitorLog,
  checkoutVisitor,
  getVisitorLogs,
  saveMessMenu,
  getMessMenu,
};
