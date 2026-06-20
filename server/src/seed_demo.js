const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./config/env');

// Import all models
const User = require('./models/User');
const Student = require('./models/Student');
const Class = require('./models/Class');
const Subject = require('./models/Subject');
const TimetableSlot = require('./models/TimetableSlot');
const Admission = require('./models/Admission');
const AttendanceRecord = require('./models/AttendanceRecord');
const LessonPlan = require('./models/LessonPlan');
const SyllabusTopic = require('./models/SyllabusTopic');
const AcademicCalendar = require('./models/AcademicCalendar');
const Exam = require('./models/Exam');
const ExamSchedule = require('./models/ExamSchedule');
const HallTicket = require('./models/HallTicket');
const ExamResult = require('./models/ExamResult');
const HostelBlock = require('./models/HostelBlock');
const HostelAllocation = require('./models/HostelAllocation');
const HostelAttendance = require('./models/HostelAttendance');
const OutingRequest = require('./models/OutingRequest');
const VisitorLog = require('./models/VisitorLog');
const MessMenu = require('./models/MessMenu');
const StaffAttendance = require('./models/StaffAttendance');
const Leave = require('./models/Leave');
const PayrollRun = require('./models/PayrollRun');
const Payslip = require('./models/Payslip');
const FeeStructure = require('./models/FeeStructure');
const FeeLedger = require('./models/FeeLedger');
const FeeTransaction = require('./models/FeeTransaction');
const FeeWaiver = require('./models/FeeWaiver');
const Route = require('./models/Route');
const Vehicle = require('./models/Vehicle');
const Driver = require('./models/Driver');
const TransportAllocation = require('./models/TransportAllocation');
const HealthProfile = require('./models/HealthProfile');
const ClinicVisit = require('./models/ClinicVisit');
const MedicationLog = require('./models/MedicationLog');
const SickbayRegister = require('./models/SickbayRegister');
const Book = require('./models/Book');
const BookIssue = require('./models/BookIssue');
const LibraryFine = require('./models/LibraryFine');

