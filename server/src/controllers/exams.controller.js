const Exam = require('../models/Exam');
const ExamSchedule = require('../models/ExamSchedule');
const HallTicket = require('../models/HallTicket');
const ExamResult = require('../models/ExamResult');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Student = require('../models/Student');
const User = require('../models/User');
const { generatePdfFromHtml } = require('../services/pdf.service');
const path = require('path');
const fs = require('fs');

// --- CBSE Grade Utility ---
const getCbseGrade = (pct) => {
  if (pct >= 91) return 'A1';
  if (pct >= 81) return 'A2';
  if (pct >= 71) return 'B1';
  if (pct >= 61) return 'B2';
  if (pct >= 51) return 'C1';
  if (pct >= 41) return 'C2';
  if (pct >= 33) return 'D';
  return 'E';
};

// Overlap check helpers
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(/\s+/);
  const time = parts[0];
  const modifier = parts[1] ? parts[1].toUpperCase() : 'AM';
  let [hours, minutes] = time.split(':').map(Number);
  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return hours * 60 + (minutes || 0);
};

const checkScheduleOverlap = (start1, end1, start2, end2) => {
  const s1 = parseTimeToMinutes(start1);
  const e1 = parseTimeToMinutes(end1);
  const s2 = parseTimeToMinutes(start2);
  const e2 = parseTimeToMinutes(end2);
  return s1 < e2 && s2 < e1;
};

