const mongoose = require('mongoose');

const payrollRunSchema = new mongoose.Schema(
  {
    month: {
      type: String, // format: YYYY-MM
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'disbursed'],
      default: 'draft',
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

payrollRunSchema.index({ month: 1 });

const PayrollRun = mongoose.model('PayrollRun', payrollRunSchema);

module.exports = PayrollRun;
