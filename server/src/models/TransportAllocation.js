const mongoose = require('mongoose');

const transportAllocationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    route: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
    },
    stop: {
      type: String,
      required: true,
    },
    session: {
      type: String,
      required: true,
    },
    allottedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

transportAllocationSchema.index({ student: 1, session: 1 }, { unique: true });

const TransportAllocation = mongoose.model('TransportAllocation', transportAllocationSchema);

module.exports = TransportAllocation;
