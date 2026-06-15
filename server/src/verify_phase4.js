const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const config = require('./config/env');

// Import models directly for seeding/cleaning
const User = require('./models/User');
const Student = require('./models/Student');
const FeeLedger = require('./models/FeeLedger');
const HostelBlock = require('./models/HostelBlock');
const HostelAllocation = require('./models/HostelAllocation');
const OutingRequest = require('./models/OutingRequest');
const StaffAttendance = require('./models/StaffAttendance');
const Leave = require('./models/Leave');
const PayrollRun = require('./models/PayrollRun');
const Payslip = require('./models/Payslip');

const BASE_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('=== PHASE 4 VERIFICATION SYSTEM ===');
  
  // 1. Database Connection
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.MONGO_URI);
  console.log('Connected to MongoDB.');

  // Clean old test data
  await HostelBlock.deleteMany({ name: 'Test Boys Hostel A' });
  await HostelAllocation.deleteMany({});
  await OutingRequest.deleteMany({});
  await StaffAttendance.deleteMany({});
  await Leave.deleteMany({});
  await PayrollRun.deleteMany({ month: '2026-06' });
  await Payslip.deleteMany({ month: '2026-06' });
  await Student.deleteMany({ admissionNumber: 'AD-VIRAT-18' });
  await FeeLedger.deleteMany({ session: '2025-26' });

  // Delete test users if they exist
  await User.deleteMany({ email: { $in: ['warden@vidyaerp.com', 'asstwarden@vidyaerp.com', 'hr@vidyaerp.com'] } });

  // Create test users
  const passwordHash = await bcrypt.hash('Password123!', 12);
  const wardenUser = await User.create({
    name: 'Warden Ramesh',
    email: 'warden@vidyaerp.com',
    passwordHash,
    role: 'hostel_warden',
    isActive: true,
  });
  const asstWardenUser = await User.create({
    name: 'Asst Warden Suresh',
    email: 'asstwarden@vidyaerp.com',
    passwordHash,
    role: 'asst_hostel_warden',
    isActive: true,
  });
  const hrUser = await User.create({
    name: 'HR manager Anita',
    email: 'hr@vidyaerp.com',
    passwordHash,
    role: 'hr_manager',
    isActive: true,
  });

  // Ensure Principal is seeded
  let principal = await User.findOne({ role: 'principal' });
  if (!principal) {
    principal = await User.create({
      name: 'Dr. Rajesh Sharma',
      email: 'principal@vidyaerp.com',
      passwordHash,
      role: 'principal',
      isActive: true,
    });
  }

  // Ensure Class Teacher is seeded
  let classTeacher = await User.findOne({ role: 'class_teacher' });
  if (!classTeacher) {
    classTeacher = await User.create({
      name: 'Anita Verma',
      email: 'classteacher@vidyaerp.com',
      passwordHash,
      role: 'class_teacher',
      isActive: true,
    });
  }

  // Create a student and fee ledger
  const student = await Student.create({
    admissionNumber: 'AD-VIRAT-18',
    rollNumber: '18',
    name: 'Virat Kohli',
    dob: new Date('1988-11-05'),
    gender: 'male',
    session: '2025-26',
    isBoarding: false,
  });

  const ledger = await FeeLedger.create({
    student: student._id,
    session: '2025-26',
    entries: [
      {
        head: 'Tution Fee',
        amount: 25000,
        dueDate: new Date('2026-06-30'),
        status: 'pending',
      }
    ],
    totalDue: 25000,
    totalPaid: 0,
    balance: 25000,
  });

  console.log('Seeded test users, student, and fee ledger.');

  // --- API TEST SUITE ---
  
  // 1. Logins
  console.log('\n--- 1. Performing Logins ---');
  const tokens = {};
  const roles = [
    { name: 'principal', email: 'principal@vidyaerp.com' },
    { name: 'warden', email: 'warden@vidyaerp.com' },
    { name: 'asstwarden', email: 'asstwarden@vidyaerp.com' },
    { name: 'hr', email: 'hr@vidyaerp.com' },
    { name: 'classteacher', email: 'classteacher@vidyaerp.com' },
  ];

  for (const r of roles) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: r.email, password: 'Password123!' }),
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      throw new Error(`Login failed for ${r.email}: ${JSON.stringify(body)}`);
    }
    tokens[r.name] = body.data.accessToken;
    console.log(`✅ Logged in as ${r.name}`);
  }

  // 2. Hostel Setup
  console.log('\n--- 2. Setting up Hostel & Rooms ---');
  const blockRes = await fetch(`${BASE_URL}/hostel/blocks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokens.warden}`,
    },
    body: JSON.stringify({
      name: 'Test Boys Hostel A',
      gender: 'male',
      floors: 2,
      rooms: [
        { roomNumber: '101', floor: 1, capacity: 2, type: 'double' },
        { roomNumber: '102', floor: 1, capacity: 1, type: 'single' },
      ],
    }),
  });
  const blockBody = await blockRes.json();
  if (!blockRes.ok || !blockBody.success) {
    throw new Error(`Failed to create block: ${JSON.stringify(blockBody)}`);
  }
  const blockId = blockBody.data._id;
  console.log('✅ Created hostel block Test Boys Hostel A');

  // 3. Room Allocation & Fee Linkage
  console.log('\n--- 3. Allocating Student to Room (Fee Linkage) ---');
  const allocRes = await fetch(`${BASE_URL}/hostel/allocations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokens.warden}`,
    },
    body: JSON.stringify({
      studentId: student._id.toString(),
      blockId,
      roomNumber: '101',
      bedNumber: 1,
      session: '2025-26',
    }),
  });
  const allocBody = await allocRes.json();
  if (!allocRes.ok || !allocBody.success) {
    throw new Error(`Room allocation failed: ${JSON.stringify(allocBody)}`);
  }
  console.log('✅ Allocated student Virat Kohli to Room 101 Bed 1');

  // Check ledger updates
  const updatedLedger = await FeeLedger.findOne({ student: student._id, session: '2025-26' });
  const feeEntry = updatedLedger.entries.find(e => e.head === 'Hostel Accommodation Fee');
  if (!feeEntry) {
    throw new Error('❌ Error: Hostel Accommodation Fee not charged to ledger.');
  }
  if (feeEntry.amount !== 12000) {
    throw new Error(`❌ Error: Expected ₹12,000 for double room, found ₹${feeEntry.amount}`);
  }
  console.log(`✅ Hostel Accommodation Fee correctly posted. Amount: ₹${feeEntry.amount}`);

  // Check boarding status
  const updatedStudent = await Student.findById(student._id);
  if (!updatedStudent.isBoarding) {
    throw new Error('❌ Error: Student isBoarding status is false, expected true.');
  }
  console.log('✅ Student isBoarding is true.');

  // 4. Outing Duration Approval Thresholds
  console.log('\n--- 4. Testing Outing Durations & Approval Thresholds ---');
  
  // Case A: Outing <= 24 hours (Asst Warden can approve)
  const outing1Res = await fetch(`${BASE_URL}/hostel/outings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokens.warden}`,
    },
    body: JSON.stringify({
      studentId: student._id.toString(),
      destination: 'Local Market',
      purpose: 'Shopping',
      departDate: new Date('2026-06-20T10:00:00Z'),
      returnDate: new Date('2026-06-20T18:00:00Z'), // 8 hours
    }),
  });
  const outing1Body = await outing1Res.json();
  const outing1Id = outing1Body.data._id;
  console.log('Created outing request 1 (8 hours).');

  // Approve short outing with Asst Warden (Should succeed)
  const app1Res = await fetch(`${BASE_URL}/hostel/outings/${outing1Id}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokens.asstwarden}`,
    },
    body: JSON.stringify({ status: 'approved' }),
  });
  const app1Body = await app1Res.json();
  if (!app1Res.ok || !app1Body.success) {
    throw new Error(`Asst Warden failed to approve short outing: ${JSON.stringify(app1Body)}`);
  }
  console.log('✅ Asst Warden successfully approved 8 hour outing.');

  // Case B: Outing between 24 and 48 hours (Asst Warden should fail, Warden should succeed)
  const outing2Res = await fetch(`${BASE_URL}/hostel/outings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokens.warden}`,
    },
    body: JSON.stringify({
      studentId: student._id.toString(),
      destination: 'Parent Home',
      purpose: 'Family Event',
      departDate: new Date('2026-06-21T08:00:00Z'),
      returnDate: new Date('2026-06-22T20:00:00Z'), // 36 hours
    }),
  });
  const outing2Body = await outing2Res.json();
  const outing2Id = outing2Body.data._id;
  console.log('Created outing request 2 (36 hours).');

  // Attempt approve with Asst Warden (Should fail - 403)
  const app2FailRes = await fetch(`${BASE_URL}/hostel/outings/${outing2Id}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokens.asstwarden}`,
    },
    body: JSON.stringify({ status: 'approved' }),
  });
  const app2FailBody = await app2FailRes.json();
  if (app2FailRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for Asst Warden approving 36 hour outing, got status ${app2FailRes.status}`);
  }
  console.log('✅ Asst Warden correctly denied for 36 hour outing.');

  // Approve with Warden (Should succeed)
  const app2Res = await fetch(`${BASE_URL}/hostel/outings/${outing2Id}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokens.warden}`,
    },
    body: JSON.stringify({ status: 'approved' }),
  });
  const app2Body = await app2Res.json();
  if (!app2Res.ok || !app2Body.success) {
    throw new Error(`Warden failed to approve 36 hour outing: ${JSON.stringify(app2Body)}`);
  }
  console.log('✅ Warden successfully approved 36 hour outing.');

  // Case C: Outing > 48 hours (Warden should fail, Principal should succeed)
  const outing3Res = await fetch(`${BASE_URL}/hostel/outings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokens.warden}`,
    },
    body: JSON.stringify({
      studentId: student._id.toString(),
      destination: 'Outstation Trip',
      purpose: 'Summer Camp',
      departDate: new Date('2026-06-23T08:00:00Z'),
      returnDate: new Date('2026-06-26T08:00:00Z'), // 72 hours
    }),
  });
  const outing3Body = await outing3Res.json();
  const outing3Id = outing3Body.data._id;
  console.log('Created outing request 3 (72 hours).');

  // Attempt approve with Warden (Should fail - 403)
  const app3FailRes = await fetch(`${BASE_URL}/hostel/outings/${outing3Id}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokens.warden}`,
    },
    body: JSON.stringify({ status: 'approved' }),
  });
  if (app3FailRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for Warden approving 72 hour outing, got status ${app3FailRes.status}`);
  }
  console.log('✅ Warden correctly denied for 72 hour outing.');

  // Approve with Principal (Should succeed)
  const app3Res = await fetch(`${BASE_URL}/hostel/outings/${outing3Id}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokens.principal}`,
    },
    body: JSON.stringify({ status: 'approved' }),
  });
  const app3Body = await app3Res.json();
  if (!app3Res.ok || !app3Body.success) {
    throw new Error(`Principal failed to approve 72 hour outing: ${JSON.stringify(app3Body)}`);
  }
  console.log('✅ Principal successfully approved 72 hour outing.');

  // 5. Staff Attendance & Leaves (For Payroll LOP)
  console.log('\n--- 5. Recording Staff Attendance & Leaves (for LOP) ---');
  
  // Mark Anita absent for 1 day
  await fetch(`${BASE_URL}/hr/attendance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokens.hr}`,
    },
    body: JSON.stringify({
      staffId: classTeacher._id.toString(),
      date: '2026-06-05',
      status: 'absent',
    }),
  });

  // Mark Anita half_day for 1 day
  await fetch(`${BASE_URL}/hr/attendance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokens.hr}`,
    },
    body: JSON.stringify({
      staffId: classTeacher._id.toString(),
      date: '2026-06-06',
      status: 'half_day',
    }),
  });

  console.log('Marked Anita Verma absent (1 day) and half_day (0.5 day) via API.');

  // Apply LOP leave for 1 day
  const leaveRes = await fetch(`${BASE_URL}/hr/leaves`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokens.classteacher}`,
    },
    body: JSON.stringify({
      type: 'LOP',
      fromDate: '2026-06-10T00:00:00.000Z',
      toDate: '2026-06-10T00:00:00.000Z',
      days: 1,
      reason: 'Urgent Personal Work',
    }),
  });
  const leaveBody = await leaveRes.json();
  const leaveId = leaveBody.data._id;
  console.log('Anita Verma applied for LOP leave of 1 day.');

  // Approve leave by HR Manager
  await fetch(`${BASE_URL}/hr/leaves/${leaveId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokens.hr}`,
    },
    body: JSON.stringify({ status: 'approved' }),
  });
  console.log('HR manager approved the LOP leave.');

  // Total LOP days should be: 1.0 (absent) + 0.5 (half_day) + 1.0 (approved LOP leave) = 2.5 days.

  // 6. Payroll initiation, submission, and disbursement
  console.log('\n--- 6. Processing Monthly Payroll & LOP Deductions ---');
  
  const initRes = await fetch(`${BASE_URL}/hr/payroll/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokens.hr}`,
    },
    body: JSON.stringify({ month: '2026-06' }),
  });
  const initBody = await initRes.json();
  if (!initRes.ok || !initBody.success) {
    throw new Error(`Payroll run initiation failed: ${JSON.stringify(initBody)}`);
  }
  const runId = initBody.data.run._id;
  console.log('✅ Payroll run initiated as draft for 2026-06.');

  // Fetch Anita Verma's payslip
  const payslipsRes = await fetch(`${BASE_URL}/hr/payslips?runId=${runId}&staffId=${classTeacher._id}`, {
    headers: { 'Authorization': `Bearer ${tokens.hr}` },
  });
  const payslipsBody = await payslipsRes.json();
  const payslip = payslipsBody.data[0];

  if (!payslip) {
    throw new Error('❌ Error: Could not find payslip for Anita Verma.');
  }

  console.log(`Anita Verma Payslip Details:`);
  console.log(`   Basic Salary: ₹${payslip.basicSalary}`);
  console.log(`   LOP Days: ${payslip.lopDays}`);
  console.log(`   LOP Amount: ₹${payslip.lopAmount}`);
  console.log(`   Net Salary: ₹${payslip.netSalary}`);

  if (payslip.lopDays !== 2.5) {
    throw new Error(`❌ Error: Expected LOP days to be 2.5, got ${payslip.lopDays}`);
  }
  
  // basic = 30000. LOP amount = (30000 / 30) * 2.5 = 2500
  if (payslip.lopAmount !== 2500) {
    throw new Error(`❌ Error: Expected LOP amount to be 2500, got ${payslip.lopAmount}`);
  }
  console.log('✅ LOP days (2.5) and LOP amount (₹2500) match calculations.');

  // Submit run
  const submitRes = await fetch(`${BASE_URL}/hr/payroll/runs/${runId}/submit`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokens.hr}` },
  });
  const submitBody = await submitRes.json();
  if (!submitRes.ok || !submitBody.success) {
    throw new Error(`Submission failed: ${JSON.stringify(submitBody)}`);
  }
  console.log('✅ Payroll run submitted to Principal.');

  // Disburse payroll (Principal co-authorizes & pays)
  const disburseRes = await fetch(`${BASE_URL}/hr/payroll/runs/${runId}/disburse`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokens.principal}` },
  });
  const disburseBody = await disburseRes.json();
  if (!disburseRes.ok || !disburseBody.success) {
    throw new Error(`Disbursement failed: ${JSON.stringify(disburseBody)}`);
  }
  console.log('✅ Payroll disbursed by Principal. Generated payslips.');

  // Verify file generation
  const verifyPayslipRes = await fetch(`${BASE_URL}/hr/payslips?runId=${runId}&staffId=${classTeacher._id}`, {
    headers: { 'Authorization': `Bearer ${tokens.hr}` },
  });
  const verifyPayslipBody = await verifyPayslipRes.json();
  const disbursedPayslip = verifyPayslipBody.data[0];

  if (!disbursedPayslip.fileUrl) {
    throw new Error('❌ Error: Payslip fileUrl is missing.');
  }

  console.log(`✅ Generated payslip file URL: ${disbursedPayslip.fileUrl}`);

  // Check if file exists on disk (fallback HTML or PDF)
  const relativePath = disbursedPayslip.fileUrl; // e.g. /uploads/payslips/payslip_xxx.pdf
  const fullPathPdf = path.join(__dirname, '..', relativePath);
  const fullPathHtml = fullPathPdf.replace(/\.pdf$/, '.html');

  if (fs.existsSync(fullPathPdf) || fs.existsSync(fullPathHtml)) {
    console.log('✅ File verified on disk.');
  } else {
    throw new Error(`❌ Error: File not found on disk at ${fullPathPdf} or ${fullPathHtml}`);
  }

  // --- CLEAN UP ---
  await HostelBlock.deleteMany({ name: 'Test Boys Hostel A' });
  await HostelAllocation.deleteMany({});
  await OutingRequest.deleteMany({});
  await StaffAttendance.deleteMany({});
  await Leave.deleteMany({});
  await PayrollRun.deleteMany({ month: '2026-06' });
  await Payslip.deleteMany({ month: '2026-06' });
  await Student.deleteMany({ admissionNumber: 'AD-VIRAT-18' });
  await FeeLedger.deleteMany({ session: '2025-26' });
  await User.deleteMany({ email: { $in: ['warden@vidyaerp.com', 'asstwarden@vidyaerp.com', 'hr@vidyaerp.com'] } });

  await mongoose.disconnect();
  console.log('\n🎉 ALL PHASE 4 INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Integration Test Failed:', err);
  mongoose.disconnect().then(() => process.exit(1));
});
