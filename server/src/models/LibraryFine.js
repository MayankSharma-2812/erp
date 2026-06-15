const mongoose = require('mongoose');

const libraryFineSchema = new mongoose.Schema(
  {
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookIssue',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    days: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'collected', 'waived'],
      default: 'pending',
    },
    collectedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

libraryFineSchema.index({ student: 1 });
libraryFineSchema.index({ status: 1 });

const LibraryFine = mongoose.model('LibraryFine', libraryFineSchema);

module.exports = LibraryFine;
