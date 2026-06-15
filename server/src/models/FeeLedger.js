const mongoose = require('mongoose');

const feeLedgerSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },
    session: {
      type: String,
      required: [true, 'Session is required'],
    },
    entries: [
      {
        head: {
          type: String,
          required: [true, 'Fee head name is required'],
        },
        amount: {
          type: Number,
          required: [true, 'Fee head amount is required'],
          min: 0,
        },
        dueDate: {
          type: Date,
          required: [true, 'Due date is required'],
        },
        status: {
          type: String,
          enum: ['pending', 'paid', 'waived', 'partial'],
          default: 'pending',
        },
        paidAmount: {
          type: Number,
          default: 0,
          min: 0,
        },
        waivedAmount: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    ],
    totalDue: {
      type: Number,
      default: 0,
    },
    totalPaid: {
      type: Number,
      default: 0,
    },
    balance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Compound unique index on student and session
feeLedgerSchema.index({ student: 1, session: 1 }, { unique: true });

const FeeLedger = mongoose.model('FeeLedger', feeLedgerSchema);

module.exports = FeeLedger;
