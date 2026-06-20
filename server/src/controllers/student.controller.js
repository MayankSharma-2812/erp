const Student = require('../models/Student');
const path = require('path');
const fs = require('fs');
const { generatePdfFromHtml } = require('../services/pdf.service');

const getStudents = async (req, res, next) => {
  try {
    const { classId, section, session, status } = req.query;
    const query = {};

    if (req.user && (req.user.role === 'student' || req.user.role === 'parent')) {
      query._id = req.user.studentProfile;
    } else {
      if (classId) query.class = classId;
      if (section) query.section = section;
      if (session) query.session = session;
      if (status) query.status = status;
      if (req.query.gender) query.gender = req.query.gender;
      if (req.query.isBoarding !== undefined && req.query.isBoarding !== '') {
        query.isBoarding = req.query.isBoarding === 'true';
      }
    }

    const students = await Student.find(query).populate('class').sort({ name: 1 });
    return res.status(200).json({
      success: true,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

const getStudentById = async (req, res, next) => {
  try {
    if (req.user && (req.user.role === 'student' || req.user.role === 'parent') && req.params.id !== req.user.studentProfile?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only access your own/linked student profile',
      });
    }

    const student = await Student.findById(req.params.id).populate('class');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    return res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

const createStudent = async (req, res, next) => {
  try {
    const student = await Student.create(req.body);
    return res.status(201).json({
      success: true,
      data: student,
      message: 'Student created successfully',
    });
  } catch (error) {
    next(error);
  }
};

const updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    return res.status(200).json({
      success: true,
      data: student,
      message: 'Student updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const generateStudentICardPdf = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate('class');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const className = student.class?.name || 'N/A';
    const dob = student.dob ? new Date(student.dob).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
    const fatherName = student.father?.name || 'N/A';
    const fatherPhone = student.father?.phone || 'N/A';
    const motherName = student.mother?.name || 'N/A';
    const addressLine = student.address ? `${student.address.line1 || ''}, ${student.address.city || ''}` : 'N/A';
    const bloodGroup = student.bloodGroup || 'N/A';

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f2f5; }
        .card {
          width: 350px; border-radius: 16px; overflow: hidden; background: #fff;
          box-shadow: 0 10px 40px rgba(0,0,0,0.12);
        }
        .card-header {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: white; padding: 20px 24px; text-align: center;
        }
        .card-header .school-name { font-size: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; }
        .card-header .school-sub { font-size: 10px; font-weight: 500; opacity: 0.85; margin-top: 2px; letter-spacing: 0.5px; }
        .card-header .badge { display: inline-block; margin-top: 8px; padding: 3px 12px; background: rgba(255,255,255,0.2); border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
        .card-body { padding: 20px 24px; }
        .photo-row { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; }
        .photo-box {
          width: 72px; height: 84px; background: #f3f4f6; border-radius: 10px;
          border: 2px solid #e5e7eb; display: flex; align-items: center; justify-content: center;
          font-size: 28px; color: #9ca3af; font-weight: 700; flex-shrink: 0;
        }
        .photo-info .student-name { font-size: 16px; font-weight: 800; color: #111827; }
        .photo-info .student-class { font-size: 12px; color: #6b7280; font-weight: 600; margin-top: 2px; }
        .photo-info .student-adm { font-size: 10px; color: #9ca3af; font-weight: 600; margin-top: 4px; font-family: monospace; letter-spacing: 0.5px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .info-item .info-label { font-size: 9px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.8px; }
        .info-item .info-value { font-size: 12px; font-weight: 600; color: #374151; margin-top: 1px; }
        .card-footer {
          background: #f9fafb; padding: 12px 24px; border-top: 1px solid #e5e7eb;
          display: flex; justify-content: space-between; align-items: center;
        }
        .card-footer .emergency { font-size: 9px; font-weight: 700; color: #dc2626; text-transform: uppercase; letter-spacing: 0.5px; }
        .card-footer .emergency-num { font-size: 11px; font-weight: 700; color: #374151; margin-top: 1px; }
        .card-footer .session { font-size: 10px; font-weight: 700; color: #6b7280; text-align: right; }
        .barcode { text-align: center; padding: 8px 24px 16px; background: #f9fafb; }
        .barcode-text { font-family: 'Courier New', monospace; font-size: 14px; letter-spacing: 4px; color: #374151; font-weight: 700; }
        .barcode-lines { margin-top: 4px; font-size: 6px; letter-spacing: 1px; color: #111827; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="card-header">
          <div class="school-name">Vidya Academy</div>
          <div class="school-sub">CBSE Affiliated Boarding School, New Delhi</div>
          <div class="badge">Student Identity Card</div>
        </div>
        <div class="card-body">
          <div class="photo-row">
            <div class="photo-box">${student.name.charAt(0)}</div>
            <div class="photo-info">
              <div class="student-name">${student.name}</div>
              <div class="student-class">${className} — Section ${student.section || 'A'}</div>
              <div class="student-adm">${student.admissionNumber}</div>
            </div>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Roll Number</div>
              <div class="info-value">${student.rollNumber || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Date of Birth</div>
              <div class="info-value">${dob}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Father's Name</div>
              <div class="info-value">${fatherName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Mother's Name</div>
              <div class="info-value">${motherName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Gender</div>
              <div class="info-value" style="text-transform:capitalize">${student.gender || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Blood Group</div>
              <div class="info-value">${bloodGroup}</div>
            </div>
            <div class="info-item" style="grid-column: 1 / -1;">
              <div class="info-label">Address</div>
              <div class="info-value">${addressLine}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Boarding</div>
              <div class="info-value">${student.isBoarding ? 'Boarder' : 'Day Scholar'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Library Card</div>
              <div class="info-value">${student.libraryCardNo || 'N/A'}</div>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <div>
            <div class="emergency">Emergency Contact</div>
            <div class="emergency-num">${fatherPhone}</div>
          </div>
          <div class="session">Session ${student.session || '2025-26'}</div>
        </div>
        <div class="barcode">
          <div class="barcode-text">${student.admissionNumber}</div>
          <div class="barcode-lines">||| |||| || ||| |||| || ||| |||| || |||</div>
        </div>
      </div>
    </body>
    </html>
    `;

    const uniqueId = `icard-${student._id}-${Date.now()}.pdf`;
    const pdfPath = path.resolve(__dirname, `../../uploads/generated/icards/${uniqueId}`);
    await generatePdfFromHtml(htmlContent, pdfPath);

    // Fallback to HTML if puppeteer is disabled
    if (fs.existsSync(pdfPath.replace('.pdf', '.html')) && !fs.existsSync(pdfPath)) {
      return res.status(200).sendFile(pdfPath.replace('.pdf', '.html'));
    }
    return res.status(200).sendFile(pdfPath);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  generateStudentICardPdf,
};
