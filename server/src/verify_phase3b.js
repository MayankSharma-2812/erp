const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const config = require('./config/env');
const User = require('./models/User');

const BASE_URL = 'http://127.0.0.1:5000/api/v1';

const setupAccountsOfficer = async () => {
  console.log('Connecting to DB to ensure Accounts Officer user exists...');
  await mongoose.connect(config.MONGO_URI);
  
  const FeeStructure = require('./models/FeeStructure');
  const FeeLedger = require('./models/FeeLedger');
  const FeeTransaction = require('./models/FeeTransaction');
  const Student = require('./models/Student');
  const Admission = require('./models/Admission');
  const FeeWaiver = require('./models/FeeWaiver');
  const RazorpayOrder = require('./models/RazorpayOrder');

  await Promise.all([
    FeeStructure.deleteMany({}),
    FeeLedger.deleteMany({}),
    FeeTransaction.deleteMany({}),
    FeeWaiver.deleteMany({}),
    RazorpayOrder.deleteMany({}),
    Student.deleteMany({ name: 'Rohit Sharma' }),
    Admission.deleteMany({ studentName: 'Rohit Sharma' }),
  ]);
  console.log('Cleared existing Phase 3B test collections data.');

  const email = 'accountsofficer@vidyaerp.com';
  let ao = await User.findOne({ email });
  if (!ao) {
    const passwordHash = await bcrypt.hash('Password123!', 12);
    ao = await User.create({
      name: 'AO Finance Officer',
      email,
      passwordHash,
      role: 'accounts_officer',
      isActive: true,
    });
    console.log('✅ Accounts Officer created.');
  } else {
    console.log('✅ Accounts Officer already exists.');
  }
  
  await mongoose.disconnect();
};

