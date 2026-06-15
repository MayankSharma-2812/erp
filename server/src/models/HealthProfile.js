const mongoose = require('mongoose');

const healthProfileSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true,
    },
    bloodGroup: {
      type: String,
    },
    allergies: [
      {
        type: String,
        trim: true,
      },
    ],
    chronicConditions: [
      {
        type: String,
        trim: true,
      },
    ],
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relation: { type: String },
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

healthProfileSchema.index({ student: 1 });

const HealthProfile = mongoose.model('HealthProfile', healthProfileSchema);

module.exports = HealthProfile;
