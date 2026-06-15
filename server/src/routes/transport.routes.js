const express = require('express');
const transportController = require('../controllers/transport.controller');
const protect = require('../middleware/auth');
const authorize = require('../middleware/rbac');

const router = express.Router();

// --- ROUTES ---
router.post('/routes', protect, authorize('transport', 'write'), transportController.createRoute);
router.get('/routes', protect, authorize('transport', 'read'), transportController.getRoutes);
router.put('/routes/:id', protect, authorize('transport', 'write'), transportController.updateRoute);
router.delete('/routes/:id', protect, authorize('transport', 'delete'), transportController.deleteRoute);

// --- VEHICLES ---
router.post('/vehicles', protect, authorize('transport', 'write'), transportController.createVehicle);
router.get('/vehicles', protect, authorize('transport', 'read'), transportController.getVehicles);
router.put('/vehicles/:id', protect, authorize('transport', 'write'), transportController.updateVehicle);
router.delete('/vehicles/:id', protect, authorize('transport', 'delete'), transportController.deleteVehicle);

// --- DRIVERS ---
router.post('/drivers', protect, authorize('transport', 'write'), transportController.createDriver);
router.get('/drivers', protect, authorize('transport', 'read'), transportController.getDrivers);
router.put('/drivers/:id', protect, authorize('transport', 'write'), transportController.updateDriver);
router.delete('/drivers/:id', protect, authorize('transport', 'delete'), transportController.deleteDriver);

// --- ALLOCATIONS ---
router.post('/allocations', protect, authorize('transport', 'write'), transportController.allocateTransport);
router.get('/allocations', protect, authorize('transport', 'read'), transportController.getAllocations);

module.exports = router;