const runSeeder = async () => {
  try {
    console.log('Connecting to MongoDB for demo seeding...');
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.MONGO_URI);
    console.log('Connected.');

    const systemToday = new Date();
    const todayMonth = systemToday.getMonth();
    const todayDay = systemToday.getDate();

    // Clear all collections
    const collections = [
      User, Student, Class, Subject, TimetableSlot, Admission, AttendanceRecord,
      LessonPlan, SyllabusTopic, AcademicCalendar, Exam, ExamSchedule, HallTicket,
      ExamResult, HostelBlock, HostelAllocation, HostelAttendance, OutingRequest,
      VisitorLog, MessMenu, StaffAttendance, Leave, PayrollRun, Payslip,
      FeeStructure, FeeLedger, FeeTransaction, FeeWaiver, Route, Vehicle,
      Driver, TransportAllocation, HealthProfile, ClinicVisit, MedicationLog,
      SickbayRegister, Book, BookIssue, LibraryFine
    ];

    console.log('Clearing existing database collections...');
    await Promise.all(collections.map(col => col.deleteMany({})));
    console.log('Clear complete.');

    const passwordHash = await bcrypt.hash('Password123!', 12);

    // 1. Create Classes
    console.log('Seeding Classes...');
    const classes = await Class.create([
      { name: 'Class 10', sections: ['A', 'B'], session: '2025-26' },
      { name: 'Class 11', sections: ['A'], session: '2025-26' },
      { name: 'Class 12', sections: ['A', 'B'], session: '2025-26' }
    ]);
    const class10 = classes[0];
    const class11 = classes[1];
    const class12 = classes[2];

    // 2. Create Subjects
    console.log('Seeding Subjects...');
    const subjects = await Subject.create([
      { code: 'MATH-10', name: 'Mathematics', type: 'theory', class: class10._id, session: '2025-26' },
      { code: 'SCI-10', name: 'Science & Tech', type: 'theory', class: class10._id, session: '2025-26' },
      { code: 'ENG-11', name: 'Core English', type: 'theory', class: class11._id, session: '2025-26' },
      { code: 'PHY-12', name: 'Physics XII', type: 'theory', class: class12._id, session: '2025-26' },
      { code: 'CHEM-12', name: 'Chemistry XII', type: 'theory', class: class12._id, session: '2025-26' }
    ]);

    // 3. Create Staff Users (Teachers & Admins)
    console.log('Seeding staff user accounts...');
    const staffData = [
      { name: 'Dr. Rajesh Sharma', email: 'principal@vidyaerp.com', role: 'principal', isActive: true, dob: new Date(1975, 4, 12) },
      { name: 'Mrs. Shalini Sen', email: 'viceprincipal@vidyaerp.com', role: 'vice_principal', isActive: true, dob: new Date(1978, 8, 22) },
      { name: 'Mr. Anand Verma', email: 'coordinator@vidyaerp.com', role: 'academic_coordinator', isActive: true, dob: new Date(1982, 11, 5) },
      { name: 'Ms. Anita Verma', email: 'classteacher@vidyaerp.com', role: 'class_teacher', isActive: true, classAssigned: class11._id, dob: new Date(1988, todayMonth, todayDay) }, // Today's birthday!
      { name: 'Mr. Vikram Malhotra', email: 'teacher@vidyaerp.com', role: 'subject_teacher', isActive: true, subjectsAssigned: [subjects[3]._id, subjects[4]._id], dob: new Date(1985, 2, 15) },
      { name: 'Mr. Rajiv Dixit', email: 'examcontroller@vidyaerp.com', role: 'exam_controller', isActive: true, dob: new Date(1980, 6, 30) },
      { name: 'Mr. Sanjay Mehta', email: 'accounts@vidyaerp.com', role: 'accounts_officer', isActive: true, dob: new Date(1979, 10, 10) },
      { name: 'Mr. Ramesh Kumar', email: 'cashier@vidyaerp.com', role: 'cashier', isActive: true, dob: new Date(1984, 1, 14) },
      { name: 'Mrs. Preeti Kapoor', email: 'hr@vidyaerp.com', role: 'hr_manager', isActive: true, dob: new Date(1983, 7, 25) },
      { name: 'Mr. Harish Rawat', email: 'warden@vidyaerp.com', role: 'hostel_warden', isActive: true, dob: new Date(1977, 3, 18) },
      { name: 'Mr. Amit Shah', email: 'asstwarden@vidyaerp.com', role: 'asst_hostel_warden', isActive: true, dob: new Date(1990, 5, 20) },
      { name: 'Dr. John Doe', email: 'medicalofficer@vidyaerp.com', role: 'medical_officer', isActive: true, dob: new Date(1974, 0, 1) },
      { name: 'Ms. Meenakshi Iyer', email: 'admissions@vidyaerp.com', role: 'admissions_officer', isActive: true, dob: new Date(1986, 9, 8) },
      { name: 'Mr. Gurpreet Singh', email: 'transport@vidyaerp.com', role: 'transport_manager', isActive: true, dob: new Date(1981, 5, 12) },
      { name: 'Mrs. Sudha Murthy', email: 'librarian@vidyaerp.com', role: 'librarian', isActive: true, dob: new Date(1968, 8, 19) },
      { name: 'Mr. Suresh Patel', email: 'itadmin@vidyaerp.com', role: 'it_admin', isActive: true, dob: new Date(1985, 11, 24) },
    ];

    const seededStaff = [];
    for (const staff of staffData) {
      const u = await User.create({
        ...staff,
        passwordHash,
      });
      seededStaff.push(u);
    }
    console.log(`Seeded ${seededStaff.length} staff users.`);

    // 4. Seeding Transport routes & Vehicles
    console.log('Seeding transport routes & vehicles...');
    const route1 = await Route.create({ name: 'Route 1 - East Delhi', feeAmount: 3500, stops: [{ name: 'Preet Vihar', time: '07:00', order: 1 }, { name: 'Laxmi Nagar', time: '07:20', order: 2 }] });
    const route2 = await Route.create({ name: 'Route 2 - Noida Hub', feeAmount: 4500, stops: [{ name: 'Noida Sec 62', time: '06:50', order: 1 }, { name: 'Indirapuram', time: '07:10', order: 2 }] });

    const driver1 = await Driver.create({ name: 'Jaswant Singh', licenseNumber: 'DL-142020009988', licenseExpiry: new Date('2030-12-31'), phone: '+91 9911122233' });
    const vehicle1 = await Vehicle.create({ regNumber: 'DL-1C-AA-9988', capacity: 40, type: 'bus' });

    // 5. Seeding Library Books
    console.log('Seeding library books...');
    const books = await Book.create([
      { isbn: '978-0132350884', title: 'Clean Code: A Handbook of Agile Software Craftsmanship', authors: ['Robert C. Martin'], publisher: 'Prentice Hall', copies: 5, available: 5, location: 'Shelf A3' },
      { isbn: '978-0201633610', title: 'Design Patterns: Elements of Reusable Object-Oriented Software', authors: ['Erich Gamma', 'Richard Helm', 'Ralph Johnson', 'John Vlissides'], publisher: 'Addison-Wesley', copies: 3, available: 3, location: 'Shelf A4' },
      { isbn: '978-0135957059', title: 'The Pragmatic Programmer: Your Journey to Mastery', authors: ['David Thomas', 'Andrew Hunt'], publisher: 'Addison-Wesley', copies: 4, available: 4, location: 'Shelf B1' }
    ]);

    // 6. Seeding Hostel Blocks
    console.log('Seeding Hostel Blocks...');
    const blockA = await HostelBlock.create({
      name: 'Aravali Boys Hostel',
      gender: 'male',
      floors: 3,
      rooms: [
        { roomNumber: '101', floor: 1, capacity: 2, occupied: 0, type: 'double' },
        { roomNumber: '102', floor: 1, capacity: 1, occupied: 0, type: 'single' },
        { roomNumber: '103', floor: 1, capacity: 4, occupied: 0, type: 'dormitory' }
      ]
    });
    const blockB = await HostelBlock.create({
      name: 'Shivalik Girls Hostel',
      gender: 'female',
      floors: 3,
      rooms: [
        { roomNumber: '201', floor: 2, capacity: 2, occupied: 0, type: 'double' },
        { roomNumber: '202', floor: 2, capacity: 1, occupied: 0, type: 'single' }
      ]
    });

    // 7. Seed Students & link User student logins
    console.log('Seeding students & student portals...');
    const studentData = [
      { name: 'Rohan Gupta', email: 'rohan@vidyaerp.com', gender: 'male', classId: class11._id, section: 'A', isBoarding: true, room: { block: blockA, roomNo: '101', bed: 1 } },
      { name: 'Priya Sharma', email: 'priya@vidyaerp.com', gender: 'female', classId: class12._id, section: 'A', isBoarding: true, room: { block: blockB, roomNo: '201', bed: 1 } },
      { name: 'Kabir Malhotra', email: 'kabir@vidyaerp.com', gender: 'male', classId: class10._id, section: 'A', isBoarding: false, transport: route1 },
      { name: 'Anjali Desai', email: 'anjali@vidyaerp.com', gender: 'female', classId: class10._id, section: 'B', isBoarding: false, transport: route2 },
      { name: 'Aarav Mehta', email: 'aarav@vidyaerp.com', gender: 'male', classId: class11._id, section: 'A', isBoarding: true, room: { block: blockA, roomNo: '102', bed: 1 } },
      { name: 'Sneha Reddy', email: 'sneha@vidyaerp.com', gender: 'female', classId: class12._id, section: 'B', isBoarding: true, room: { block: blockB, roomNo: '202', bed: 1 } },
      { name: 'Ishaan Verma', email: 'ishaan@vidyaerp.com', gender: 'male', classId: class10._id, section: 'A', isBoarding: false },
      { name: 'Divya Nair', email: 'divya@vidyaerp.com', gender: 'female', classId: class11._id, section: 'A', isBoarding: false },
      { name: 'Aditya Sen', email: 'aditya@vidyaerp.com', gender: 'male', classId: class12._id, section: 'A', isBoarding: true, room: { block: blockA, roomNo: '103', bed: 2 } },
      { name: 'Meera Krishnan', email: 'meera@vidyaerp.com', gender: 'female', classId: class10._id, section: 'B', isBoarding: false }
    ];

    const seededStudents = [];
    for (const [idx, s] of studentData.entries()) {
      const rollNumber = String(100 + idx);
      const admissionNumber = `ADM-2025-${rollNumber}`;
      
      const stud = await Student.create({
        admissionNumber,
        rollNumber,
        name: s.name,
        dob: idx === 0 ? new Date(2010, todayMonth, todayDay) : new Date(2008 - (idx % 3), idx, 15), // Rohan Gupta birthday is today!
        gender: s.gender,
        class: s.classId,
        section: s.section,
        session: '2025-26',
        status: 'active',
        isBoarding: s.isBoarding,
        transportRoute: s.transport ? s.transport._id : undefined,
        libraryCardNo: `LIB-${rollNumber}`,
        father: { name: `Mr. ${s.name.split(' ')[1]} Senior`, phone: `+91 989898980${idx}`, email: `parent.${rollNumber}@vidyaerp.com` },
        mother: { name: `Mrs. ${s.name.split(' ')[1]} Senior`, phone: `+91 989898981${idx}` },
        address: { line1: `Lane ${idx + 1}, Vasant Kunj`, city: 'New Delhi', state: 'Delhi', pincode: '110070' }
      });

      // Link to User
      const u = await User.create({
        name: s.name,
        email: s.email,
        passwordHash,
        role: 'student',
        studentProfile: stud._id,
        isActive: true
      });

      // Create Parent User linked to child's studentProfile
      await User.create({
        name: stud.father.name,
        email: stud.father.email,
        passwordHash,
        role: 'parent',
        studentProfile: stud._id,
        isActive: true
      });

      seededStudents.push({ student: stud, user: u, config: s });
    }
    console.log(`Seeded ${seededStudents.length} student portals.`);

    // 8. Create Hostel allocations & Fee linkages
    console.log('Seeding Hostel Room allocations & Finance ledgers...');
    for (const entry of seededStudents) {
      const { student, config: s } = entry;
      
      // Initialize Fee Ledger for each student
      const ledger = await FeeLedger.create({
        student: student._id,
        session: '2025-26',
        entries: [
          { head: 'Tuition Fee (Q1)', amount: 25000, dueDate: new Date('2025-07-31'), status: 'paid', paidAmount: 25000, waivedAmount: 0 },
          { head: 'CBSE Exam Registrations', amount: 2500, dueDate: new Date('2025-09-15'), status: 'pending', paidAmount: 0, waivedAmount: 0 }
        ],
        totalDue: 27500,
        totalPaid: 25000,
        balance: 2500
      });

      if (s.isBoarding && s.room) {
        // Allocate Room
        await HostelAllocation.create({
          student: student._id,
          block: s.room.block._id,
          roomNumber: s.room.roomNo,
          bedNumber: s.room.bed,
          session: '2025-26',
          allottedDate: new Date(),
          allottedBy: seededStaff[0]._id // Principal
        });

        // Add hostel fee
        const isSingle = s.room.roomNo === '102';
        const fee = isSingle ? 15000 : 12000;
        ledger.entries.push({
          head: 'Hostel Accommodation Fee',
          amount: fee,
          dueDate: new Date(),
          status: 'pending',
          paidAmount: 0,
          waivedAmount: 0
        });
        ledger.totalDue += fee;
        ledger.balance += fee;
        await ledger.save();

        // Increment block occupancy
        const block = s.room.block;
        const room = block.rooms.find(r => r.roomNumber === s.room.roomNo);
        if (room) {
          room.occupied += 1;
        }
        await block.save();
      }

      if (s.transport) {
        // Transport allocation
        await TransportAllocation.create({
          student: student._id,
          route: s.transport._id,
          stop: s.transport.stops[0].name,
          session: '2025-26',
          allocatedBy: seededStaff[0]._id
        });

        // Add transport fee
        ledger.entries.push({
          head: 'Transport Route Fee',
          amount: s.transport.feeAmount,
          dueDate: new Date(),
          status: 'pending',
          paidAmount: 0,
          waivedAmount: 0
        });
        ledger.totalDue += s.transport.feeAmount;
        ledger.balance += s.transport.feeAmount;
        await ledger.save();
      }
    }

    // 9. Seeding Mess Menu
    console.log('Seeding weekly mess menu...');
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekStart = (() => {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.setDate(diff)).toISOString().split('T')[0];
    })();

    await MessMenu.create({
      weekStartDate: weekStart,
      menu: days.map((day, idx) => ({
        day,
        breakfast: ['Aloo Paratha with Curd', 'Idli Sambar with Chutney', 'Poha and Sprouts', 'Bread Butter and Eggs', 'Puri Sabzi', 'Oats and Milk', 'Veg Sandwich'][idx % 7],
        lunch: ['Dal Makhani, Shahi Paneer, Rice, Roti', 'Rajma Chawal, Raita, Salad', 'Chole Bhature, Veg Pulao', 'Kadhi Pakora, Jeera Rice, Chapati', 'Mix Veg, Yellow Dal, Roti, Rice', 'Paneer Bhurji, Dal Tadka, Chapati', 'Special Veg Biryani with Salan'][idx % 7],
        eveningSnack: ['Tea & Samosa', 'Milk & Biscuits', 'Veg Cutlet', 'Tea & Pakora', 'Cookies & Juice', 'Bhel Puri', 'Tea & French Fries'][idx % 7],
        dinner: ['Matar Paneer, Roti, Kheer', 'Egg Curry / Malai Kofta, Rice', 'Chicken Butter Masala / Paneer Butter Masala', 'Aloo Gobi, Dal Fry, Chapati', 'Veg Jalfrezi, Roti, Ice Cream', 'Yellow Dal, Bhindi Masala, Rice', 'Special Fried Rice, Manchurian'][idx % 7]
      }))
    });

    // 10. Seeding Syllabus progress
    console.log('Seeding class syllabus topics...');
    await SyllabusTopic.create([
      { class: class11._id, subject: subjects[2]._id, topic: 'Introduction to Prose & Poetry', status: 'completed', order: 1, session: '2025-26' },
      { class: class11._id, subject: subjects[2]._id, topic: 'Advanced Grammar & Writing Skills', status: 'in_progress', order: 2, session: '2025-26' },
      { class: class12._id, subject: subjects[3]._id, topic: 'Electrostatics', status: 'completed', order: 1, session: '2025-26' },
      { class: class12._id, subject: subjects[3]._id, topic: 'Current Electricity', status: 'in_progress', order: 2, session: '2025-26' },
      { class: class12._id, subject: subjects[3]._id, topic: 'Magnetism & Matter', status: 'not_started', order: 3, session: '2025-26' },
    ]);

    // 11. Seeding Clinic visits
    console.log('Seeding clinic logs...');
    const firstStudent = seededStudents[0].student;
    const secondStudent = seededStudents[1].student;

    await ClinicVisit.create([
      { student: firstStudent._id, complaint: 'Mild headache and nausea', examination: 'Temp 98.4F, BP normal', diagnosis: 'Dehydration / Migraine', treatment: 'Paracetamol 500mg, rest for 2 hours, 1L ORS drink', date: new Date(Date.now() - 2 * 24 * 3600 * 1000), attendedBy: seededStaff[11]._id },
      { student: secondStudent._id, complaint: 'Sprained left ankle during basketball', examination: 'Swelling at lateral malleolus, tender', diagnosis: 'Grade 1 ankle sprain', treatment: 'R.I.C.E. protocol, elastic bandage wrap, Ibuprofen 400mg', date: new Date(Date.now() - 24 * 3600 * 1000), attendedBy: seededStaff[11]._id }
    ]);

    // 12. Seeding Book Issues
    console.log('Seeding library book issues...');
    const issueDate = new Date();
    issueDate.setDate(issueDate.getDate() - 10);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() - 3); // 3 days overdue to show fine generation in action!

    await BookIssue.create({
      book: books[0]._id,
      student: firstStudent._id,
      issueDate,
      dueDate,
      status: 'issued'
    });

    // 13. Seeding Staff Attendance & Leaves
    console.log('Seeding staff attendance & leave records...');
    const today = new Date();
    for (const staff of seededStaff) {
      // Mark present for last 5 days
      for (let i = 1; i <= 5; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        // Skip Sundays
        if (d.getDay() === 0) continue;

        await StaffAttendance.create({
          staff: staff._id,
          date: d,
          status: 'present',
          checkIn: '09:00',
          checkOut: '17:00'
        });
      }
    }

    // Leave request for the Ms. Anita Verma
    await Leave.create({
      staff: seededStaff[3]._id, // class_teacher
      type: 'CL',
      fromDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
      toDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2),
      days: 2,
      reason: 'Personal emergency at hometown',
      status: 'pending'
    });

    // 14. Seeding Outing requests
    console.log('Seeding hostel outing requests...');
    await OutingRequest.create([
      { student: firstStudent._id, destination: 'Noida City Center Mall', purpose: 'Buying sports shoes', departDate: new Date(Date.now() + 2 * 3600 * 1000), returnDate: new Date(Date.now() + 6 * 3600 * 1000), contactDuring: '9988776655', status: 'pending' },
      { student: secondStudent._id, destination: 'Home Town - Meerut', purpose: 'Attending cousin sister wedding', departDate: new Date(Date.now() + 24 * 3600 * 1000), returnDate: new Date(Date.now() + 72 * 3600 * 1000), contactDuring: '9876543210', status: 'pending' }
    ]);

    // 15. Seeding Visitor Logs
    console.log('Seeding visitor logs...');
    await VisitorLog.create({
      visitorName: 'Mr. Rakesh Gupta',
      visitorId: 'AD-9910-2210',
      idType: 'Aadhaar Card',
      meetingStudent: firstStudent._id,
      purpose: 'Meeting son for weekend pocket money delivery',
      inTime: new Date(Date.now() - 3 * 3600 * 1000),
      outTime: new Date(Date.now() - 2.5 * 3600 * 1000),
      loggedBy: seededStaff[9]._id // warden
    });

    console.log('🎉 DEMO DATA SEEDED SUCCESSFULLY FOR ALL VIDYAERP MODULES!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ SEEDING FAILED WITH ERROR:', error);
    process.exit(1);
  }
};

runSeeder();
