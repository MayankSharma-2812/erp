const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['CL', 'EL', 'ML', 'LOP', 'OD', 'special'],
      required: true,
    },
    fromDate: {
      type: Date,
      required: true,
    },
    toDate: {
      type: Date,
      required: true,
    },
    days: {
      type: Number,
      required: true,
      min: 0.5,
    },
    reason: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

leaveSchema.index({ staff: 1 });
leaveSchema.index({ status: 1 });

const Leave = mongoose.model('Leave', leaveSchema);

module.exports = Leave;
