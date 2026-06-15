const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    regNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      required: true, // "bus", "van", "mini-bus"
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    fitnessCertExpiry: {
      type: Date,
    },
    insuranceExpiry: {
      type: Date,
    },
    lastService: {
      type: Date,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

vehicleSchema.index({ regNumber: 1 });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
