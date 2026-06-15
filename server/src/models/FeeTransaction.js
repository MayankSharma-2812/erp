const mongoose = require('mongoose');

const feeTransactionSchema = new mongoose.Schema(
  {
    ledger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeeLedger',
      required: [true, 'Fee ledger reference is required'],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
      min: 0,
    },
    method: {
      type: String,
      enum: ['online', 'cash', 'cheque', 'dd', 'neft'],
      required: [true, 'Payment method is required'],
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    receiptNumber: {
      type: String,
      unique: true,
      required: [true, 'Receipt number is required'], // Format: RCPT-YYYY-XXXXX
    },
    receiptUrl: {
      type: String,
    },
    heads: [
      {
        type: String,
      },
    ],
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // null for online/Razorpay
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refunded'],
      default: 'success',
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

feeTransactionSchema.index({ receiptNumber: 1 });
feeTransactionSchema.index({ student: 1 });

const FeeTransaction = mongoose.model('FeeTransaction', feeTransactionSchema);

module.exports = FeeTransaction;
