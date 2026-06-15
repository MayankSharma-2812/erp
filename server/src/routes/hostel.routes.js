const express = require('express');
const hostelController = require('../controllers/hostel.controller');
const protect = require('../middleware/auth');
const authorize = require('../middleware/rbac');

const router = express.Router();

// --- BLOCKS ---
router.post('/blocks', protect, authorize('hostel', 'write'), hostelController.createBlock);
router.get('/blocks', protect, authorize('hostel', 'read'), hostelController.getBlocks);
router.put('/blocks/:id', protect, authorize('hostel', 'write'), hostelController.updateBlock);
router.delete('/blocks/:id', protect, authorize('hostel', 'delete'), hostelController.deleteBlock);

// --- ALLOCATIONS ---
router.post('/allocations', protect, authorize('hostel', 'write'), hostelController.allocateRoom);
router.get('/allocations', protect, authorize('hostel', 'read'), hostelController.getAllocations);
router.post('/allocations/:id/vacate', protect, authorize('hostel', 'write'), hostelController.vacateRoom);

// --- ATTENDANCE ---
router.post('/attendance', protect, authorize('hostel', 'write'), hostelController.markAttendance);
router.get('/attendance', protect, authorize('hostel', 'read'), hostelController.getAttendance);

// --- OUTINGS ---
router.post('/outings', protect, authorize('hostel', 'write'), hostelController.createOuting);
router.get('/outings', protect, authorize('hostel', 'read'), hostelController.getOutings);
// We authorize outings approval under write. The controller itself validates duration vs role limits.
router.post('/outings/:id/approve', protect, authorize('hostel', 'write'), hostelController.approveOuting);
router.post('/outings/:id/return', protect, authorize('hostel', 'write'), hostelController.returnFromOuting);

// --- VISITORS ---
router.post('/visitors', protect, authorize('hostel', 'write'), hostelController.createVisitorLog);
router.get('/visitors', protect, authorize('hostel', 'read'), hostelController.getVisitorLogs);
router.post('/visitors/:id/checkout', protect, authorize('hostel', 'write'), hostelController.checkoutVisitor);

// --- MESS MENU ---
router.post('/mess/menu', protect, authorize('hostel', 'write'), hostelController.saveMessMenu);
router.get('/mess/menu', protect, authorize('hostel', 'read'), hostelController.getMessMenu);

module.exports = router;
