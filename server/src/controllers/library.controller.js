const Book = require('../models/Book');
const BookIssue = require('../models/BookIssue');
const LibraryFine = require('../models/LibraryFine');
const FeeLedger = require('../models/FeeLedger');
const Student = require('../models/Student');

// --- BOOK CRUD ---
const createBook = async (req, res, next) => {
  try {
    const { copies } = req.body;
    const bookData = {
      ...req.body,
      available: copies,
    };
    const book = await Book.create(bookData);
    res.status(201).json({
      success: true,
      data: book,
      message: 'Book cataloged successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getBooks = async (req, res, next) => {
  try {
    const { search, subject } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } },
      ];
    }
    if (subject) {
      query.subject = { $regex: subject, $options: 'i' };
    }

    const books = await Book.find(query).sort({ title: 1 });
    res.status(200).json({
      success: true,
      data: books,
    });
  } catch (error) {
    next(error);
  }
};

const updateBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // Adjust available count if copies changed
    if (req.body.copies !== undefined) {
      const diff = req.body.copies - book.copies;
      req.body.available = book.available + diff;
    }

    const updated = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Book updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Book deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// --- ISSUE & RETURN BOOK ---
const issueBook = async (req, res, next) => {
  try {
    const { bookId, studentId, borrowerId, dueDate } = req.body;
    if (!bookId || !dueDate) {
      return res.status(400).json({ success: false, message: 'Missing bookId or dueDate' });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    if (book.available <= 0) {
      return res.status(400).json({ success: false, message: 'No available copies left for issue' });
    }

    // Decrement available copies
    book.available -= 1;
    await book.save();

    const issue = await BookIssue.create({
      book: bookId,
      student: studentId || null,
      borrower: borrowerId || null,
      dueDate: new Date(dueDate),
      status: 'issued',
    });

    res.status(201).json({
      success: true,
      data: issue,
      message: 'Book issued successfully',
    });
  } catch (error) {
    next(error);
  }
};

const returnBook = async (req, res, next) => {
  try {
    const issue = await BookIssue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Book issue record not found' });
    }

    if (issue.status === 'returned') {
      return res.status(400).json({ success: false, message: 'Book has already been returned' });
    }

    const book = await Book.findById(issue.book);
    if (book) {
      book.available += 1;
      await book.save();
    }

    const returnDate = new Date();
    issue.returnDate = returnDate;
    issue.status = 'returned';

    // Calculate fine if overdue (due date in the past relative to return date)
    const dueDate = new Date(issue.dueDate);
    let fineAmount = 0;
    if (returnDate > dueDate) {
      const diffMs = returnDate - dueDate;
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        fineAmount = diffDays * 10; // ₹10 per day overdue
        issue.fineAmount = fineAmount;
      }
    }

    await issue.save();

    // If fine occurred, write to LibraryFine and trigger Finance module linkage
    if (fineAmount > 0 && issue.student) {
      const student = await Student.findById(issue.student);
      const activeSession = student ? student.session : '2025-26';

      const fine = await LibraryFine.create({
        issue: issue._id,
        student: issue.student,
        days: Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24)),
        amount: fineAmount,
        status: 'pending',
      });

      // FINANCE LINKAGE: Append fine to active student fee ledger
      const ledger = await FeeLedger.findOne({ student: issue.student, session: activeSession });
      if (ledger) {
        ledger.entries.push({
          head: 'Library Overdue Fine',
          amount: fineAmount,
          dueDate: returnDate,
          status: 'pending',
          paidAmount: 0,
          waivedAmount: 0,
        });

        ledger.totalDue = ledger.entries.reduce((sum, e) => sum + e.amount, 0);
        const totalPaid = ledger.entries.reduce((sum, e) => sum + e.paidAmount, 0);
        const totalWaived = ledger.entries.reduce((sum, e) => sum + e.waivedAmount, 0);
        ledger.balance = ledger.totalDue - totalPaid - totalWaived;
        await ledger.save();
      }
    }

    res.status(200).json({
      success: true,
      data: issue,
      message: fineAmount > 0 
        ? `Book returned. Overdue fine of ₹${fineAmount} added to student fee ledger.` 
        : 'Book returned successfully with zero fines.',
    });
  } catch (error) {
    next(error);
  }
};

const getIssues = async (req, res, next) => {
  try {
    const { studentId, status } = req.query;
    const query = {};
    if (studentId) query.student = studentId;
    if (status) query.status = status;

    const issues = await BookIssue.find(query)
      .populate('book')
      .populate('student')
      .sort({ issueDate: -1 });

    res.status(200).json({
      success: true,
      data: issues,
    });
  } catch (error) {
    next(error);
  }
};

const getFines = async (req, res, next) => {
  try {
    const { studentId, status } = req.query;
    const query = {};
    if (studentId) query.student = studentId;
    if (status) query.status = status;

    const fines = await LibraryFine.find(query)
      .populate('student')
      .populate({
        path: 'issue',
        populate: { path: 'book' }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: fines,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBook,
  getBooks,
  updateBook,
  deleteBook,
  issueBook,
  returnBook,
  getIssues,
  getFines,
};
