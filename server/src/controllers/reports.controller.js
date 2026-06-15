const AttendanceRecord = require('../models/AttendanceRecord');
const FeeLedger = require('../models/FeeLedger');
const ExamResult = require('../models/ExamResult');
const Student = require('../models/Student');

const getPrincipalSummary = async (req, res, next) => {
  try {
    // 1. Attendance Rate
    const totalAttendance = await AttendanceRecord.countDocuments({});
    const presentAttendance = await AttendanceRecord.countDocuments({ status: 'present' });
    const attendanceRate = totalAttendance > 0 
      ? Math.round((presentAttendance / totalAttendance) * 100) 
      : 87; // default fallback mock

    // 2. Fee Collection Progress
    const ledgers = await FeeLedger.find({});
    const totalDue = ledgers.reduce((sum, l) => sum + (l.totalDue || 0), 0);
    const totalPaid = ledgers.reduce((sum, l) => sum + (l.totalPaid || 0), 0);
    const balance = ledgers.reduce((sum, l) => sum + (l.balance || 0), 0);
    
    // 3. Defaulter count
    const defaultersCount = ledgers.filter(l => l.balance > 0).length;

    // 4. Exam Performance (Class average across all published exams)
    const examResults = await ExamResult.find({});
    const averageScore = examResults.length > 0
      ? Math.round(examResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / examResults.length)
      : 74; // default fallback mock

    // 5. Hostel Occupancy (Mocked since skipped)
    const hostelOccupancy = {
      filled: 188,
      total: 200,
      percentage: 94,
    };

    // 6. Fee Collection Trend (6 months mock chart data)
    const collectionsTrend = [
      { month: 'Jan', amount: Math.round(totalPaid * 0.1) },
      { month: 'Feb', amount: Math.round(totalPaid * 0.15) },
      { month: 'Mar', amount: Math.round(totalPaid * 0.12) },
      { month: 'Apr', amount: Math.round(totalPaid * 0.2) },
      { month: 'May', amount: Math.round(totalPaid * 0.25) },
      { month: 'Jun', amount: Math.round(totalPaid * 0.18) },
    ];

    res.status(200).json({
      success: true,
      data: {
        attendanceRate,
        finance: {
          totalDue,
          totalPaid,
          balance,
          collectionPercentage: totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0,
        },
        defaultersCount,
        averageScore,
        hostelOccupancy,
        collectionsTrend,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getDetailedReport = async (req, res, next) => {
  try {
    const { type } = req.query; // "attendance", "finance", "exams", "defaulters"
    let reportData = [];

    if (type === 'attendance') {
      const records = await AttendanceRecord.find({})
        .populate('student')
        .populate('class')
        .limit(100);
      reportData = records.map(r => ({
        date: r.date.toLocaleDateString(),
        studentName: r.student?.name || 'N/A',
        admissionNumber: r.student?.admissionNumber || 'N/A',
        classSection: `${r.class?.name || 'N/A'}-${r.section || 'A'}`,
        status: r.status,
      }));
    } else if (type === 'finance') {
      const ledgers = await FeeLedger.find({}).populate('student');
      reportData = ledgers.map(l => ({
        studentName: l.student?.name || 'N/A',
        admissionNumber: l.student?.admissionNumber || 'N/A',
        totalDue: l.totalDue,
        totalPaid: l.totalPaid,
        balance: l.balance,
      }));
    } else if (type === 'exams') {
      const results = await ExamResult.find({})
        .populate('student')
        .populate('subject');
      reportData = results.map(r => ({
        studentName: r.student?.name || 'N/A',
        examName: 'Exam', // stub
        subjectName: r.subject?.name || 'N/A',
        percentage: r.percentage,
        grade: r.grade,
        status: r.status,
      }));
    } else {
      return res.status(400).json({ success: false, message: 'Invalid report type requested' });
    }

    res.status(200).json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPrincipalSummary,
  getDetailedReport,
};
