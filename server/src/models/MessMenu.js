const mongoose = require('mongoose');

const dailyMenuSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    required: true,
  },
  breakfast: {
    type: String,
    default: '',
  },
  lunch: {
    type: String,
    default: '',
  },
  eveningSnack: {
    type: String,
    default: '',
  },
  dinner: {
    type: String,
    default: '',
  },
});

const messMenuSchema = new mongoose.Schema(
  {
    weekStartDate: {
      type: Date,
      required: true,
      unique: true,
    },
    menu: [dailyMenuSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

messMenuSchema.index({ weekStartDate: 1 });

const MessMenu = mongoose.model('MessMenu', messMenuSchema);

module.exports = MessMenu;
