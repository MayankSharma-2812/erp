const AttendanceRecord = require('../models/AttendanceRecord');
const User = require('../models/User');
const Student = require('../models/Student');

const markAttendance = async (req, res, next) => {
  try {
    const { classId, section, date, records } = req.body;

    if (!classId || !section || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request payload. Missing classId, section, date, or records.',
      });
    }

    // Standardize date to midnight
    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    // Enforce Class Teacher Scope Validation
    if (req.user.role === 'class_teacher') {
      const user = await User.findById(req.user.id);
      if (!user || !user.classAssigned || user.classAssigned.toString() !== classId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: class teachers can only mark attendance for their assigned class',
        });
      }
    }

    // Mark/Upsert records
    const promises = records.map(async (rec) => {
      return AttendanceRecord.findOneAndUpdate(
        {
          student: rec.studentId,
          date: attendanceDate,
          period: null, // null for consolidated daily attendance
          subject: null,
        },
        {
          student: rec.studentId,
          date: attendanceDate,
          class: classId,
          section,
          status: rec.status,
          markedBy: req.user.id,
        },
        { upsert: true, new: true }
      );
    });

    await Promise.all(promises);

    return res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getAttendance = async (req, res, next) => {
  try {
    const { classId, section, date } = req.query;
    if (!classId || !section || !date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required query parameters: classId, section, date',
      });
    }

    const queryDate = new Date(date);
    queryDate.setUTCHours(0, 0, 0, 0);

    const records = await AttendanceRecord.find({
      class: classId,
      section,
      date: queryDate,
      period: null,
      subject: null,
    }).populate('student', 'name admissionNumber rollNumber');

    return res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const { classId, section, startDate, endDate } = req.query;
    const query = { period: null, subject: null };

    if (classId) query.class = classId;
    if (section) query.section = section;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const records = await AttendanceRecord.find(query).populate('student', 'name');

    // Aggregate statistics in memory
    const statsMap = {};
    records.forEach((rec) => {
      if (!rec.student) return;
      const studentId = rec.student._id.toString();
      if (!statsMap[studentId]) {
        statsMap[studentId] = {
          studentId,
          name: rec.student.name,
          present: 0,
          absent: 0,
          late: 0,
          leave: 0,
          holiday: 0,
          total: 0,
        };
      }

      statsMap[studentId].total++;
      if (rec.status === 'present') statsMap[studentId].present++;
      else if (rec.status === 'absent') statsMap[studentId].absent++;
      else if (rec.status === 'late') statsMap[studentId].late++;
      else if (rec.status === 'leave') statsMap[studentId].leave++;
      else if (rec.status === 'holiday') statsMap[studentId].holiday++;
    });

    const stats = Object.values(statsMap).map((item) => {
      const activeCount = item.total - item.holiday; // exclude holidays
      const attendancePercent = activeCount > 0 ? ((item.present + item.late + item.leave) / activeCount) * 100 : 100;
      return {
        ...item,
        attendancePercent: parseFloat(attendancePercent.toFixed(1)),
      };
    });

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

const getConsecutiveAbsences = async (req, res, next) => {
  try {
    const { classId, section } = req.query;
    const query = { period: null, subject: null };
    if (classId) query.class = classId;
    if (section) query.section = section;

    // Fetch records sorted by date descending to scan consecutive records
    const records = await AttendanceRecord.find(query)
      .sort({ date: -1 })
      .populate('student', 'name admissionNumber');

    // Group records by student
    const studentRecords = {};
    records.forEach((rec) => {
      if (!rec.student) return;
      const studentId = rec.student._id.toString();
      if (!studentRecords[studentId]) {
        studentRecords[studentId] = {
          student: rec.student,
          history: [],
        };
      }
      studentRecords[studentId].history.push(rec.status);
    });

    // Detect 3+ consecutive absent days
    const flagged = [];
    Object.values(studentRecords).forEach((item) => {
      let maxConsecutive = 0;
      let currentConsecutive = 0;

      for (const status of item.history) {
        if (status === 'absent') {
          currentConsecutive++;
          if (currentConsecutive > maxConsecutive) {
            maxConsecutive = currentConsecutive;
          }
        } else {
          // Reset count on any attendance status other than absent
          currentConsecutive = 0;
        }
      }

      if (maxConsecutive >= 3) {
        flagged.push({
          studentId: item.student._id,
          name: item.student.name,
          admissionNumber: item.student.admissionNumber,
          consecutiveAbsentCount: maxConsecutive,
        });
      }
    });

    return res.status(200).json({
      success: true,
      data: flagged,
    });
  } catch (error) {
    next(error);
  }
};

const getMyStudentAttendance = async (req, res, next) => {
  try {
    const studentId = req.user.studentProfile;
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'No student profile linked to this account' });
    }

    const records = await AttendanceRecord.find({
      student: studentId,
      period: null,
      subject: null,
    }).sort({ date: -1 }).limit(90);

    let present = 0, absent = 0, late = 0, leave = 0, holiday = 0, total = 0;
    records.forEach(r => {
      total++;
      if (r.status === 'present') present++;
      else if (r.status === 'absent') absent++;
      else if (r.status === 'late') late++;
      else if (r.status === 'leave') leave++;
      else if (r.status === 'holiday') holiday++;
    });

    const activeDays = total - holiday;
    const attendanceRate = activeDays > 0 ? parseFloat(((present + late) / activeDays * 100).toFixed(1)) : 100;

    return res.status(200).json({
      success: true,
      data: {
        stats: { total, present, absent, late, leave, holiday, attendanceRate },
        records: records.map(r => ({ date: r.date, status: r.status })),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  markAttendance,
  getAttendance,
  getStats,
  getConsecutiveAbsences,
  getMyStudentAttendance,
};
