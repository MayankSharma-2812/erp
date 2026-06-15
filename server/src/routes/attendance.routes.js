const express = require('express');
const attendanceController = require('../controllers/attendance.controller');
const protect = require('../middleware/auth');
const authorize = require('../middleware/rbac');

const router = express.Router();

router.post('/', protect, authorize('attendance', 'write'), attendanceController.markAttendance);
router.get('/', protect, authorize('attendance', 'read'), attendanceController.getAttendance);
router.get('/stats', protect, authorize('attendance', 'read'), attendanceController.getStats);
router.get('/consecutive-absences', protect, authorize('attendance', 'read'), attendanceController.getConsecutiveAbsences);

module.exports = router;
