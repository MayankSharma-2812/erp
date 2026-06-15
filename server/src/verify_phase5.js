const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const config = require('./config/env');
const User = require('./models/User');

const BASE_URL = 'http://127.0.0.1:5000/api/v1';

const setupMedicalOfficerAndData = async () => {
  console.log('Connecting to DB to ensure Medical Officer and clean state exists...');
  await mongoose.connect(config.MONGO_URI);
  
  // 1. Ensure Medical Officer exists
  const email = 'medicalofficer@vidyaerp.com';
  let mo = await User.findOne({ email });
  if (!mo) {
    const passwordHash = await bcrypt.hash('Password123!', 12);
    mo = await User.create({
      name: 'Dr. John Doe',
      email,
      passwordHash,
      role: 'medical_officer',
      isActive: true,
    });
    console.log('✅ Medical Officer created.');
  }

  // 2. Clear Phase 5 test collections
  const Book = require('./models/Book');
  const BookIssue = require('./models/BookIssue');
  const LibraryFine = require('./models/LibraryFine');
  const Route = require('./models/Route');
  const Vehicle = require('./models/Vehicle');
  const Driver = require('./models/Driver');
  const TransportAllocation = require('./models/TransportAllocation');
  const HealthProfile = require('./models/HealthProfile');
  const ClinicVisit = require('./models/ClinicVisit');
  const MedicationLog = require('./models/MedicationLog');
  const SickbayRegister = require('./models/SickbayRegister');
  const Student = require('./models/Student');
  const FeeLedger = require('./models/FeeLedger');
  const Class = require('./models/Class');

  await Promise.all([
    Book.deleteMany({}),
    BookIssue.deleteMany({}),
    LibraryFine.deleteMany({}),
    Route.deleteMany({}),
    Vehicle.deleteMany({}),
    Driver.deleteMany({}),
    TransportAllocation.deleteMany({}),
    HealthProfile.deleteMany({}),
    ClinicVisit.deleteMany({}),
    MedicationLog.deleteMany({}),
    SickbayRegister.deleteMany({}),
    Student.deleteMany({ name: 'Virat Kohli' }),
    FeeLedger.deleteMany({}),
  ]);
  console.log('Cleared existing Phase 5 test collections data.');

  // Create a default Class 11 and Student Virat Kohli + empty FeeLedger
  let classObj = await Class.findOne({ name: 'Class 11' });
  if (!classObj) {
    classObj = await Class.create({
      name: 'Class 11',
      sections: ['A'],
      session: '2025-26',
    });
  }

  const student = await Student.create({
    admissionNumber: `ADM-${Date.now()}-99`,
    name: 'Virat Kohli',
    dob: new Date('2012-11-05'),
    gender: 'male',
    class: classObj._id,
    section: 'A',
    session: '2025-26',
    status: 'active',
  });

  await FeeLedger.create({
    student: student._id,
    session: '2025-26',
    entries: [],
    totalDue: 0,
    totalPaid: 0,
    balance: 0,
  });

  console.log(`✅ Seeded student Virat Kohli (ID: ${student._id}) for Phase 5 tests.`);
  await mongoose.disconnect();
};

