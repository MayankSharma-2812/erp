const mongoose = require('mongoose');

const hallTicketSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: [true, 'Exam reference is required'],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
    },
    rollNumber: {
      type: String,
    },
    subjects: [
      {
        subject: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject',
        },
        date: {
          type: Date,
        },
        time: {
          type: String,
        },
        venue: {
          type: String,
        },
        seatNo: {
          type: String,
        },
      },
    ],
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    fileUrl: {
      type: String, // PDF storage path
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Compound unique index on exam + student
hallTicketSchema.index({ exam: 1, student: 1 }, { unique: true });

const HallTicket = mongoose.model('HallTicket', hallTicketSchema);

module.exports = HallTicket;
