const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    stops: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        time: {
          type: String, // format "HH:MM" e.g. "07:30"
          required: true,
        },
        order: {
          type: Number,
          required: true,
        },
      },
    ],
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
    },
    feeAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

routeSchema.index({ name: 1 });

const Route = mongoose.model('Route', routeSchema);

module.exports = Route;