// --- EXAM CRUD ---
const createExam = async (req, res, next) => {
  try {
    const exam = await Exam.create(req.body);
    return res.status(201).json({
      success: true,
      data: exam,
      message: 'Exam created successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getExams = async (req, res, next) => {
  try {
    const exams = await Exam.find({}).populate('classes').sort({ startDate: 1 });
    return res.status(200).json({
      success: true,
      data: exams,
    });
  } catch (error) {
    next(error);
  }
};

const getExamById = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('classes');
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    return res.status(200).json({
      success: true,
      data: exam,
    });
  } catch (error) {
    next(error);
  }
};

const updateExam = async (req, res, next) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    return res.status(200).json({
      success: true,
      data: exam,
      message: 'Exam details updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

const deleteExam = async (req, res, next) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    // Delete schedules associated with this exam
    await ExamSchedule.deleteMany({ exam: req.params.id });
    return res.status(200).json({
      success: true,
      message: 'Exam and associated schedules deleted',
    });
  } catch (error) {
    next(error);
  }
};

// --- EXAM SCHEDULES ---
const createSchedule = async (req, res, next) => {
  try {
    const examId = req.params.id;
    const { class: classId, section, subject, date, startTime, endTime, venue, invigilators } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Verify dates fall within the exam range
    const scheduleDate = new Date(date);
    if (scheduleDate < new Date(exam.startDate) || scheduleDate > new Date(exam.endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Exam schedule date must fall within the exam start and end date range.',
      });
    }

    // Check overlaps for the same class+section on the same date/time
    const existingClassSchedules = await ExamSchedule.find({
      class: classId,
      section,
      date: scheduleDate,
    });

    for (const sched of existingClassSchedules) {
      if (checkScheduleOverlap(startTime, endTime, sched.startTime, sched.endTime)) {
        return res.status(400).json({
          success: false,
          message: `Overlap Conflict: Class section is already scheduled for another exam on this date at ${sched.startTime} - ${sched.endTime}.`,
        });
      }
    }

    // Check overlaps for invigilators
    if (invigilators && invigilators.length > 0) {
      const invigSchedules = await ExamSchedule.find({
        date: scheduleDate,
        invigilators: { $in: invigilators },
      });

      for (const sched of invigSchedules) {
        if (checkScheduleOverlap(startTime, endTime, sched.startTime, sched.endTime)) {
          return res.status(400).json({
            success: false,
            message: `Overlap Conflict: One or more invigilators are already assigned to another venue at this time.`,
          });
        }
      }
    }

    const schedule = await ExamSchedule.create({
      exam: examId,
      class: classId,
      section,
      subject,
      date,
      startTime,
      endTime,
      venue,
      invigilators,
    });

    return res.status(201).json({
      success: true,
      data: schedule,
      message: 'Exam schedule configured successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getSchedules = async (req, res, next) => {
  try {
    const { classId, section } = req.query;
    const query = { exam: req.params.id };

    if (classId) query.class = classId;
    if (section) query.section = section;

    const schedules = await ExamSchedule.find(query)
      .populate('class subject invigilators')
      .sort({ date: 1, startTime: 1 });

    return res.status(200).json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    next(error);
  }
};

const deleteSchedule = async (req, res, next) => {
  try {
    const schedule = await ExamSchedule.findByIdAndDelete(req.params.scheduleId);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Exam schedule deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// --- SEATING ARRANGEMENT ---
const generateSeating = async (req, res, next) => {
  try {
    const examId = req.params.id;
    const { venues } = req.body; // Array: [{ name: 'Hall 1', capacity: 30 }]

    if (!venues || !Array.isArray(venues) || venues.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'A list of venues with capacities is required.',
      });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Fetch active students in all classes assigned to this exam
    const students = await Student.find({
      class: { $in: exam.classes },
      status: 'active',
    })
      .sort({ name: 1 })
      .populate('class');

    if (students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active students found in the classes assigned to this exam.',
      });
    }

    // Compute total capacity
    const totalCapacity = venues.reduce((acc, v) => acc + Number(v.capacity), 0);
    if (totalCapacity < students.length) {
      return res.status(400).json({
        success: false,
        message: `Insufficient capacity: Total seats available (${totalCapacity}) is less than the number of active students (${students.length}).`,
      });
    }

    // Fetch all exam schedules for this exam to populate hall ticket schedule entries
    const schedules = await ExamSchedule.find({ exam: examId }).populate('subject');

    // Deterministic distribution algorithm
    let studentIndex = 0;
    const hallTicketsPayloads = [];

    for (const venue of venues) {
      let seatNo = 1;
      const capacity = Number(venue.capacity);

      while (seatNo <= capacity && studentIndex < students.length) {
        const student = students[studentIndex];
        const studentSeatNo = `${venue.name} - S${String(seatNo).padStart(2, '0')}`;

        // Map exam schedules applicable to this student's class and section
        const studentClassId = student.class._id.toString();
        const studentSection = student.section || 'A';

        const applicableSchedules = schedules.filter(
          (s) =>
            s.class.toString() === studentClassId &&
            s.section === studentSection
        );

        const subjectsPayload = applicableSchedules.map((s) => ({
          subject: s.subject._id,
          date: s.date,
          time: `${s.startTime} - ${s.endTime}`,
          venue: s.venue,
          seatNo: studentSeatNo,
        }));

        hallTicketsPayloads.push({
          exam: examId,
          student: student._id,
          rollNumber: student.rollNumber || `ROLL-${student.admissionNumber.replace('ADM-', '')}`,
          subjects: subjectsPayload,
          generatedAt: new Date(),
        });

        seatNo++;
        studentIndex++;
      }
    }

    // Insert/Upsert Hall Tickets
    const writePromises = hallTicketsPayloads.map((ht) =>
      HallTicket.findOneAndUpdate(
        { exam: examId, student: ht.student },
        ht,
        { upsert: true, new: true }
      )
    );

    await Promise.all(writePromises);

    return res.status(200).json({
      success: true,
      message: `Successfully generated seating for ${students.length} students across ${venues.length} venues.`,
    });
  } catch (error) {
    next(error);
  }
};

const getSeating = async (req, res, next) => {
  try {
    const tickets = await HallTicket.find({ exam: req.params.id })
      .populate('student', 'name admissionNumber class section')
      .populate('subjects.subject', 'name code');

    return res.status(200).json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
};

// --- HALL TICKETS PDF ---
const generateHallTicketsMeta = async (req, res, next) => {
  try {
    const examId = req.params.id;
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const students = await Student.find({ class: { $in: exam.classes }, status: 'active' });
    const schedules = await ExamSchedule.find({ exam: examId }).populate('subject');

    const writePromises = students.map(async (student) => {
      const applicableSchedules = schedules.filter(
        (s) =>
          s.class.toString() === student.class.toString() &&
          s.section === student.section
      );

      const subjectsPayload = applicableSchedules.map((s) => ({
        subject: s.subject._id,
        date: s.date,
        time: `${s.startTime} - ${s.endTime}`,
        venue: s.venue,
        seatNo: '', // initialized empty, populated by seating arrangement
      }));

      return HallTicket.findOneAndUpdate(
        { exam: examId, student: student._id },
        {
          exam: examId,
          student: student._id,
          rollNumber: student.rollNumber || `ROLL-${student.admissionNumber.replace('ADM-', '')}`,
          subjects: subjectsPayload,
        },
        { upsert: true, new: true }
      );
    });

    await Promise.all(writePromises);

    return res.status(200).json({
      success: true,
      message: 'Hall ticket structures generated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

const getHallTickets = async (req, res, next) => {
  try {
    const tickets = await HallTicket.find({ exam: req.params.id })
      .populate('student', 'name admissionNumber class section')
      .populate('subjects.subject');
    return res.status(200).json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
};

const downloadBulkHallTickets = async (req, res, next) => {
  try {
    const examId = req.params.id;
    const exam = await Exam.findById(examId);
    const tickets = await HallTicket.find({ exam: examId })
      .populate('student')
      .populate('subjects.subject');

    if (tickets.length === 0) {
      return res.status(400).json({ success: false, message: 'No hall tickets generated yet.' });
    }

    // Build consolidated HTML string
    let htmlContent = `
      <html>
      <head>
        <style>
          body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 20px; }
          .ticket-card {
            border: 2px solid #e2e8f0;
            padding: 30px;
            border-radius: 16px;
            margin-bottom: 40px;
            page-break-after: always;
            background: #fff;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
          }
          .header { text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 22px; font-weight: bold; color: #4f46e5; text-transform: uppercase; }
          .school { font-size: 14px; color: #64748b; font-weight: 600; margin-top: 4px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
          .info-item { font-size: 13px; }
          .info-label { font-weight: 600; color: #64748b; }
          .info-val { font-weight: bold; color: #0f172a; margin-left: 5px; }
          table { wIdth: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #475569; }
          td { border: 1px solid #cbd5e1; padding: 10px; font-size: 12px; color: #334155; }
          .footer-signs { display: flex; justify-content: space-between; margin-top: 50px; font-size: 12px; font-weight: bold; color: #475569; }
          .sign-line { border-top: 1px solid #94a3b8; wIdth: 180px; text-align: center; padding-top: 5px; }
        </style>
      </head>
      <body>
    `;

    tickets.forEach((t) => {
      htmlContent += `
        <div class="ticket-card">
          <div class="header">
            <div class="title">VIDYA ACADEMY — BOARDING SCHOOL</div>
            <div class="school">EXAMINATION HALL TICKET</div>
          </div>
          <div class="info-grid">
            <div>
              <span class="info-item"><span class="info-label">Student Name:</span><span class="info-val">${t.student.name}</span></span><br/>
              <span class="info-item"><span class="info-label">Roll Number:</span><span class="info-val">${t.rollNumber || 'N/A'}</span></span>
            </div>
            <div>
              <span class="info-item"><span class="info-label">Exam:</span><span class="info-val">${exam.name} (${exam.session})</span></span><br/>
              <span class="info-item"><span class="info-label">Adm Number:</span><span class="info-val">${t.student.admissionNumber}</span></span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Date</th>
                <th>Time</th>
                <th>Venue</th>
                <th>Seat No</th>
              </tr>
            </thead>
            <tbody>
              ${t.subjects.map((sub) => `
                <tr>
                  <td><strong>${sub.subject?.name}</strong> (${sub.subject?.code})</td>
                  <td>${sub.date ? new Date(sub.date).toLocaleDateString() : 'TBD'}</td>
                  <td>${sub.time || 'TBD'}</td>
                  <td>${sub.venue || 'TBD'}</td>
                  <td><span style="font-weight: bold; color: #4f46e5;">${sub.seatNo || 'TBD'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer-signs">
            <div class="sign-line" style="margin-top: 30px;">Invigilator Signature</div>
            <div class="sign-line" style="margin-top: 30px;">Principal Signature</div>
          </div>
        </div>
      `;
    });

    htmlContent += `</body></html>`;

    const uniqueId = `bulk-${examId}-${Date.now()}.pdf`;
    const pdfPath = path.resolve(__dirname, `../../uploads/generated/halltickets/${uniqueId}`);
    
    await generatePdfFromHtml(htmlContent, pdfPath);
    
    // Check if pdf service fell back to HTML
    if (fs.existsSync(pdfPath.replace('.pdf', '.html')) && !fs.existsSync(pdfPath)) {
      return res.status(200).sendFile(pdfPath.replace('.pdf', '.html'));
    }
    
    return res.status(200).sendFile(pdfPath);
  } catch (error) {
    next(error);
  }
};

const downloadIndividualHallTicket = async (req, res, next) => {
  try {
    const ticketId = req.params.ticketId;
    const t = await HallTicket.findById(ticketId)
      .populate('student')
      .populate('subjects.subject')
      .populate('exam');

    if (!t) {
      return res.status(404).json({ success: false, message: 'Hall ticket not found.' });
    }

    const htmlContent = `
      <html>
      <head>
        <style>
          body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; }
          .ticket-card {
            border: 2px solid #e2e8f0;
            padding: 35px;
            border-radius: 20px;
            background: #fff;
            max-width: 800px;
            margin: 0 auto;
          }
          .header { text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 15px; margin-bottom: 25px; }
          .title { font-size: 24px; font-weight: bold; color: #4f46e5; text-transform: uppercase; }
          .school { font-size: 15px; color: #64748b; font-weight: 600; margin-top: 4px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; }
          .info-item { font-size: 14px; }
          .info-label { font-weight: 600; color: #64748b; }
          .info-val { font-weight: bold; color: #0f172a; margin-left: 5px; }
          table { wIdth: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #475569; }
          td { border: 1px solid #cbd5e1; padding: 12px; font-size: 13px; color: #334155; }
          .footer-signs { display: flex; justify-content: space-between; margin-top: 70px; font-size: 13px; font-weight: bold; color: #475569; }
          .sign-line { border-top: 1px solid #94a3b8; wIdth: 180px; text-align: center; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="ticket-card">
          <div class="header">
            <div class="title">VIDYA ACADEMY — BOARDING SCHOOL</div>
            <div class="school">EXAMINATION HALL TICKET</div>
          </div>
          <div class="info-grid">
            <div>
              <span class="info-item"><span class="info-label">Student Name:</span><span class="info-val">${t.student.name}</span></span><br/>
              <span class="info-item"><span class="info-label">Roll Number:</span><span class="info-val">${t.rollNumber || 'N/A'}</span></span>
            </div>
            <div>
              <span class="info-item"><span class="info-label">Exam:</span><span class="info-val">${t.exam.name} (${t.exam.session})</span></span><br/>
              <span class="info-item"><span class="info-label">Adm Number:</span><span class="info-val">${t.student.admissionNumber}</span></span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Date</th>
                <th>Time</th>
                <th>Venue</th>
                <th>Seat No</th>
              </tr>
            </thead>
            <tbody>
              ${t.subjects.map((sub) => `
                <tr>
                  <td><strong>${sub.subject?.name}</strong> (${sub.subject?.code})</td>
                  <td>${sub.date ? new Date(sub.date).toLocaleDateString() : 'TBD'}</td>
                  <td>${sub.time || 'TBD'}</td>
                  <td>${sub.venue || 'TBD'}</td>
                  <td><span style="font-weight: bold; color: #4f46e5;">${sub.seatNo || 'TBD'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer-signs">
            <div class="sign-line" style="margin-top: 30px;">Invigilator Signature</div>
            <div class="sign-line" style="margin-top: 30px;">Principal Signature</div>
          </div>
        </div>
      </body>
      </html>
    `;

    const uniqueId = `ticket-${ticketId}-${Date.now()}.pdf`;
    const pdfPath = path.resolve(__dirname, `../../uploads/generated/halltickets/${uniqueId}`);
    
    await generatePdfFromHtml(htmlContent, pdfPath);
    
    if (fs.existsSync(pdfPath.replace('.pdf', '.html')) && !fs.existsSync(pdfPath)) {
      return res.status(200).sendFile(pdfPath.replace('.pdf', '.html'));
    }
    
    return res.status(200).sendFile(pdfPath);
  } catch (error) {
    next(error);
  }
};

// --- EXAM RESULTS & MARKS ---
const getResults = async (req, res, next) => {
  try {
    const { classId, section, subjectId } = req.query;
    const query = { exam: req.params.id };

    if (subjectId) query.subject = subjectId;

    // Filter students by class and section if provided
    if (classId || section) {
      const studentQuery = {};
      if (classId) studentQuery.class = classId;
      if (section) studentQuery.section = section;
      const students = await Student.find(studentQuery).select('_id');
      query.student = { $in: students.map((s) => s._id) };
    }

    const results = await ExamResult.find(query)
      .populate('student', 'name admissionNumber rollNumber class section')
      .populate('subject');

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

const enterMarks = async (req, res, next) => {
  try {
    const examId = req.params.id;
    const { classId, section, subjectId, results } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }    // Subject teacher verification
    if (req.user.role === 'subject_teacher') {
      const subject = await Subject.findById(subjectId);
      if (!subject || subject.teacher.toString() !== req.user.id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Subject teachers can only enter/edit marks for their assigned subjects.',
        });
      }
    }

    // Upsert results
    const writePromises = results.map(async (resItem) => {
      const existing = await ExamResult.findOne({
        exam: examId,
        student: resItem.studentId,
        subject: subjectId,
      });

      // SEC-13 check: Reject write if published, unless Principal OR re-evaluation is requested
      if (exam.status === 'published' && req.user.role !== 'principal') {
        if (!existing || !existing.reEvalRequested) {
          throw new Error('Forbidden: Marks entry locked. Exam results are already published.');
        }
      }

      // Lock if approved and not draft, unless reEvalRequested
      if (existing && existing.approvedBy && exam.status !== 'draft' && !existing.reEvalRequested && req.user.role !== 'principal') {
        throw new Error(`Marks for student ID ${resItem.studentId} are approved and locked.`);
      }

      const theory = Number(resItem.theoryMarks || 0);
      const practical = Number(resItem.practicalMarks || 0);
      const max = Number(resItem.maxMarks || 100);
      const total = theory + practical;
      const pct = (total / max) * 100;

      // Status logic: pass if >= 33% else fail
      let status = 'pass';
      if (resItem.status === 'absent') status = 'absent';
      else if (resItem.status === 'withheld') status = 'withheld';
      else if (pct < 33) status = 'fail';

      return ExamResult.findOneAndUpdate(
        { exam: examId, student: resItem.studentId, subject: subjectId },
        {
          exam: examId,
          student: resItem.studentId,
          subject: subjectId,
          theoryMarks: theory,
          practicalMarks: practical,
          totalMarks: total,
          maxMarks: max,
          percentage: parseFloat(pct.toFixed(2)),
          grade: getCbseGrade(pct),
          status,
          enteredBy: req.user.id,
          // Re-evaluation Request clears edit lock once updated
          ...(existing && existing.reEvalRequested ? { reEvalRequested: false } : {}),
        },
        { upsert: true, new: true }
      );
    });

    await Promise.all(writePromises);

    return res.status(200).json({
      success: true,
      message: 'Marks entered and saved successfully.',
    });
  } catch (error) {
    const status = error.message.includes('Forbidden') ? 403 : 400;
    return res.status(status).json({
      success: false,
      message: error.message || 'Error saving marks',
    });
  }
};

const approveMarks = async (req, res, next) => {
  try {
    const examId = req.params.id;
    const { classId, section, subjectId } = req.body;

    const studentQuery = {};
    if (classId) studentQuery.class = classId;
    if (section) studentQuery.section = section;
    const students = await Student.find(studentQuery).select('_id');

    await ExamResult.updateMany(
      {
        exam: examId,
        subject: subjectId,
        student: { $in: students.map((s) => s._id) },
      },
      {
        approvedBy: req.user.id,
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Batch marks reviewed and approved successfully.',
    });
  } catch (error) {
    next(error);
  }
};

const publishResults = async (req, res, next) => {
  try {
    const examId = req.params.id;

    if (req.user.role !== 'principal') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the school Principal can publish exam results.',
      });
    }

    const exam = await Exam.findByIdAndUpdate(
      examId,
      {
        status: 'published',
        publishedBy: req.user.id,
        publishedAt: new Date(),
      },
      { new: true }
    );

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    return res.status(200).json({
      success: true,
      data: exam,
      message: 'Exam results published successfully and edits locked.',
    });
  } catch (error) {
    next(error);
  }
};

const requestReEval = async (req, res, next) => {
  try {
    const { resultId } = req.params;

    if (req.user.role !== 'principal') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the Principal can unlock results for re-evaluation.',
      });
    }

    const result = await ExamResult.findByIdAndUpdate(
      resultId,
      { reEvalRequested: true },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Re-evaluation requested. Marks entry is now unlocked for this student.',
    });
  } catch (error) {
    next(error);
  }
};

// --- REPORT CARD PDF ---
const generateReportCard = async (req, res, next) => {
  try {
    const examId = req.params.id;
    const studentId = req.params.studentId;

    const exam = await Exam.findById(examId);
    const student = await Student.findById(studentId).populate('class');
    if (!exam || !student) {
      return res.status(404).json({ success: false, message: 'Exam or student not found.' });
    }

    // Fetch all exam results for this student
    const results = await ExamResult.find({ exam: examId, student: studentId }).populate('subject');

    if (results.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No marks configured/recorded for this student.',
      });
    }

    // Rank Calculation (Aggregate class peer scores)
    const allPeerResults = await ExamResult.find({ exam: examId });
    const studentClassId = student.class._id.toString();
    const studentSection = student.section || 'A';
    
    // Find all class section students
    const classStudents = await Student.find({ class: studentClassId, section: studentSection, status: 'active' }).select('_id');
    const classStudentIds = classStudents.map((s) => s._id.toString());

    // Sum marks per peer student
    const peerTotals = {};
    allPeerResults.forEach((r) => {
      const pId = r.student.toString();
      if (classStudentIds.includes(pId)) {
        peerTotals[pId] = (peerTotals[pId] || 0) + (r.totalMarks || 0);
      }
    });

    const sortedPeers = Object.keys(peerTotals).map((id) => ({
      studentId: id,
      total: peerTotals[id],
    })).sort((a, b) => b.total - a.total);

    const rankIndex = sortedPeers.findIndex((p) => p.studentId === studentId);
    const rank = rankIndex !== -1 ? rankIndex + 1 : '--';

    // Summary calculations
    const grandTotal = results.reduce((acc, r) => acc + (r.totalMarks || 0), 0);
    const grandMax = results.reduce((acc, r) => acc + (r.maxMarks || 100), 0);
    const overallPct = grandMax > 0 ? (grandTotal / grandMax) * 100 : 0;
    const overallGrade = getCbseGrade(overallPct);

    const htmlContent = `
      <html>
      <head>
        <style>
          body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; background-color: #f8fafc; }
          .report-card {
            background: #ffffff;
            border: 2px solid #e2e8f0;
            border-radius: 24px;
            padding: 40px;
            max-width: 850px;
            margin: 0 auto;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
          }
          .header { text-align: center; border-bottom: 3px double #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
          .school-name { font-size: 28px; font-weight: 800; color: #4f46e5; letter-spacing: -0.025em; }
          .school-subtitle { font-size: 13px; color: #64748b; font-weight: 500; text-transform: uppercase; margin-top: 5px; }
          .report-title { font-size: 18px; font-weight: 700; color: #1e293b; margin-top: 15px; text-transform: uppercase; letter-spacing: 0.05em; }
          
          .student-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #f1f5f9; }
          .meta-item { font-size: 14px; margin-bottom: 8px; }
          .meta-label { font-weight: 600; color: #64748b; }
          .meta-val { font-weight: 700; color: #0f172a; margin-left: 6px; }

          table { wIdth: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #4f46e5; color: #ffffff; text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid #4f46e5; }
          td { padding: 12px 16px; border: 1px solid #e2e8f0; font-size: 13px; color: #334155; }
          tr:nth-child(even) td { background: #f8fafc; }
          .subject-name { font-weight: 700; color: #0f172a; }

          .summary-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 30px; margin-top: 20px; border-top: 2px solid #e2e8f0; padding-top: 20px; }
          .summary-card { background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 16px; padding: 20px; }
          .summary-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px; }
          .summary-label { font-weight: 600; color: #5b21b6; }
          .summary-val { font-weight: 800; color: #1e1b4b; }

          .grade-scale { font-size: 10px; color: #64748b; line-height: 1.5; }
          .grade-scale-title { font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 4px; }

          .signatures { display: flex; justify-content: space-between; margin-top: 60px; font-size: 13px; font-weight: 600; color: #475569; }
          .sign-line { border-top: 1px solid #cbd5e1; wIdth: 180px; text-align: center; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="report-card">
          <div class="header">
            <div class="school-name">VIDYA ACADEMY</div>
            <div class="school-subtitle">CBSE Boarding School Management System</div>
            <div class="report-title">Academic Achievement Report</div>
          </div>
          
          <div class="student-meta">
            <div>
              <div class="meta-item"><span class="meta-label">Student Name:</span><span class="meta-val">${student.name}</span></div>
              <div class="meta-item"><span class="meta-label">Class & Section:</span><span class="meta-val">${student.class?.name} - ${student.section || 'A'}</span></div>
              <div class="meta-item"><span class="meta-label">Admission Number:</span><span class="meta-val">${student.admissionNumber}</span></div>
            </div>
            <div>
              <div class="meta-item"><span class="meta-label">Examination:</span><span class="meta-val">${exam.name}</span></div>
              <div class="meta-item"><span class="meta-label">Academic Session:</span><span class="meta-val">${exam.session}</span></div>
              <div class="meta-item"><span class="meta-label">Date Generated:</span><span class="meta-val">${new Date().toLocaleDateString()}</span></div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Theory</th>
                <th>Practical</th>
                <th>Total Marks</th>
                <th>Max Marks</th>
                <th>Percentage</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              ${results.map((r) => `
                <tr>
                  <td class="subject-name">${r.subject?.name} (${r.subject?.code})</td>
                  <td>${r.status === 'absent' ? 'AB' : r.theoryMarks}</td>
                  <td>${r.status === 'absent' ? 'AB' : r.practicalMarks}</td>
                  <td><span style="font-weight: bold;">${r.status === 'absent' ? 'AB' : r.totalMarks}</span></td>
                  <td>${r.maxMarks}</td>
                  <td>${r.status === 'absent' ? '0%' : `${r.percentage}%`}</td>
                  <td><span style="font-weight: 700; color: #4f46e5;">${r.status === 'absent' ? 'E' : r.grade}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="summary-grid">
            <div class="grade-scale">
              <div class="grade-scale-title">CBSE Grading System Scale:</div>
              91-100: A1 (Outstanding) | 81-90: A2 (Excellent) | 71-80: B1 (Very Good) | 61-70: B2 (Good)<br/>
              51-60: C1 (Above Average) | 41-50: C2 (Average) | 33-40: D (Pass) | &lt;33: E (Essential Repeat / Fail)
            </div>
            <div class="summary-card">
              <div class="summary-row">
                <span class="summary-label">Grand Total:</span>
                <span class="summary-val">${grandTotal} / ${grandMax}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Percentage:</span>
                <span class="summary-val">${overallPct.toFixed(2)}%</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Overall Grade:</span>
                <span class="summary-val">${overallGrade}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Class Rank:</span>
                <span class="summary-val" style="color: #4f46e5; font-size: 16px;">${rank}</span>
              </div>
            </div>
          </div>

          <div class="signatures">
            <div class="sign-line">Class Teacher Signature</div>
            <div class="sign-line">Principal Signature</div>
          </div>
        </div>
      </body>
      </html>
    `;

    const uniqueId = `report-${studentId}-${Date.now()}.pdf`;
    const pdfPath = path.resolve(__dirname, `../../uploads/generated/reportcards/${uniqueId}`);
    
    await generatePdfFromHtml(htmlContent, pdfPath);

    if (fs.existsSync(pdfPath.replace('.pdf', '.html')) && !fs.existsSync(pdfPath)) {
      return res.status(200).sendFile(pdfPath.replace('.pdf', '.html'));
    }

    return res.status(200).sendFile(pdfPath);
  } catch (error) {
    next(error);
  }
};

const cbseExportStub = async (req, res, next) => {
  return res.status(501).json({
    success: false,
    message: 'CBSE board registration data export is not implemented. Format specs will be defined in Phase 5.',
  });
};

module.exports = {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
  createSchedule,
  getSchedules,
  deleteSchedule,
  generateSeating,
  getSeating,
  generateHallTicketsMeta,
  getHallTickets,
  downloadBulkHallTickets,
  downloadIndividualHallTicket,
  getResults,
  enterMarks,
  approveMarks,
  publishResults,
  requestReEval,
  generateReportCard,
  cbseExportStub,
};
