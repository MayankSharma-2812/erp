const express = require('express');
const financeController = require('../controllers/finance.controller');
const protect = require('../middleware/auth');
const authorize = require('../middleware/rbac');

const router = express.Router();

// --- FEE STRUCTURES ---
router.post('/structures', protect, authorize('finance', 'write'), financeController.createFeeStructure);
router.get('/structures', protect, authorize('finance', 'read'), financeController.getFeeStructures);
router.put('/structures/:id', protect, authorize('finance', 'write'), financeController.updateFeeStructure);
router.delete('/structures/:id', protect, authorize('finance', 'write'), financeController.deleteFeeStructure);

// --- STUDENT FEE LEDGER ---
router.get('/ledger/student/:studentId', protect, authorize('finance', 'read'), financeController.getStudentLedger);

// --- RAZORPAY ONLINE PAYMENTS ---
router.post('/razorpay/order', protect, authorize('finance', 'read'), financeController.createRazorpayOrder);
// Razorpay Webhook is public (verified via HMAC signature in controller)
router.post('/razorpay/webhook', financeController.razorpayWebhook);

// --- MANUAL PAYMENTS & COUNTERSIGNS ---
router.post('/manual', protect, authorize('finance', 'write'), financeController.createManualPayment);
router.get('/countersigns', protect, authorize('finance', 'read'), financeController.getPendingCountersigns);
router.post('/countersigns/:id/approve', protect, authorize('finance', 'write'), financeController.countersignPayment);
router.post('/countersigns/:id/reject', protect, authorize('finance', 'write'), financeController.rejectCountersign);

// --- REPORTS ---
router.get('/defaulters', protect, authorize('finance', 'read'), financeController.getDefaulters);

// --- EXPENSES ---
router.post('/expenses', protect, authorize('finance', 'write'), financeController.createExpense);
router.get('/expenses', protect, authorize('finance', 'read'), financeController.getExpenses);
router.put('/expenses/:id', protect, authorize('finance', 'write'), financeController.updateExpense);
router.delete('/expenses/:id', protect, authorize('finance', 'write'), financeController.deleteExpense);

// --- BUDGETS ---
router.post('/budgets', protect, authorize('finance', 'write'), financeController.createBudget);
router.get('/budgets', protect, authorize('finance', 'read'), financeController.getBudgets);
router.get('/budgets/vs-actual', protect, authorize('finance', 'read'), financeController.getBudgetVsActual);
router.put('/budgets/:id', protect, authorize('finance', 'write'), financeController.updateBudget);
router.delete('/budgets/:id', protect, authorize('finance', 'write'), financeController.deleteBudget);

// --- FEE WAIVERS ---
router.post('/waivers', protect, authorize('finance', 'write'), financeController.requestWaiver);
router.get('/waivers', protect, authorize('finance', 'read'), financeController.getWaivers);
router.post('/waivers/:id/approve', protect, authorize('finance', 'write'), financeController.approveWaiver);
router.post('/waivers/:id/reject', protect, authorize('finance', 'write'), financeController.rejectWaiver);

module.exports = router;
