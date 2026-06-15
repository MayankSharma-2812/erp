const mongoose = require('mongoose');

const medicationLogSchema = new mongoose.Schema(
  {
    visit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClinicVisit',
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    medication: {
      type: String,
      required: true,
      trim: true,
    },
    dosage: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    dispensedAt: {
      type: Date,
      default: Date.now,
    },
    dispensedBy: {
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

medicationLogSchema.index({ student: 1 });

const MedicationLog = mongoose.model('MedicationLog', medicationLogSchema);

module.exports = MedicationLog;
