const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },
    date: {
      type: Date,
      required: [true, 'Attendance date is required'],
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class reference is required'],
    },
    section: {
      type: String,
      required: [true, 'Section name is required'],
    },
    period: {
      type: Number,
      default: null, // null for consolidated daily attendance
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'leave', 'holiday'],
      required: [true, 'Attendance status is required'],
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lockedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Unique compound index on student + date + period + subject (to prevent double marking)
attendanceRecordSchema.index(
  { student: 1, date: 1, period: 1, subject: 1 },
  { unique: true }
);

// Compound index for querying attendance by class section on a date
attendanceRecordSchema.index({ class: 1, section: 1, date: 1 });

const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);

module.exports = AttendanceRecord;
