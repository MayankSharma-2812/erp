const Class = require('../models/Class');
const Subject = require('../models/Subject');
const TimetableSlot = require('../models/TimetableSlot');
const AcademicCalendar = require('../models/AcademicCalendar');
const LessonPlan = require('../models/LessonPlan');
const SyllabusTopic = require('../models/SyllabusTopic');

// --- CLASSES ---
const createClass = async (req, res, next) => {
  try {
    const classObj = await Class.create(req.body);
    return res.status(201).json({
      success: true,
      data: classObj,
      message: 'Class created successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getClasses = async (req, res, next) => {
  try {
    const classes = await Class.find({}).sort({ name: 1 });
    return res.status(200).json({
      success: true,
      data: classes,
    });
  } catch (error) {
    next(error);
  }
};

const getClassById = async (req, res, next) => {
  try {
    const classObj = await Class.findById(req.params.id);
    if (!classObj) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    return res.status(200).json({
      success: true,
      data: classObj,
    });
  } catch (error) {
    next(error);
  }
};

const updateClass = async (req, res, next) => {
  try {
    const classObj = await Class.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!classObj) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    return res.status(200).json({
      success: true,
      data: classObj,
      message: 'Class updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

const deleteClass = async (req, res, next) => {
  try {
    const classObj = await Class.findByIdAndDelete(req.params.id);
    if (!classObj) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Class deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// --- SUBJECTS ---
const createSubject = async (req, res, next) => {
  try {
    const subjectObj = await Subject.create(req.body);
    return res.status(201).json({
      success: true,
      data: subjectObj,
      message: 'Subject created successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getSubjects = async (req, res, next) => {
  try {
    const { classId, teacherId } = req.query;
    const query = {};
    if (classId) query.class = classId;
    if (teacherId) query.teacher = teacherId;

    const subjects = await Subject.find(query).populate('class teacher');
    return res.status(200).json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    next(error);
  }
};

const updateSubject = async (req, res, next) => {
  try {
    const subjectObj = await Subject.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!subjectObj) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    return res.status(200).json({
      success: true,
      data: subjectObj,
      message: 'Subject updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

const deleteSubject = async (req, res, next) => {
  try {
    const subjectObj = await Subject.findByIdAndDelete(req.params.id);
    if (!subjectObj) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Subject deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// --- TIMETABLE ---
const createSlot = async (req, res, next) => {
  try {
    const { class: classId, section, day, period, startTime, endTime, subject, teacher, session } = req.body;

    // Check for double booking conflicts in Class Section
    const classConflict = await TimetableSlot.findOne({
      class: classId,
      section,
      day,
      period,
      session,
    });

    if (classConflict) {
      return res.status(400).json({
        success: false,
        message: `Conflict: Period ${period} on ${day} is already scheduled for this class section.`,
      });
    }

    // Check if teacher is double booked in this period
    const teacherConflict = await TimetableSlot.findOne({
      teacher,
      day,
      period,
      session,
    });

    if (teacherConflict) {
      return res.status(400).json({
        success: false,
        message: `Conflict: Teacher is already booked for period ${period} on ${day} in another class.`,
      });
    }

    const slot = await TimetableSlot.create(req.body);
    return res.status(201).json({
      success: true,
      data: slot,
      message: 'Timetable slot created successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getSlots = async (req, res, next) => {
  try {
    const { classId, section, day, teacherId } = req.query;
    const query = {};

    if (classId) query.class = classId;
    if (section) query.section = section;
    if (day) query.day = day;
    if (teacherId) query.teacher = teacherId;

    const slots = await TimetableSlot.find(query).populate('class subject teacher');
    return res.status(200).json({
      success: true,
      data: slots,
    });
  } catch (error) {
    next(error);
  }
};

const deleteSlot = async (req, res, next) => {
  try {
    const slot = await TimetableSlot.findByIdAndDelete(req.params.id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Slot deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// --- ACADEMIC CALENDAR ---
const createEvent = async (req, res, next) => {
  try {
    const event = await AcademicCalendar.create(req.body);
    return res.status(201).json({
      success: true,
      data: event,
      message: 'Calendar event created successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getEvents = async (req, res, next) => {
  try {
    const events = await AcademicCalendar.find({}).sort({ date: 1 });
    return res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const event = await AcademicCalendar.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// --- LESSON PLANS ---
const uploadLessonPlan = async (req, res, next) => {
  try {
    const { title, class: classId, subject, session } = req.body;
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a lesson plan document (PDF/DOC)',
      });
    }

    // Generate local URL
    const fileUrl = `/uploads/lesson-plans/${req.file.filename}`;

    const lesson = await LessonPlan.create({
      title,
      class: classId,
      subject,
      teacher: req.user.id,
      fileUrl,
      session,
    });

    return res.status(201).json({
      success: true,
      data: lesson,
      message: 'Lesson plan uploaded successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getLessonPlans = async (req, res, next) => {
  try {
    const { classId, subjectId } = req.query;
    const query = {};
    if (classId) query.class = classId;
    if (subjectId) query.subject = subjectId;

    const plans = await LessonPlan.find(query).populate('class subject teacher');
    return res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    next(error);
  }
};

// --- SYLLABUS TOPICS ---
const createSyllabusTopic = async (req, res, next) => {
  try {
    const topic = await SyllabusTopic.create(req.body);
    return res.status(201).json({
      success: true,
      data: topic,
      message: 'Syllabus topic created successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getSyllabusTopics = async (req, res, next) => {
  try {
    const { classId, subjectId } = req.query;
    const query = {};
    if (classId) query.class = classId;
    if (subjectId) query.subject = subjectId;

    const topics = await SyllabusTopic.find(query).sort({ order: 1 });
    return res.status(200).json({
      success: true,
      data: topics,
    });
  } catch (error) {
    next(error);
  }
};

const updateSyllabusTopicStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['not_started', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const topic = await SyllabusTopic.findByIdAndUpdate(
      req.params.id,
      {
        status,
        updatedBy: req.user.id,
      },
      { new: true }
    );

    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    return res.status(200).json({
      success: true,
      data: topic,
      message: 'Syllabus progress updated',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass,
  createSubject,
  getSubjects,
  updateSubject,
  deleteSubject,
  createSlot,
  getSlots,
  deleteSlot,
  createEvent,
  getEvents,
  deleteEvent,
  uploadLessonPlan,
  getLessonPlans,
  createSyllabusTopic,
  getSyllabusTopics,
  updateSyllabusTopicStatus,
};
