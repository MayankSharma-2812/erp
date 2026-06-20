const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: [
        'principal',
        'vice_principal',
        'academic_coordinator',
        'class_teacher',
        'subject_teacher',
        'exam_controller',
        'accounts_officer',
        'cashier',
        'hr_manager',
        'hostel_warden',
        'asst_hostel_warden',
        'medical_officer',
        'admissions_officer',
        'transport_manager',
        'librarian',
        'it_admin',
        'receptionist',
        'security_supervisor',
        'student',
        'parent',
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    phone: {
      type: String,
    },
    photo: {
      type: String,
    },
    classAssigned: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
    },
    subjectsAssigned: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
    dob: {
      type: Date,
    },
    deptAssigned: {
      type: String,
    },
    refreshTokenHash: {
      type: String,
    },
    lastLogin: {
      type: Date,
    },
    studentProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Index on role for query performance
userSchema.index({ role: 1 });

// Remove sensitive fields from JSON output
userSchema.set('toJSON', {
  transform: function (_doc, ret) {
    delete ret.passwordHash;
    delete ret.refreshTokenHash;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
