const mongoose = require('mongoose');

const bookIssueSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    borrower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // If a staff member borrows it
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student', // If a student borrows it
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    returnDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['issued', 'returned', 'overdue', 'lost'],
      default: 'issued',
    },
    fineAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

bookIssueSchema.index({ student: 1 });
bookIssueSchema.index({ status: 1 });

const BookIssue = mongoose.model('BookIssue', bookIssueSchema);

module.exports = BookIssue;
