const express = require('express');
const studentController = require('../controllers/student.controller');
const protect = require('../middleware/auth');
const authorize = require('../middleware/rbac');

const router = express.Router();

router.get('/', protect, authorize('students', 'read'), studentController.getStudents);
router.get('/:id', protect, authorize('students', 'read'), studentController.getStudentById);
router.post('/', protect, authorize('students', 'write'), studentController.createStudent);
router.put('/:id', protect, authorize('students', 'write'), studentController.updateStudent);
router.delete('/:id', protect, authorize('students', 'delete'), studentController.deleteStudent);

module.exports = router;
