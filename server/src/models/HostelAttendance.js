const mongoose = require('mongoose');

const hostelAttendanceRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'outing', 'leave', 'sickbay'],
    required: true,
  },
});

const hostelAttendanceSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    session_type: {
      type: String,
      enum: ['morning', 'night'],
      required: true,
    },
    records: [hostelAttendanceRecordSchema],
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

hostelAttendanceSchema.index({ date: 1, session_type: 1 }, { unique: true });

const HostelAttendance = mongoose.model('HostelAttendance', hostelAttendanceSchema);

module.exports = HostelAttendance;
