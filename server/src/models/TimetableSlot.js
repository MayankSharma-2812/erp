const mongoose = require('mongoose');

const timetableSlotSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class reference is required'],
    },
    section: {
      type: String,
      required: [true, 'Section name is required'],
    },
    day: {
      type: String,
      enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      required: [true, 'Day is required'],
    },
    period: {
      type: Number,
      required: [true, 'Period index (1-8) is required'],
      min: 1,
      max: 8,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required'],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher reference is required'],
    },
    session: {
      type: String,
      required: [true, 'Session is required'],
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Enforce compound unique index to prevent double booking in a class section
timetableSlotSchema.index(
  { class: 1, section: 1, day: 1, period: 1 },
  { unique: true }
);

const TimetableSlot = mongoose.model('TimetableSlot', timetableSlotSchema);

module.exports = TimetableSlot;
