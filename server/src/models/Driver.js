const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    licenseNumber: {
      type: String,
      required: true,
    },
    licenseExpiry: {
      type: Date,
      required: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

driverSchema.index({ name: 1 });

const Driver = mongoose.model('Driver', driverSchema);

module.exports = Driver;
