const mongoose = require('mongoose');

const visitorLogSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      default: Date.now,
    },
    visitorName: {
      type: String,
      required: true,
    },
    visitorId: {
      type: String,
      required: true,
    },
    idType: {
      type: String,
      required: true,
    },
    meetingStudent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    purpose: {
      type: String,
    },
    inTime: {
      type: Date,
      default: Date.now,
    },
    outTime: {
      type: Date,
    },
    loggedBy: {
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

visitorLogSchema.index({ date: 1 });
visitorLogSchema.index({ meetingStudent: 1 });

const VisitorLog = mongoose.model('VisitorLog', visitorLogSchema);

module.exports = VisitorLog;
