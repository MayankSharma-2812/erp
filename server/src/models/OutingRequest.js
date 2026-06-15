const mongoose = require('mongoose');

const outingRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      required: true,
    },
    departDate: {
      type: Date,
      required: true,
    },
    returnDate: {
      type: Date,
      required: true,
    },
    contactDuring: {
      type: String,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'returned'],
      default: 'pending',
    },
    approvalLevel: {
      type: String,
      enum: ['asst_warden', 'warden', 'principal'],
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    actualReturnDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

outingRequestSchema.index({ student: 1 });
outingRequestSchema.index({ status: 1 });

const OutingRequest = mongoose.model('OutingRequest', outingRequestSchema);

module.exports = OutingRequest;
