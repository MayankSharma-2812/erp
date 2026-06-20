const express = require('express');
const hrController = require('../controllers/hr.controller');
const protect = require('../middleware/auth');
const authorize = require('../middleware/rbac');

const router = express.Router();

// --- STAFF ATTENDANCE ---
router.post('/attendance', protect, authorize('attendance', 'write'), hrController.markStaffAttendance);
router.get('/attendance', protect, authorize('attendance', 'read'), hrController.getStaffAttendance);

// --- SELF-SERVICE (any logged-in staff) ---
router.get('/my-attendance', protect, hrController.getMyStaffAttendance);
router.get('/my-leaves-summary', protect, hrController.getMyLeavesSummary);

// --- LEAVES ---
// Any logged in staff can apply for a leave request
router.post('/leaves', protect, hrController.applyLeave);
router.get('/leaves', protect, authorize('hr_payroll', 'read'), hrController.getLeaves);
router.post('/leaves/:id/approve', protect, authorize('hr_payroll', 'write'), hrController.approveLeave);

// --- PAYROLL RUNS ---
router.post('/payroll/run', protect, authorize('hr_payroll', 'write'), hrController.initiatePayrollRun);
router.get('/payroll/runs', protect, authorize('hr_payroll', 'read'), hrController.getPayrollRuns);
router.get('/payroll/runs/:id', protect, authorize('hr_payroll', 'read'), hrController.getPayrollRunById);
router.put('/payroll/runs/:runId/payslips/:payslipId', protect, authorize('hr_payroll', 'write'), hrController.updateDraftPayslip);
router.post('/payroll/runs/:id/submit', protect, authorize('hr_payroll', 'write'), hrController.submitPayrollRun);
router.post('/payroll/runs/:id/approve', protect, authorize('hr_payroll', 'write'), hrController.approvePayrollRun);
router.post('/payroll/runs/:id/disburse', protect, authorize('hr_payroll', 'write'), hrController.disbursePayrollRun);

// --- PAYSLIPS ---
router.get('/payslips', protect, hrController.getPayslips);
router.get('/payslips/:id', protect, hrController.getPayslipById);

module.exports = router;