const runVerification = async () => {
  console.log('=== Starting Phase 5 operations & Scopes Verification ===\n');

  try {
    // 1. Log in Principal
    console.log('1. Logging in Principal...');
    const principalLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'principal@vidyaerp.com', password: 'Password123!' }),
    });
    const principalData = await principalLoginRes.json();
    if (!principalLoginRes.ok || !principalData.success) {
      throw new Error(`Principal login failed: ${JSON.stringify(principalData)}`);
    }
    const principalToken = principalData.data.accessToken;
    console.log('✅ Principal logged in successfully.');

    // Get Virat Kohli student ID
    const studentsRes = await fetch(`${BASE_URL}/students`, {
      headers: { Authorization: `Bearer ${principalToken}` },
    });
    const studentsData = await studentsRes.json();
    const student = studentsData.data.find(s => s.name === 'Virat Kohli');
    if (!student) throw new Error('Student Virat Kohli not seeded correctly.');
    const studentId = student._id;

    // 2. Setup a Route (Principal/Transport Manager)
    console.log('\n2. Setting up Route "Route 9 - Delhi NCR"...');
    const routeRes = await fetch(`${BASE_URL}/transport/routes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`,
      },
      body: JSON.stringify({
        name: 'Route 9 - Delhi NCR',
        feeAmount: 4000,
        stops: [{ name: 'Noida Hub', time: '07:15', order: 1 }],
      }),
    });
    const routeData = await routeRes.json();
    if (!routeRes.ok || !routeData.success) {
      throw new Error(`Route setup failed: ${JSON.stringify(routeData)}`);
    }
    const routeId = routeData.data._id;
    console.log(`✅ Route setup completed with ID: ${routeId}`);

    // 3. Allocate Student to Route (Triggers Transport Route Fee)
    console.log(`\n3. Allocating Virat Kohli to Route 9 (Triggers Ledger Addition)...`);
    const allocRes = await fetch(`${BASE_URL}/transport/allocations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`,
      },
      body: JSON.stringify({
        studentId,
        routeId,
        stop: 'Noida Hub',
        session: '2025-26',
      }),
    });
    const allocData = await allocRes.json();
    if (!allocRes.ok || !allocData.success) {
      throw new Error(`Transport allocation failed: ${JSON.stringify(allocData)}`);
    }
    console.log('✅ Transport allocation completed.');

    // Fetch and check Virat's Ledger
    const ledgerRes1 = await fetch(`${BASE_URL}/finance/ledger/student/${studentId}`, {
      headers: { Authorization: `Bearer ${principalToken}` },
    });
    const ledger1 = (await ledgerRes1.json()).data;
    console.log(`   Virat's Ledger - Total Due: ₹${ledger1.totalDue}, Balance: ₹${ledger1.balance}`);
    const transportEntry = ledger1.entries.find(e => e.head === 'Transport Route Fee');
    if (!transportEntry || transportEntry.amount !== 4000) {
      throw new Error('Expected "Transport Route Fee" entry of ₹4000 in ledger.');
    }
    console.log('✅ Transport fee linkage verified in Student Ledger.');

    // 4. Catalog a Book
    console.log('\n4. Cataloging book "Clean Code" in Library...');
    const bookRes = await fetch(`${BASE_URL}/library/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`,
      },
      body: JSON.stringify({
        isbn: '978-0132350884',
        title: 'Clean Code',
        authors: ['Robert C. Martin'],
        copies: 2,
      }),
    });
    const bookData = await bookRes.json();
    if (!bookRes.ok || !bookData.success) {
      throw new Error(`Book cataloging failed: ${JSON.stringify(bookData)}`);
    }
    const bookId = bookData.data._id;
    console.log(`✅ Book cataloged with ID: ${bookId}`);

    // 5. Issue Book (set dueDate in the past to test fines)
    console.log('\n5. Issuing "Clean Code" to Virat Kohli (Due Date set to 3 days ago)...');
    const pastDueDate = new Date();
    pastDueDate.setDate(pastDueDate.getDate() - 3);

    const issueRes = await fetch(`${BASE_URL}/library/issues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`,
      },
      body: JSON.stringify({
        bookId,
        studentId,
        dueDate: pastDueDate,
      }),
    });
    const issueData = await issueRes.json();
    if (!issueRes.ok || !issueData.success) {
      throw new Error(`Book issue failed: ${JSON.stringify(issueData)}`);
    }
    const issueId = issueData.data._id;
    console.log(`✅ Book issued. Issue ID: ${issueId}`);

    // 6. Return Book (Triggers Overdue Fine)
    console.log('\n6. Returning Book to trigger Overdue Fine (₹10/day)...');
    const returnRes = await fetch(`${BASE_URL}/library/issues/${issueId}/return`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${principalToken}` },
    });
    const returnData = await returnRes.json();
    if (!returnRes.ok || !returnData.success) {
      throw new Error(`Book return failed: ${JSON.stringify(returnData)}`);
    }
    console.log(`✅ Book returned. Message: "${returnData.message}"`);

    // Fetch and check Virat's Ledger
    const ledgerRes2 = await fetch(`${BASE_URL}/finance/ledger/student/${studentId}`, {
      headers: { Authorization: `Bearer ${principalToken}` },
    });
    const ledger2 = (await ledgerRes2.json()).data;
    console.log(`   Virat's Ledger - Total Due: ₹${ledger2.totalDue}, Balance: ₹${ledger2.balance}`);
    const fineEntry = ledger2.entries.find(e => e.head === 'Library Overdue Fine');
    if (!fineEntry || fineEntry.amount <= 0) {
      throw new Error('Expected "Library Overdue Fine" entry in ledger.');
    }
    console.log(`✅ Library fine linkage verified in Student Ledger. Fine amount: ₹${fineEntry.amount}`);

    // 7. Log in Medical Officer
    console.log('\n7. Logging in Medical Officer...');
    const moLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'medicalofficer@vidyaerp.com', password: 'Password123!' }),
    });
    const moData = await moLoginRes.json();
    if (!moLoginRes.ok || !moData.success) {
      throw new Error(`MO login failed: ${JSON.stringify(moData)}`);
    }
    const moToken = moData.data.accessToken;
    console.log('✅ Medical Officer logged in successfully.');

    // 8. Record Clinic Visit (Medical Officer)
    console.log('\n8. Recording Clinic Visit for Virat Kohli (Medical Officer)...');
    const visitRes = await fetch(`${BASE_URL}/health/visits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${moToken}`,
      },
      body: JSON.stringify({
        student: studentId,
        complaint: 'Severe Sore Throat & high fever',
        examination: 'Temp 101.5F, Throats inflamed',
        diagnosis: 'Acute Streptococcal Tonsillitis',
        treatment: 'Amoxicillin prescribed. Warm saline gargles.',
      }),
    });
    const visitData = await visitRes.json();
    if (!visitRes.ok || !visitData.success) {
      throw new Error(`Clinic visit recording failed: ${JSON.stringify(visitData)}`);
    }
    console.log('✅ Clinic visit recorded.');

    // 9. Verify Scopes / Field masking (Log in IT Admin Suresh Patel)
    console.log('\n9. Logging in IT Admin Suresh Patel to test field masking...');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'itadmin@vidyaerp.com', password: 'Password123!' }),
    });
    const adminToken = (await adminLoginRes.json()).data.accessToken;

    console.log('   IT Admin retrieving clinic visits (Should be masked)...');
    const maskedVisitsRes = await fetch(`${BASE_URL}/health/visits?studentId=${studentId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const maskedVisits = (await maskedVisitsRes.json()).data;
    const testVisit = maskedVisits[0];
    console.log(`   Retrieved Visit Details - Diagnosis: "${testVisit.diagnosis}", Examination: "${testVisit.examination}"`);
    
    if (testVisit.diagnosis !== '[RESTRICTED - MEDICAL ONLY]' || testVisit.examination !== '[RESTRICTED - MEDICAL ONLY]') {
      throw new Error('Medical data leakage detected. Field masking failed.');
    }
    console.log('✅ Field masking verification passed. Sensitive fields protected.');

    // 10. Principal: Query Clinic Visits (Should see raw values)
    console.log('\n10. Principal retrieving clinic visits (Should see raw diagnosis)...');
    const rawVisitsRes = await fetch(`${BASE_URL}/health/visits?studentId=${studentId}`, {
      headers: { Authorization: `Bearer ${principalToken}` },
    });
    const rawVisits = (await rawVisitsRes.json()).data;
    console.log(`    Retrieved Visit Details - Diagnosis: "${rawVisits[0].diagnosis}"`);
    if (rawVisits[0].diagnosis === '[RESTRICTED - MEDICAL ONLY]') {
      throw new Error('Principal should see the real medical diagnosis.');
    }
    console.log('✅ Principal permissions verified. Full medical visibility allowed.');

    // 11. Reports & Analytics Summary (Principal)
    console.log('\n11. Querying Principal Dashboard Summary reports...');
    const reportRes = await fetch(`${BASE_URL}/reports/summary`, {
      headers: { Authorization: `Bearer ${principalToken}` },
    });
    const reportData = await reportRes.json();
    if (!reportRes.ok || !reportData.success) {
      throw new Error(`Summary report failed: ${JSON.stringify(reportData)}`);
    }
    console.log('✅ Summary report aggregations verified:');
    console.log(`   - Average Attendance: ${reportData.data.attendanceRate}%`);
    console.log(`   - Total Fees Collected: ₹${reportData.data.finance?.totalPaid}`);
    console.log(`   - Hostel Occupancy Percentage: ${reportData.data.hostelOccupancy?.percentage}%`);

    console.log('\n🎉 ALL Phase 5 LIBRARY, TRANSPORT, HEALTH, AND REPORTS VERIFICATIONS PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:', error.message);
    process.exit(1);
  }
};

const run = async () => {
  await setupMedicalOfficerAndData();
  await runVerification();
  process.exit(0);
};

run();
