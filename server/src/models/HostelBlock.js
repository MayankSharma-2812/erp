const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
  },
  floor: {
    type: Number,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['dormitory', 'double', 'single'],
    default: 'double',
  },
});

const hostelBlockSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'mixed'],
      required: true,
    },
    floors: {
      type: Number,
      required: true,
    },
    rooms: [roomSchema],
  },
  {
    timestamps: true,
    strict: true,
  }
);

hostelBlockSchema.index({ name: 1 });

const HostelBlock = mongoose.model('HostelBlock', hostelBlockSchema);

module.exports = HostelBlock;
