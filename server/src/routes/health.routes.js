const express = require('express');
const healthController = require('../controllers/health.controller');
const protect = require('../middleware/auth');
const authorize = require('../middleware/rbac');

const router = express.Router();

// --- HEALTH PROFILE ---
router.post('/profile', protect, authorize('health', 'write'), healthController.upsertHealthProfile);
router.get('/profile/:studentId', protect, authorize('health', 'read'), healthController.getHealthProfile);

// --- CLINIC VISITS ---
router.post('/visits', protect, authorize('health', 'write'), healthController.createClinicVisit);
router.get('/visits', protect, authorize('health', 'read'), healthController.getClinicVisits);

// --- SICKBAY ---
router.post('/sickbay', protect, authorize('health', 'write'), healthController.admitToSickbay);
router.get('/sickbay/active', protect, authorize('health', 'read'), healthController.getActiveSickbay);
router.put('/sickbay/:id/progress', protect, authorize('health', 'write'), healthController.updateSickbayProgress);
router.put('/sickbay/:id/discharge', protect, authorize('health', 'write'), healthController.dischargeFromSickbay);

module.exports = router;
