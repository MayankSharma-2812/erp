const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    admissionNumber: {
      type: String,
      unique: true,
      required: [true, 'Admission number is required'],
    },
    rollNumber: {
      type: String,
    },
    name: {
      type: String,
      required: [true, 'Student name is required'],
    },
    dob: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    photo: {
      type: String,
    },
    aadhaar: {
      type: String,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
    },
    section: {
      type: String,
    },
    session: {
      type: String,
    },
    admissionDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'alumni', 'transferred', 'withdrawn'],
      default: 'active',
    },
    previousSchool: {
      type: String,
    },
    tcNumber: {
      type: String,
    },
    father: {
      name: { type: String },
      phone: { type: String },
      email: { type: String },
      occupation: { type: String },
    },
    mother: {
      name: { type: String },
      phone: { type: String },
      email: { type: String },
      occupation: { type: String },
    },
    guardian: {
      name: { type: String },
      phone: { type: String },
      relation: { type: String },
    },
    address: {
      line1: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
    },
    isBoarding: {
      type: Boolean,
      default: false,
    },
    transportRoute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
    },
    libraryCardNo: {
      type: String,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Indexes for query performance
studentSchema.index({ class: 1 });
studentSchema.index({ section: 1 });
studentSchema.index({ session: 1 });
studentSchema.index({ status: 1 });

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
