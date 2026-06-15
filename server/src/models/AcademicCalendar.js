const mongoose = require('mongoose');

const academicCalendarSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
    },
    type: {
      type: String,
      enum: ['holiday', 'exam', 'event', 'other'],
      required: [true, 'Event type is required'],
    },
    appliesto: {
      type: String,
      default: 'all',
    },
    note: {
      type: String,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

academicCalendarSchema.index({ date: 1 });

const AcademicCalendar = mongoose.model('AcademicCalendar', academicCalendarSchema);

module.exports = AcademicCalendar;
