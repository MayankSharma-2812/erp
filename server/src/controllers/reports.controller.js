const AttendanceRecord = require('../models/AttendanceRecord');
const FeeLedger = require('../models/FeeLedger');
const ExamResult = require('../models/ExamResult');
const Student = require('../models/Student');
const User = require('../models/User');
const HostelAllocation = require('../models/HostelAllocation');
const Class = require('../models/Class');
const HostelBlock = require('../models/HostelBlock');
const path = require('path');
const fs = require('fs');
const { generatePdfFromHtml } = require('../services/pdf.service');

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

const generateBlankSheetPdf = async (req, res, next) => {
  try {
    const { type, classId, section, hostelBlockId } = req.query;
    let students = [];
    let sheetTitle = 'Blank Registration Sheet';

    if (type === 'class' && classId) {
      const classDoc = await Class.findById(classId);
      const query = { class: classId, status: 'active' };
      if (section) query.section = section;
      students = await Student.find(query).sort({ rollNumber: 1 });
      sheetTitle = `${classDoc?.name || 'Class'} ${section ? `- Section ${section}` : ''} — Student Register`;
    } else if (type === 'hostel' && hostelBlockId) {
      const block = await HostelBlock.findById(hostelBlockId);
      const allocations = await HostelAllocation.find({ block: hostelBlockId, vacatedDate: null })
        .populate('student')
        .sort({ roomNumber: 1, bedNumber: 1 });
      students = allocations.map(a => ({
        ...a.student?.toObject(),
        roomNumber: a.roomNumber,
        bedNumber: a.bedNumber,
      }));
      sheetTitle = `${block?.name || 'Hostel Block'} — Boarder Register`;
    } else {
      return res.status(400).json({ success: false, message: 'Missing type, classId, or hostelBlockId' });
    }

    const blankCols = Array.from({ length: 15 }, (_, i) => `<th style="min-width:28px; text-align:center; border:1px solid #9ca3af; padding:4px 2px; font-size:8px; color:#9ca3af;">${i + 1}</th>`).join('');

    const studentRows = students.map((s, idx) => {
      const blankCells = Array.from({ length: 15 }, () => `<td style="border:1px solid #d1d5db; padding:6px 2px;"></td>`).join('');
      const extraCol = type === 'hostel' ? `<td style="border:1px solid #d1d5db; padding:4px 6px; font-size:10px;">${s.roomNumber || ''}-${s.bedNumber || ''}</td>` : '';
      return `<tr>
        <td style="border:1px solid #d1d5db; padding:4px 6px; font-size:10px; text-align:center;">${idx + 1}</td>
        <td style="border:1px solid #d1d5db; padding:4px 6px; font-size:10px; white-space:nowrap;">${s.admissionNumber || ''}</td>
        <td style="border:1px solid #d1d5db; padding:4px 6px; font-size:11px; font-weight:600;">${s.name || ''}</td>
        ${extraCol}
        ${blankCells}
      </tr>`;
    }).join('');

    const extraHeader = type === 'hostel' ? '<th style="border:1px solid #9ca3af; padding:4px 6px; font-size:9px; background:#f3f4f6;">Room-Bed</th>' : '';

    const htmlContent = `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; padding: 24px; }
        .header { text-align: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #4f46e5; }
        .header h1 { font-size: 18px; font-weight: 800; color: #1f2937; text-transform: uppercase; letter-spacing: 1px; }
        .header p { font-size: 11px; color: #6b7280; margin-top: 4px; }
        .meta { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 10px; color: #6b7280; }
        table { width: 100%; border-collapse: collapse; }
        thead th { background: #f3f4f6; border: 1px solid #9ca3af; padding: 4px 6px; font-size: 9px; font-weight: 700; text-transform: uppercase; color: #374151; }
        @media print { body { padding: 10px; } @page { size: landscape; margin: 10mm; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Vidya Academy — Boarding School</h1>
        <p>${sheetTitle}</p>
      </div>
      <div class="meta">
        <span>Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        <span>Total Students: ${students.length}</span>
      </div>
      <table>
        <thead>
          <tr>
            <th style="border:1px solid #9ca3af; padding:4px 6px; font-size:9px; background:#f3f4f6;">S.No</th>
            <th style="border:1px solid #9ca3af; padding:4px 6px; font-size:9px; background:#f3f4f6;">Adm No</th>
            <th style="border:1px solid #9ca3af; padding:4px 6px; font-size:9px; background:#f3f4f6;">Student Name</th>
            ${extraHeader}
            ${blankCols}
          </tr>
        </thead>
        <tbody>${studentRows}</tbody>
      </table>
    </body>
    </html>`;

    const uniqueId = `blank-${type}-${Date.now()}.pdf`;
    const pdfPath = path.resolve(__dirname, `../../uploads/generated/sheets/${uniqueId}`);
    await generatePdfFromHtml(htmlContent, pdfPath);

    if (fs.existsSync(pdfPath.replace('.pdf', '.html')) && !fs.existsSync(pdfPath)) {
      return res.status(200).sendFile(pdfPath.replace('.pdf', '.html'));
    }
    return res.status(200).sendFile(pdfPath);
  } catch (error) {
    next(error);
  }
};

const getBirthdaysToday = async (req, res, next) => {
  try {
    const now = new Date();
    const todayMonth = now.getMonth() + 1; // 1-12
    const todayDay = now.getDate();

    // Student birthdays
    const allStudents = await Student.find({ status: 'active' }).populate('class').lean();
    const studentBirthdays = allStudents.filter(s => {
      if (!s.dob) return false;
      const d = new Date(s.dob);
      return d.getMonth() + 1 === todayMonth && d.getDate() === todayDay;
    }).map(s => ({
      _id: s._id,
      name: s.name,
      type: 'student',
      className: s.class?.name || 'N/A',
      section: s.section || '',
      dob: s.dob,
    }));

    // Staff birthdays
    const allStaff = await User.find({ isActive: true, role: { $nin: ['student', 'parent'] } }).lean();
    const staffBirthdays = allStaff.filter(u => {
      if (!u.dob) return false;
      const d = new Date(u.dob);
      return d.getMonth() + 1 === todayMonth && d.getDate() === todayDay;
    }).map(u => ({
      _id: u._id,
      name: u.name,
      type: 'staff',
      role: u.role,
      dob: u.dob,
    }));

    res.status(200).json({
      success: true,
      data: {
        students: studentBirthdays,
        staff: staffBirthdays,
        total: studentBirthdays.length + staffBirthdays.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPrincipalSummary,
  getDetailedReport,
  generateBlankSheetPdf,
  getBirthdaysToday,
};
