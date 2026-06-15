const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Exam name is required'],
    },
    type: {
      type: String,
      enum: ['unit_test', 'half_yearly', 'annual', 'board', 'mock'],
      required: [true, 'Exam type is required'],
    },
    classes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
      },
    ],
    session: {
      type: String,
      required: [true, 'Session is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'ongoing', 'completed', 'published'],
      default: 'draft',
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

examSchema.index({ status: 1 });
examSchema.index({ session: 1 });

const Exam = mongoose.model('Exam', examSchema);

module.exports = Exam;
