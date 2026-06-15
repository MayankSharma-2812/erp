const mongoose = require('mongoose');

const examResultSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam reference is required'],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required'],
    },
    theoryMarks: {
      type: Number,
      min: 0,
    },
    practicalMarks: {
      type: Number,
      min: 0,
    },
    totalMarks: {
      type: Number,
      min: 0,
    },
    maxMarks: {
      type: Number,
      default: 100,
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    grade: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pass', 'fail', 'absent', 'withheld'],
      default: 'pass',
    },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Entered by user is required'],
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reEvalRequested: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Compound unique index on exam + student + subject
examResultSchema.index({ exam: 1, student: 1, subject: 1 }, { unique: true });

const ExamResult = mongoose.model('ExamResult', examResultSchema);

module.exports = ExamResult;
