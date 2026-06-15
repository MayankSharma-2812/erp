const mongoose = require('mongoose');

const hostelAllocationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    block: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HostelBlock',
      required: true,
    },
    roomNumber: {
      type: String,
      required: true,
    },
    bedNumber: {
      type: Number,
      required: true,
    },
    session: {
      type: String,
      required: true,
    },
    allottedDate: {
      type: Date,
      default: Date.now,
    },
    vacatedDate: {
      type: Date,
    },
    allottedBy: {
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

hostelAllocationSchema.index({ student: 1, session: 1 });
hostelAllocationSchema.index({ block: 1, roomNumber: 1, bedNumber: 1 });

const HostelAllocation = mongoose.model('HostelAllocation', hostelAllocationSchema);

module.exports = HostelAllocation;
