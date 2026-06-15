const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema(
  {
    enquiryId: {
      type: String,
      unique: true,
    },
    stage: {
      type: String,
      enum: [
        'enquiry',
        'applied',
        'test_scheduled',
        'test_appeared',
        'offer_pending',
        'offer_sent',
        'confirmed',
        'rejected',
        'waitlisted',
      ],
      default: 'enquiry',
    },
    enquiryDate: {
      type: Date,
      default: Date.now,
    },
    classAppliedFor: {
      type: String,
      required: [true, 'Class applied for is required'],
    },
    enquirySource: {
      type: String,
    },
    studentName: {
      type: String,
      required: [true, 'Student name is required'],
    },
    dob: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
    },
    fatherName: {
      type: String,
      required: [true, 'Father name is required'],
    },
    motherName: {
      type: String,
      required: [true, 'Mother name is required'],
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone is required'],
    },
    contactEmail: {
      type: String,
    },
    currentSchool: {
      type: String,
    },
    testDate: {
      type: Date,
    },
    testScore: {
      type: Number,
    },
    testRemarks: {
      type: String,
    },
    documents: [
      {
        type: { type: String },
        fileUrl: { type: String },
        verified: { type: Boolean, default: false },
      },
    ],
    decisionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    decisionDate: {
      type: Date,
    },
    decisionNote: {
      type: String,
    },
    seatAllocated: {
      type: String,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
    },
    admissionFeeStatus: {
      type: String,
      enum: ['pending', 'paid', 'waived'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Pre-save hook to auto-generate enquiryId
admissionSchema.pre('save', async function (next) {
  if (!this.enquiryId) {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    this.enquiryId = `ENQ-${year}-${random}`;
  }
  next();
});

admissionSchema.index({ stage: 1 });
admissionSchema.index({ classAppliedFor: 1 });

const Admission = mongoose.model('Admission', admissionSchema);

module.exports = Admission;
