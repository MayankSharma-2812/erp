const mongoose = require('mongoose');

const lessonPlanSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class reference is required'],
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required'],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Lesson plan title is required'],
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    session: {
      type: String,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

lessonPlanSchema.index({ class: 1, subject: 1 });

const LessonPlan = mongoose.model('LessonPlan', lessonPlanSchema);

module.exports = LessonPlan;
