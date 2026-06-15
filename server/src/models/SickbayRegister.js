const mongoose = require('mongoose');

const sickbayRegisterSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    admitDate: {
      type: Date,
      required: true,
    },
    admitTime: {
      type: String, // e.g. "10:15 AM"
    },
    condition: {
      type: String,
      required: true,
    },
    bed: {
      type: String, // e.g. "Bed A"
    },
    progressNotes: [
      {
        date: { type: Date, default: Date.now },
        note: { type: String, required: true },
      },
    ],
    dischargeDate: {
      type: Date,
    },
    dischargeTime: {
      type: String,
    },
    followUp: {
      type: String,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

sickbayRegisterSchema.index({ student: 1 });

const SickbayRegister = mongoose.model('SickbayRegister', sickbayRegisterSchema);

module.exports = SickbayRegister;
