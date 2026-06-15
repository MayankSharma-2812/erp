const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    session: {
      type: String,
      required: [true, 'Session is required (e.g. 2025-26)'],
    },
    head: {
      type: String,
      required: [true, 'Budget head is required'],
    },
    budgeted: {
      type: Number,
      required: [true, 'Budgeted amount is required'],
      min: 0,
    },
    actual: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Session and Head combination must be unique
budgetSchema.index({ session: 1, head: 1 }, { unique: true });

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = Budget;
