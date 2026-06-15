const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./config/env');
const User = require('./models/User');
const Class = require('./models/Class');
const Subject = require('./models/Subject');
const TimetableSlot = require('./models/TimetableSlot');
const Admission = require('./models/Admission');
const Student = require('./models/Student');
const AttendanceRecord = require('./models/AttendanceRecord');
const LessonPlan = require('./models/LessonPlan');
const SyllabusTopic = require('./models/SyllabusTopic');
const AcademicCalendar = require('./models/AcademicCalendar');
const Exam = require('./models/Exam');
const ExamSchedule = require('./models/ExamSchedule');
const HallTicket = require('./models/HallTicket');
const ExamResult = require('./models/ExamResult');

const seedUsers = async () => {
  try {
    // Connect to DB
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.MONGO_URI);
    console.log('MongoDB connected for seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Class.deleteMany({}),
      Subject.deleteMany({}),
      TimetableSlot.deleteMany({}),
      Admission.deleteMany({}),
      Student.deleteMany({}),
      AttendanceRecord.deleteMany({}),
      LessonPlan.deleteMany({}),
      SyllabusTopic.deleteMany({}),
      AcademicCalendar.deleteMany({}),
      Exam.deleteMany({}),
      ExamSchedule.deleteMany({}),
      HallTicket.deleteMany({}),
      ExamResult.deleteMany({}),
    ]);
    console.log('Cleared existing collections data.');

    const passwordHash = await bcrypt.hash('Password123!', 12);

    const testUsers = [
      {
        name: 'Dr. Rajesh Sharma',
        email: 'principal@vidyaerp.com',
        passwordHash,
        role: 'principal',
        isActive: true,
      },
      {
        name: 'Anita Verma',
        email: 'classteacher@vidyaerp.com',
        passwordHash,
        role: 'class_teacher',
        isActive: true,
      },
      {
        name: 'Ramesh Kumar',
        email: 'cashier@vidyaerp.com',
        passwordHash,
        role: 'cashier',
        isActive: true,
      },
      {
        name: 'Suresh Patel',
        email: 'itadmin@vidyaerp.com',
        passwordHash,
        role: 'it_admin',
        isActive: true,
      },
    ];

    const createdUsers = await User.create(testUsers);
    console.log('Seeded users successfully:');
    createdUsers.forEach((user) => {
      console.log(`- ${user.name} (${user.role}): ${user.email}`);
    });

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
