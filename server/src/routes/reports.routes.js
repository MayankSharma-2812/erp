const express = require('express');
const reportsController = require('../controllers/reports.controller');
const protect = require('../middleware/auth');
const authorize = require('../middleware/rbac');

const router = express.Router();

router.get('/summary', protect, authorize('reports', 'read'), reportsController.getPrincipalSummary);
router.get('/detailed', protect, authorize('reports', 'read'), reportsController.getDetailedReport);
router.get('/blank-sheet', protect, authorize('reports', 'read'), reportsController.generateBlankSheetPdf);
router.get('/birthdays', protect, reportsController.getBirthdaysToday);

module.exports = router;
