const express = require('express');
const libraryController = require('../controllers/library.controller');
const protect = require('../middleware/auth');
const authorize = require('../middleware/rbac');

const router = express.Router();

// --- BOOKS ---
router.post('/books', protect, authorize('library', 'write'), libraryController.createBook);
router.get('/books', protect, authorize('library', 'read'), libraryController.getBooks);
router.put('/books/:id', protect, authorize('library', 'write'), libraryController.updateBook);
router.delete('/books/:id', protect, authorize('library', 'delete'), libraryController.deleteBook);

// --- ISSUES & RETURNS ---
router.post('/issues', protect, authorize('library', 'write'), libraryController.issueBook);
router.post('/issues/:id/return', protect, authorize('library', 'write'), libraryController.returnBook);
router.get('/issues', protect, authorize('library', 'read'), libraryController.getIssues);

// --- FINES ---
router.get('/fines', protect, authorize('library', 'read'), libraryController.getFines);

module.exports = router;
