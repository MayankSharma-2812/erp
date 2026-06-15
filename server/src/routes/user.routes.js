const express = require('express');
const userController = require('../controllers/user.controller');
const protect = require('../middleware/auth');
const authorize = require('../middleware/rbac');

const router = express.Router();

router.get('/', protect, authorize('students', 'read'), userController.getUsers);
router.put('/:id', protect, authorize('students', 'write'), userController.updateUser);

module.exports = router;
