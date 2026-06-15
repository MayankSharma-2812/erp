const express = require('express');
const admissionsController = require('../controllers/admissions.controller');
const protect = require('../middleware/auth');
const authorize = require('../middleware/rbac');

const router = express.Router();

router.post('/enquiries', protect, authorize('admissions', 'write'), admissionsController.createEnquiry);
router.get('/enquiries', protect, authorize('admissions', 'read'), admissionsController.getEnquiries);
router.get('/enquiries/:id', protect, authorize('admissions', 'read'), admissionsController.getEnquiryById);
router.put('/enquiries/:id', protect, authorize('admissions', 'write'), admissionsController.updateEnquiry);

router.post('/enquiries/:id/apply', protect, authorize('admissions', 'write'), admissionsController.applyEnquiry);
router.post('/enquiries/:id/test', protect, authorize('admissions', 'write'), admissionsController.enterTestScore);
router.post('/enquiries/:id/allocate', protect, authorize('admissions', 'write'), admissionsController.allocateSeat);
router.post('/enquiries/:id/confirm', protect, authorize('admissions', 'write'), admissionsController.confirmAdmission);

module.exports = router;
