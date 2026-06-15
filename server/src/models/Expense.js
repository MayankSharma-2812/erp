const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Expense date is required'],
    },
    head: {
      type: String,
      required: [true, 'Expense head is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: 0,
    },
    description: {
      type: String,
    },
    vendor: {
      type: String,
      trim: true,
    },
    billRef: {
      type: String,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    enteredBy: {
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

expenseSchema.index({ date: 1 });
expenseSchema.index({ head: 1 });
expenseSchema.index({ vendor: 1 });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
