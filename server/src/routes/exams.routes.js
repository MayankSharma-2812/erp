const express = require('express');
const examsController = require('../controllers/exams.controller');
const protect = require('../middleware/auth');
const authorize = require('../middleware/rbac');

const router = express.Router();

// Exam CRUD
router.post('/', protect, authorize('exams', 'write'), examsController.createExam);
router.get('/', protect, authorize('exams', 'read'), examsController.getExams);
router.get('/:id', protect, authorize('exams', 'read'), examsController.getExamById);
router.put('/:id', protect, authorize('exams', 'write'), examsController.updateExam);
router.delete('/:id', protect, authorize('exams', 'delete'), examsController.deleteExam);

// Exam Schedules
router.post('/:id/schedules', protect, authorize('exams', 'write'), examsController.createSchedule);
router.get('/:id/schedules', protect, authorize('exams', 'read'), examsController.getSchedules);
router.delete('/:id/schedules/:scheduleId', protect, authorize('exams', 'delete'), examsController.deleteSchedule);

// Seating arrangements
router.post('/:id/seating', protect, authorize('exams', 'write'), examsController.generateSeating);
router.get('/:id/seating', protect, authorize('exams', 'read'), examsController.getSeating);

// Hall tickets
router.post('/:id/hall-tickets/generate', protect, authorize('exams', 'write'), examsController.generateHallTicketsMeta);
router.get('/:id/hall-tickets', protect, authorize('exams', 'read'), examsController.getHallTickets);
router.get('/:id/hall-tickets/download', protect, authorize('exams', 'read'), examsController.downloadBulkHallTickets);
router.get('/:id/hall-tickets/:ticketId/download', protect, authorize('exams', 'read'), examsController.downloadIndividualHallTicket);

// Results & Marks
router.get('/:id/results', protect, authorize('exams', 'read'), examsController.getResults);
router.post('/:id/results', protect, authorize('exams', 'write'), examsController.enterMarks);
router.post('/:id/results/approve', protect, authorize('exams', 'write'), examsController.approveMarks);
router.post('/:id/results/publish', protect, authorize('exams', 'write'), examsController.publishResults);
router.post('/:id/results/:resultId/reeval', protect, authorize('exams', 'write'), examsController.requestReEval);
router.get('/:id/report-card/:studentId', protect, authorize('exams', 'read'), examsController.generateReportCard);

// CBSE export stub
router.get('/:id/cbse-export', protect, authorize('exams', 'read'), examsController.cbseExportStub);

module.exports = router;
