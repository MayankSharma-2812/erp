const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Class name is required'],
    },
    sections: {
      type: [String],
      required: [true, 'Sections are required'],
    },
    session: {
      type: String,
      required: [true, 'Academic session is required'],
    },
    classTeachers: [
      {
        section: { type: String, required: true },
        teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      },
    ],
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Compound unique index on name and session
classSchema.index({ name: 1, session: 1 }, { unique: true });

const Class = mongoose.model('Class', classSchema);

module.exports = Class;
