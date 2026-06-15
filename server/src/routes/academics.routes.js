const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const academicsController = require('../controllers/academics.controller');
const protect = require('../middleware/auth');
const authorize = require('../middleware/rbac');

const router = express.Router();

// Multer Setup for Lesson Plans
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.resolve(__dirname, '../../uploads/lesson-plans');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (['.pdf', '.doc', '.docx'].includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX documents are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter });

// Classes
router.post('/classes', protect, authorize('academics', 'write'), academicsController.createClass);
router.get('/classes', protect, authorize('academics', 'read'), academicsController.getClasses);
router.get('/classes/:id', protect, authorize('academics', 'read'), academicsController.getClassById);
router.put('/classes/:id', protect, authorize('academics', 'write'), academicsController.updateClass);
router.delete('/classes/:id', protect, authorize('academics', 'delete'), academicsController.deleteClass);

// Subjects
router.post('/subjects', protect, authorize('academics', 'write'), academicsController.createSubject);
router.get('/subjects', protect, authorize('academics', 'read'), academicsController.getSubjects);
router.put('/subjects/:id', protect, authorize('academics', 'write'), academicsController.updateSubject);
router.delete('/subjects/:id', protect, authorize('academics', 'delete'), academicsController.deleteSubject);

// Timetable
router.post('/timetable', protect, authorize('academics', 'write'), academicsController.createSlot);
router.get('/timetable', protect, authorize('academics', 'read'), academicsController.getSlots);
router.delete('/timetable/:id', protect, authorize('academics', 'delete'), academicsController.deleteSlot);

// Calendar
router.post('/calendar', protect, authorize('academics', 'write'), academicsController.createEvent);
router.get('/calendar', protect, authorize('academics', 'read'), academicsController.getEvents);
router.delete('/calendar/:id', protect, authorize('academics', 'delete'), academicsController.deleteEvent);

// Lesson Plans
router.post('/lesson-plans', protect, authorize('academics', 'write'), upload.single('file'), academicsController.uploadLessonPlan);
router.get('/lesson-plans', protect, authorize('academics', 'read'), academicsController.getLessonPlans);

// Syllabus Progress
router.post('/syllabus', protect, authorize('academics', 'write'), academicsController.createSyllabusTopic);
router.get('/syllabus', protect, authorize('academics', 'read'), academicsController.getSyllabusTopics);
router.put('/syllabus/:id/status', protect, authorize('academics', 'write'), academicsController.updateSyllabusTopicStatus);

module.exports = router;
