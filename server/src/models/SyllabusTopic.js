const mongoose = require('mongoose');

const syllabusTopicSchema = new mongoose.Schema(
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
    topic: {
      type: String,
      required: [true, 'Topic description is required'],
    },
    order: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

syllabusTopicSchema.index({ class: 1, subject: 1 });

const SyllabusTopic = mongoose.model('SyllabusTopic', syllabusTopicSchema);

module.exports = SyllabusTopic;
