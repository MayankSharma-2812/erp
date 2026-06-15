const mongoose = require('mongoose');

const feeWaiverSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },
    ledger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeLedger',
      required: [true, 'Fee ledger reference is required'],
    },
    heads: [
      {
        type: String,
        required: true,
      },
    ],
    amount: {
      type: Number,
      required: [true, 'Waiver amount is required'],
      min: 0,
    },
    reason: {
      type: String,
      required: [true, 'Waiver reason is required'],
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requestor reference is required'],
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
    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

feeWaiverSchema.index({ student: 1 });
feeWaiverSchema.index({ status: 1 });

const FeeWaiver = mongoose.model('FeeWaiver', feeWaiverSchema);

module.exports = FeeWaiver;