const runVerification = async () => {
  console.log('=== Starting Phase 3B Finance & Fee Collection Verification ===\n');

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

    // 2. Create Class
    console.log('\n2. Creating Class "Class 10" (Principal)...');
    const createClassRes = await fetch(`${BASE_URL}/academics/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`,
      },
      body: JSON.stringify({
        name: 'Class 10',
        sections: ['A', 'B'],
        session: '2025-26',
      }),
    });
    const classData = await createClassRes.json();
    let classId;
    if (!createClassRes.ok || !classData.success) {
      // If class already exists, fetch it
      const fetchClassesRes = await fetch(`${BASE_URL}/academics/classes`, {
        headers: { Authorization: `Bearer ${principalToken}` },
      });
      const classesData = await fetchClassesRes.json();
      const existing = classesData.data.find(c => c.name === 'Class 10');
      if (!existing) {
        throw new Error(`Class creation failed: ${JSON.stringify(classData)}`);
      }
      classId = existing._id;
      console.log(`✅ Class 10 already exists with ID: ${classId}`);
    } else {
      classId = classData.data._id;
      console.log(`✅ Class created with ID: ${classId}`);
    }

    // 3. Configure Fee Structure (Principal)
    console.log('\n3. Creating Fee Structure for Class 10 (Principal)...');
    const structureRes = await fetch(`${BASE_URL}/finance/structures`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`,
      },
      body: JSON.stringify({
        session: '2025-26',
        class: classId,
        heads: [
          { name: 'Tuition Fee', amount: 15000, frequency: 'monthly', dueDay: 10 },
          { name: 'Transport Fee', amount: 5000, frequency: 'monthly', dueDay: 5 }
        ]
      }),
    });
    const structureData = await structureRes.json();
    if (!structureRes.ok || !structureData.success) {
      // If already exists, delete and recreate or retrieve
      console.log('Fee structure already exists. Fetching existing...');
      const getStructuresRes = await fetch(`${BASE_URL}/finance/structures?session=2025-26&classId=${classId}`, {
        headers: { Authorization: `Bearer ${principalToken}` },
      });
      const structs = await getStructuresRes.json();
      const existingStruct = structs.data[0];
      if (!existingStruct) {
        throw new Error(`Failed to create/get fee structure: ${JSON.stringify(structureData)}`);
      }
      console.log(`✅ Fee Structure exists with ID: ${existingStruct._id}`);
    } else {
      console.log(`✅ Fee Structure created with ID: ${structureData.data._id}`);
    }

    // 4. Confirm Admission (triggers auto-ledger)
    console.log('\n4. Confirming Admission for Rohit Sharma to trigger Auto-Ledger...');
    
    // Create Enquiry
    const enquiryRes = await fetch(`${BASE_URL}/admissions/enquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`,
      },
      body: JSON.stringify({
        studentName: 'Rohit Sharma',
        dob: '2012-05-15',
        gender: 'male',
        classAppliedFor: 'Class 10',
        fatherName: 'Vijay Sharma',
        motherName: 'Sunita Sharma',
        contactPhone: '9876543210',
        contactEmail: 'vijay@gmail.com',
      }),
    });
    const enquiryData = await enquiryRes.json();
    if (!enquiryRes.ok || !enquiryData.success) {
      throw new Error(`Enquiry failed: ${JSON.stringify(enquiryData)}`);
    }
    const enquiryId = enquiryData.data._id;

    // Apply
    await fetch(`${BASE_URL}/admissions/enquiries/${enquiryId}/apply`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${principalToken}` },
    });

    // Test score
    await fetch(`${BASE_URL}/admissions/enquiries/${enquiryId}/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`,
      },
      body: JSON.stringify({ testScore: 80 }),
    });

    // Allocate
    await fetch(`${BASE_URL}/admissions/enquiries/${enquiryId}/allocate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`,
      },
      body: JSON.stringify({ seatAllocated: 'Class 10 - A', stage: 'offer_sent' }),
    });

    // Confirm
    const confirmRes = await fetch(`${BASE_URL}/admissions/enquiries/${enquiryId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`,
      },
      body: JSON.stringify({ classId, section: 'A', session: '2025-26' }),
    });
    const confirmData = await confirmRes.json();
    if (!confirmRes.ok || !confirmData.success) {
      throw new Error(`Confirm admission failed: ${JSON.stringify(confirmData)}`);
    }
    const studentId = confirmData.data.student._id;
    console.log(`✅ Admission Confirmed. Student created with ID: ${studentId}`);

    // Retrieve Student's Auto-Ledger
    console.log('\nRetrieving Rohit Sharma\'s fee ledger...');
    const ledgerRes = await fetch(`${BASE_URL}/finance/ledger/student/${studentId}`, {
      headers: { Authorization: `Bearer ${principalToken}` },
    });
    const ledgerData = await ledgerRes.json();
    if (!ledgerRes.ok || !ledgerData.success) {
      throw new Error(`Failed to fetch student ledger: ${JSON.stringify(ledgerData)}`);
    }
    const ledger = ledgerData.data;
    console.log(`✅ Auto-created ledger found. Session: ${ledger.session}`);
    console.log(`   Total Due: ₹${ledger.totalDue}, Balance: ₹${ledger.balance}`);
    console.log(`   Entries count: ${ledger.entries.length}`);
    ledger.entries.forEach(e => {
      console.log(`   - ${e.head}: amount ₹${e.amount}, status: ${e.status}, due: ${new Date(e.dueDate).toLocaleDateString()}`);
    });

    if (ledger.entries.length !== 2) {
      throw new Error(`Expected exactly 2 ledger entries, found: ${ledger.entries.length}`);
    }

    // 5. Log in Cashier
    console.log('\n5. Logging in Cashier Ramesh Kumar...');
    const cashierLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'cashier@vidyaerp.com', password: 'Password123!' }),
    });
    const cashierData = await cashierLoginRes.json();
    if (!cashierLoginRes.ok || !cashierData.success) {
      throw new Error(`Cashier login failed: ${JSON.stringify(cashierData)}`);
    }
    const cashierToken = cashierData.data.accessToken;
    console.log('✅ Cashier logged in successfully.');

    // 6. Cashier: Collect Manual Payment < 10,000 (Tuition Fee)
    console.log('\n6. Cashier: Recording manual payment of ₹5,000 (Tuition Fee)...');
    const pay1Res = await fetch(`${BASE_URL}/finance/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cashierToken}`,
      },
      body: JSON.stringify({
        studentId,
        amount: 5000,
        method: 'cash',
        heads: ['Tuition Fee'],
        session: '2025-26',
      }),
    });
    const pay1Data = await pay1Res.json();
    if (!pay1Res.ok || !pay1Data.success) {
      throw new Error(`Manual payment failed: ${JSON.stringify(pay1Data)}`);
    }
    console.log(`✅ Payment successful. Receipt: ${pay1Data.data.receiptNumber}, Status: ${pay1Data.data.status}`);

    // Verify Ledger updated
    const ledgerRes2 = await fetch(`${BASE_URL}/finance/ledger/student/${studentId}`, {
      headers: { Authorization: `Bearer ${principalToken}` },
    });
    const ledger2 = (await ledgerRes2.json()).data;
    console.log(`   Updated Ledger - Total Paid: ₹${ledger2.totalPaid}, Balance: ₹${ledger2.balance}`);
    if (ledger2.totalPaid !== 5000) {
      throw new Error(`Expected totalPaid to be 5000, got ${ledger2.totalPaid}`);
    }

    // 7. Cashier: Collect Manual Payment > 10,000 (Requires Countersign)
    console.log('\n7. Cashier: Recording manual payment of ₹12,000 (Tuition + Transport)...');
    const pay2Res = await fetch(`${BASE_URL}/finance/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cashierToken}`,
      },
      body: JSON.stringify({
        studentId,
        amount: 12000,
        method: 'cheque',
        heads: ['Tuition Fee', 'Transport Fee'],
        session: '2025-26',
        reference: 'CHQ-998811',
      }),
    });
    const pay2Data = await pay2Res.json();
    if (pay2Res.status !== 202) {
      throw new Error(`Expected HTTP 202 Accepted, got ${pay2Res.status}: ${JSON.stringify(pay2Data)}`);
    }
    console.log(`✅ Payment accepted as pending. Message: "${pay2Data.message}"`);
    const pendingTxId = pay2Data.data._id;

    // Verify Ledger NOT updated
    const ledgerRes3 = await fetch(`${BASE_URL}/finance/ledger/student/${studentId}`, {
      headers: { Authorization: `Bearer ${principalToken}` },
    });
    const ledger3 = (await ledgerRes3.json()).data;
    console.log(`   Verify Ledger Locked - Total Paid remains: ₹${ledger3.totalPaid}`);
    if (ledger3.totalPaid !== 5000) {
      throw new Error(`Expected totalPaid to remain 5000, got ${ledger3.totalPaid}`);
    }

    // 8. Cashier Role Scope Lockout check
    console.log('\n8. Testing Cashier role restriction: Trying to POST fee structure as Cashier...');
    const failStructureRes = await fetch(`${BASE_URL}/finance/structures`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cashierToken}`,
      },
      body: JSON.stringify({
        session: '2025-26',
        class: classId,
        heads: [{ name: 'Hacker Fee', amount: 100, frequency: 'annual', dueDay: 1 }],
      }),
    });
    const failStructureData = await failStructureRes.json();
    if (failStructureRes.status !== 403) {
      throw new Error(`Expected HTTP 403 Forbidden, got ${failStructureRes.status}`);
    }
    console.log(`✅ Cashier correctly blocked. Response: "${failStructureData.message}"`);

    // 9. Log in Accounts Officer
    console.log('\n9. Logging in Accounts Officer...');
    const aoLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'accountsofficer@vidyaerp.com', password: 'Password123!' }),
    });
    const aoData = await aoLoginRes.json();
    if (!aoLoginRes.ok || !aoData.success) {
      throw new Error(`AO login failed: ${JSON.stringify(aoData)}`);
    }
    const aoToken = aoData.data.accessToken;
    console.log('✅ Accounts Officer logged in.');

    // 10. Accounts Officer: Approve Countersign Payment
    console.log(`\n10. Accounts Officer: Approving pending payment ID ${pendingTxId}...`);
    const approveRes = await fetch(`${BASE_URL}/finance/countersigns/${pendingTxId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${aoToken}` },
    });
    const approveData = await approveRes.json();
    if (!approveRes.ok || !approveData.success) {
      throw new Error(`Countersign approval failed: ${JSON.stringify(approveData)}`);
    }
    console.log('✅ Countersigned successfully.');

    // Verify Ledger IS now updated
    const ledgerRes4 = await fetch(`${BASE_URL}/finance/ledger/student/${studentId}`, {
      headers: { Authorization: `Bearer ${principalToken}` },
    });
    const ledger4 = (await ledgerRes4.json()).data;
    console.log(`    Verify Ledger Updated - Total Paid: ₹${ledger4.totalPaid}, Balance: ₹${ledger4.balance}`);
    if (ledger4.totalPaid !== 17000) {
      throw new Error(`Expected totalPaid to be 17000, got ${ledger4.totalPaid}`);
    }

    // 11. Razorpay Webhook HMAC Simulation
    console.log('\n11. Testing Razorpay Webhook Signature flow...');
    
    // Create an order first
    const orderRes = await fetch(`${BASE_URL}/finance/razorpay/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`,
      },
      body: JSON.stringify({
        studentId,
        amount: 2000,
        heads: ['Transport Fee'],
        session: '2025-26',
      }),
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok || !orderData.success) {
      throw new Error(`Order creation failed: ${JSON.stringify(orderData)}`);
    }
    const rzpOrderId = orderData.data.id;
    console.log(`✅ Razorpay order created: ${rzpOrderId}`);

    // Create webhook payload
    const webhookPayload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_ABC123XYZ',
            order_id: rzpOrderId,
            amount: 200000, // in paise
            status: 'captured',
          }
        }
      }
    };

    // Calculate HMAC
    const shasum = crypto.createHmac('sha256', config.RAZORPAY_WEBHOOK_SECRET);
    shasum.update(JSON.stringify(webhookPayload));
    const signature = shasum.digest('hex');

    // Trigger webhook route
    const webhookRes = await fetch(`${BASE_URL}/finance/razorpay/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature,
      },
      body: JSON.stringify(webhookPayload),
    });
    const webhookData = await webhookRes.json();
    if (!webhookRes.ok || !webhookData.success) {
      throw new Error(`Webhook validation failed: ${JSON.stringify(webhookData)}`);
    }
    console.log(`✅ Webhook processed successfully. Message: "${webhookData.message}"`);

    // Verify Ledger updated by Webhook
    const ledgerRes5 = await fetch(`${BASE_URL}/finance/ledger/student/${studentId}`, {
      headers: { Authorization: `Bearer ${principalToken}` },
    });
    const ledger5 = (await ledgerRes5.json()).data;
    console.log(`    Verify Webhook update - Total Paid: ₹${ledger5.totalPaid}, Balance: ₹${ledger5.balance}`);
    
    // 12. Defaulters Report Query
    console.log('\n12. Querying Defaulters Report (Accounts Officer)...');
    const defaultersRes = await fetch(`${BASE_URL}/finance/defaulters`, {
      headers: { Authorization: `Bearer ${aoToken}` },
    });
    const defaultersData = await defaultersRes.json();
    if (!defaultersRes.ok || !defaultersData.success) {
      throw new Error(`Defaulters report failed: ${JSON.stringify(defaultersData)}`);
    }
    console.log(`✅ Defaulters list length: ${defaultersData.data.length}`);
    defaultersData.data.forEach(d => {
      console.log(`   Student: ${d.student.name}, Balance Due: ₹${d.balance}, Escalated: ${d.escalated}`);
    });

    // 13. Fee Waivers Workflow Verification
    console.log('\n13. Testing Fee Waiver Request & Approval Flow...');
    const waiverRequestRes = await fetch(`${BASE_URL}/finance/waivers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aoToken}`,
      },
      body: JSON.stringify({
        studentId,
        heads: ['Transport Fee'],
        amount: 1000,
        reason: 'Merit scholarship waiver',
        session: '2025-26',
      }),
    });
    const waiverRequestData = await waiverRequestRes.json();
    if (!waiverRequestRes.ok || !waiverRequestData.success) {
      throw new Error(`Waiver request failed: ${JSON.stringify(waiverRequestData)}`);
    }
    const waiverId = waiverRequestData.data._id;
    console.log(`✅ Waiver request submitted. ID: ${waiverId}, Status: ${waiverRequestData.data.status}`);

    // Principal Approve Waiver
    console.log('    Principal: Approving the waiver request...');
    const approveWaiverRes = await fetch(`${BASE_URL}/finance/waivers/${waiverId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${principalToken}` },
    });
    const approveWaiverData = await approveWaiverRes.json();
    if (!approveWaiverRes.ok || !approveWaiverData.success) {
      throw new Error(`Waiver approval failed: ${JSON.stringify(approveWaiverData)}`);
    }
    console.log('✅ Waiver approved successfully.');

    // Verify Ledger Waived Amount
    const ledgerRes6 = await fetch(`${BASE_URL}/finance/ledger/student/${studentId}`, {
      headers: { Authorization: `Bearer ${principalToken}` },
    });
    const ledger6 = (await ledgerRes6.json()).data;
    console.log(`    Verify Waiver - Total Paid: ₹${ledger6.totalPaid}, Waived: ₹${ledger6.entries.reduce((sum, e) => sum + e.waivedAmount, 0)}, Balance: ₹${ledger6.balance}`);

    console.log('\n🎉 ALL Phase 3B FINANCE MODULE VERIFICATIONS PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:', error.message);
    process.exit(1);
  }
};

const run = async () => {
  await setupAccountsOfficer();
  await runVerification();
  process.exit(0);
};

run();
