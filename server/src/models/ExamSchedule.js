const mongoose = require('mongoose');

const examScheduleSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam reference is required'],
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class reference is required'],
    },
    section: {
      type: String,
      required: [true, 'Section is required'],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
    },
    invigilators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Compound unique index to prevent duplicate schedules
examScheduleSchema.index(
  { exam: 1, class: 1, section: 1, subject: 1 },
  { unique: true }
);

const ExamSchedule = mongoose.model('ExamSchedule', examScheduleSchema);

module.exports = ExamSchedule;
