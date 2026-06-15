const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
    },
    code: {
      type: String,
      required: [true, 'Subject code is required'],
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required'],
    },
    theoryMax: {
      type: Number,
      default: 80,
    },
    practicalMax: {
      type: Number,
      default: 20,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    session: {
      type: String,
      required: [true, 'Session is required'],
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

subjectSchema.index({ class: 1 });
subjectSchema.index({ teacher: 1 });
subjectSchema.index({ session: 1 });

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;
