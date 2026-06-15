const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema(
  {
    session: {
      type: String,
      required: [true, 'Academic session is required (e.g. 2025-26)'],
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class reference is required'],
    },
    heads: [
      {
        name: {
          type: String,
          required: [true, 'Fee head name is required'],
        },
        amount: {
          type: Number,
          required: [true, 'Fee head amount is required'],
          min: 0,
        },
        frequency: {
          type: String,
          enum: ['monthly', 'quarterly', 'annual'],
          required: [true, 'Fee frequency is required'],
        },
        dueDay: {
          type: Number,
          required: [true, 'Due day of month is required'],
          min: 1,
          max: 28,
        },
      },
    ],
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Session and Class combination must be unique
feeStructureSchema.index({ session: 1, class: 1 }, { unique: true });

const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);

module.exports = FeeStructure;
