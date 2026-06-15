const mongoose = require('mongoose');

const staffAttendanceSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'half_day', 'on_leave', 'holiday'],
      required: true,
    },
    inTime: {
      type: String,
    },
    outTime: {
      type: String,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

staffAttendanceSchema.index({ staff: 1, date: 1 }, { unique: true });
staffAttendanceSchema.index({ date: 1 });

const StaffAttendance = mongoose.model('StaffAttendance', staffAttendanceSchema);

module.exports = StaffAttendance;
