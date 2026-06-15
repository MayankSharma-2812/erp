const mongoose = require('mongoose');

const clinicVisitSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    visitDate: {
      type: Date,
      default: Date.now,
    },
    complaint: {
      type: String,
      required: true,
      trim: true,
    },
    examination: {
      type: String,
      trim: true,
    },
    diagnosis: {
      type: String,
      trim: true,
    },
    treatment: {
      type: String,
      trim: true,
    },
    followUpDate: {
      type: Date,
    },
    attendedBy: {
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

clinicVisitSchema.index({ student: 1 });
clinicVisitSchema.index({ visitDate: 1 });

const ClinicVisit = mongoose.model('ClinicVisit', clinicVisitSchema);

module.exports = ClinicVisit;
