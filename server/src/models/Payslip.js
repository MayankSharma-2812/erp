const mongoose = require('mongoose');

const payslipSchema = new mongoose.Schema(
  {
    run: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PayrollRun',
      required: true,
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    month: {
      type: String, // format: YYYY-MM
      required: true,
    },
    basicSalary: {
      type: Number,
      required: true,
    },
    da: {
      type: Number,
      default: 0,
    },
    hra: {
      type: Number,
      default: 0,
    },
    otherAllowances: {
      type: Number,
      default: 0,
    },
    grossSalary: {
      type: Number,
      required: true,
    },
    pfDeduction: {
      type: Number,
      default: 0,
    },
    esiDeduction: {
      type: Number,
      default: 0,
    },
    tdsDeduction: {
      type: Number,
      default: 0,
    },
    lopDays: {
      type: Number,
      default: 0,
    },
    lopAmount: {
      type: Number,
      default: 0,
    },
    netSalary: {
      type: Number,
      required: true,
    },
    fileUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

payslipSchema.index({ run: 1 });
payslipSchema.index({ staff: 1, month: 1 });

const Payslip = mongoose.model('Payslip', payslipSchema);

module.exports = Payslip;
