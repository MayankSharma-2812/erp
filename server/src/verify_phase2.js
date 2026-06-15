const BASE_URL = 'http://127.0.0.1:5000/api/v1';

const runVerification = async () => {
  console.log('=== Starting Phase 2 APIs & Scopes Verification ===\n');

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
    if (!createClassRes.ok || !classData.success) {
      throw new Error(`Class creation failed: ${JSON.stringify(classData)}`);
    }
    const classId = classData.data._id;
    console.log(`✅ Class created with ID: ${classId}`);

    // 3. Create Subject
    console.log('\n3. Creating Subject "Science" (Principal)...');
    const createSubjectRes = await fetch(`${BASE_URL}/academics/subjects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`,
      },
      body: JSON.stringify({
        name: 'Science',
        code: 'SCI101',
        class: classId,
        theoryMax: 80,
        practicalMax: 20,
        session: '2025-26',
      }),
    });
    const subjectData = await createSubjectRes.json();
    if (!createSubjectRes.ok || !subjectData.success) {
      throw new Error(`Subject creation failed: ${JSON.stringify(subjectData)}`);
    }
    const subjectId = subjectData.data._id;
    console.log(`✅ Subject created with ID: ${subjectId}`);

    // 4. Update Class Teacher to assign Class 10
    console.log('\n4. Assigning Class 10 to Anita Verma (Class Teacher)...');
    const usersRes = await fetch(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${principalToken}` },
    });
    const usersData = await usersRes.json();
    const teacher = usersData.data.find((u) => u.email === 'classteacher@vidyaerp.com');
    if (!teacher) {
      throw new Error('Class Teacher Anita Verma not found in database. Seed first.');
    }
    const teacherId = teacher._id;

    const updateUserRes = await fetch(`${BASE_URL}/users/${teacherId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`,
      },
      body: JSON.stringify({
        classAssigned: classId,
      }),
    });
    const updateUserData = await updateUserRes.json();
    if (!updateUserRes.ok || !updateUserData.success) {
      throw new Error(`Assigning class to teacher failed: ${JSON.stringify(updateUserData)}`);
    }
    console.log('✅ Class 10 assigned to teacher Anita Verma.');

    // 5. Log in Anita Verma (Class Teacher)
    console.log('\n5. Logging in Class Teacher Anita Verma...');
    const teacherLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'classteacher@vidyaerp.com', password: 'Password123!' }),
    });
    const teacherData = await teacherLoginRes.json();
    if (!teacherLoginRes.ok || !teacherData.success) {
      throw new Error(`Teacher login failed: ${JSON.stringify(teacherData)}`);
    }
    const teacherToken = teacherData.data.accessToken;
    console.log('✅ Class Teacher logged in successfully.');

    // 6. Test admissions pipeline flow
    console.log('\n6. Running Admissions Flow for Rohit Sharma...');
    
    // Create enquiry
    const enquiryRes = await fetch(`${BASE_URL}/admissions/enquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`, // Admissions officer or principal
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
      throw new Error(`Enquiry creation failed: ${JSON.stringify(enquiryData)}`);
    }
    const enquiryId = enquiryData.data._id;
    console.log(`✅ Enquiry created. ID: ${enquiryId}, EnquiryNo: ${enquiryData.data.enquiryNo}`);

    // Apply enquiry
    const applyRes = await fetch(`${BASE_URL}/admissions/enquiries/${enquiryId}/apply`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${principalToken}` },
    });
    const applyData = await applyRes.json();
    if (!applyRes.ok || !applyData.success) {
      throw new Error(`Apply stage failed: ${JSON.stringify(applyData)}`);
    }
    console.log('✅ Enquiry promoted to "applied".');

    // Test Score Entry
    const testRes = await fetch(`${BASE_URL}/admissions/enquiries/${enquiryId}/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`,
      },
      body: JSON.stringify({ testScore: 85, testRemarks: 'Cleared entrance test' }),
    });
    const testData = await testRes.json();
    if (!testRes.ok || !testData.success) {
      throw new Error(`Test score entry failed: ${JSON.stringify(testData)}`);
    }
    console.log('✅ Entrance test score recorded.');

    // Allocate Seat
    const allocateRes = await fetch(`${BASE_URL}/admissions/enquiries/${enquiryId}/allocate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`,
      },
      body: JSON.stringify({ seatAllocated: 'Class 10 - A', decisionNote: 'Offered seat A' }),
    });
    const allocateData = await allocateRes.json();
    if (!allocateRes.ok || !allocateData.success) {
      throw new Error(`Seat allocation failed: ${JSON.stringify(allocateData)}`);
    }
    console.log('✅ Seat allocated. Status: offer_sent.');

    // Confirm Admission (creates student)
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
      throw new Error(`Admission confirmation failed: ${JSON.stringify(confirmData)}`);
    }
    const studentId = confirmData.data.student._id;
    console.log(`✅ Admission confirmed. Student created with ID: ${studentId}, Admission No: ${confirmData.data.student.admissionNumber}`);

    // 7. Test Class Teacher scope boundaries on marking attendance
    console.log('\n7. Testing Class Teacher Scope Boundaries on Marking Attendance...');

    // Attempt to mark attendance for Class 10 (A) - Anita Verma is assigned to Class 10, so this should succeed.
    console.log('   Attempting to mark Class 10-A attendance (Should Succeed)...');
    const markSuccessRes = await fetch(`${BASE_URL}/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        classId,
        section: 'A',
        date: '2026-06-15',
        records: [{ studentId, status: 'present' }],
      }),
    });
    const markSuccessData = await markSuccessRes.json();
    if (markSuccessRes.ok && markSuccessData.success) {
      console.log('✅ Success: Attendance marked successfully for Class 10-A by Anita Verma.');
    } else {
      throw new Error(`Expected success, but failed: ${JSON.stringify(markSuccessData)}`);
    }

    // Attempt to mark attendance for a different class (Class 11) - Anita Verma is not assigned, so should fail with 403.
    console.log('   Attempting to mark Class 11-A attendance (Should Fail with 403 Forbidden)...');
    const fakeClassId = '666d696d696d696d696d696d'; // random ObjectID
    const markFailRes = await fetch(`${BASE_URL}/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        classId: fakeClassId,
        section: 'A',
        date: '2026-06-15',
        records: [{ studentId, status: 'present' }],
      }),
    });
    const markFailData = await markFailRes.json();
    if (markFailRes.status === 403) {
      console.log('✅ Success: Forbidden check block passed. Class Teacher correctly blocked from Class 11.');
      console.log('   Response message:', markFailData.message);
    } else {
      throw new Error(`Expected 403 Forbidden, but received Status ${markFailRes.status}: ${JSON.stringify(markFailData)}`);
    }

    // 8. Test Timetable double-booking conflicts
    console.log('\n8. Testing Timetable Double-Booking Conflicts...');

    // Book Monday Period 1 for Class 10 Section A (Subject: Science, Teacher: Anita Verma) -> Should succeed
    console.log('   Booking Monday Period 1 (Class 10-A, Science, Anita Verma) - Should Succeed...');
    const slot1Res = await fetch(`${BASE_URL}/academics/timetable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`,
      },
      body: JSON.stringify({
        class: classId,
        section: 'A',
        day: 'Mon',
        period: 1,
        startTime: '08:00 AM',
        endTime: '08:45 AM',
        subject: subjectId,
        teacher: teacherId,
        session: '2025-26',
      }),
    });
    const slot1Data = await slot1Res.json();
    if (slot1Res.ok && slot1Data.success) {
      console.log('✅ Success: Timetable slot 1 created successfully.');
    } else {
      throw new Error(`Expected success, but failed: ${JSON.stringify(slot1Data)}`);
    }

    // Book Monday Period 1 for same Class 10 Section A (Subject: Science, Teacher: Anita Verma) -> Should fail (Class Section conflict)
    console.log('   Booking Monday Period 1 again for Class 10-A (Class Section conflict check) - Should Fail...');
    const slot2Res = await fetch(`${BASE_URL}/academics/timetable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`,
      },
      body: JSON.stringify({
        class: classId,
        section: 'A',
        day: 'Mon',
        period: 1,
        startTime: '08:00 AM',
        endTime: '08:45 AM',
        subject: subjectId,
        teacher: teacherId,
        session: '2025-26',
      }),
    });
    const slot2Data = await slot2Res.json();
    if (slot2Res.status === 400) {
      console.log('✅ Success: Class section double-booking correctly prevented.');
      console.log('   Response message:', slot2Data.message);
    } else {
      throw new Error(`Expected 400 Bad Request, but received Status ${slot2Res.status}: ${JSON.stringify(slot2Data)}`);
    }

    // Book Monday Period 1 for Class 10 Section B with SAME teacher Anita Verma -> Should fail (Teacher conflict)
    console.log('   Booking Monday Period 1 for Class 10-B with same teacher Anita Verma (Teacher conflict check) - Should Fail...');
    const slot3Res = await fetch(`${BASE_URL}/academics/timetable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`,
      },
      body: JSON.stringify({
        class: classId,
        section: 'B',
        day: 'Mon',
        period: 1,
        startTime: '08:00 AM',
        endTime: '08:45 AM',
        subject: subjectId,
        teacher: teacherId,
        session: '2025-26',
      }),
    });
    const slot3Data = await slot3Res.json();
    if (slot3Res.status === 400) {
      console.log('✅ Success: Teacher double-booking conflict correctly prevented.');
      console.log('   Response message:', slot3Data.message);
    } else {
      throw new Error(`Expected 400 Bad Request, but received Status ${slot3Res.status}: ${JSON.stringify(slot3Data)}`);
    }

    // 9. Test 3+ Consecutive Absences Check
    console.log('\n9. Testing 3+ Consecutive Absences Check...');

    // Mark Rohit Sharma absent for 3 consecutive days: June 10, June 11, June 12
    const dates = ['2026-06-10', '2026-06-11', '2026-06-12'];
    for (const dt of dates) {
      const attRes = await fetch(`${BASE_URL}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principalToken}`,
        },
        body: JSON.stringify({
          classId,
          section: 'A',
          date: dt,
          records: [{ studentId, status: 'absent' }],
        }),
      });
      const attData = await attRes.json();
      if (!attRes.ok || !attData.success) {
        throw new Error(`Failed marking Rohit Sharma absent on ${dt}: ${JSON.stringify(attData)}`);
      }
    }
    console.log('   Marked Rohit Sharma absent on June 10, 11, 12.');

    // Query consecutive absences
    const flaggedRes = await fetch(`${BASE_URL}/attendance/consecutive-absences?classId=${classId}&section=A`, {
      headers: { Authorization: `Bearer ${principalToken}` },
    });
    const flaggedData = await flaggedRes.json();
    if (!flaggedRes.ok || !flaggedData.success) {
      throw new Error(`Querying flagged absences failed: ${JSON.stringify(flaggedData)}`);
    }

    const rohitFlagged = flaggedData.data.find((f) => f.studentId === studentId);
    if (rohitFlagged && rohitFlagged.consecutiveAbsentCount >= 3) {
      console.log(`✅ Success: Rohit Sharma flagged for consecutive absences.`);
      console.log(`   Consecutive Absent Count: ${rohitFlagged.consecutiveAbsentCount} days.`);
    } else {
      throw new Error(`Expected Rohit Sharma to be flagged with >= 3 consecutive days, but received: ${JSON.stringify(flaggedData)}`);
    }

    console.log('\n🎉 ALL Phase 2 API and RBAC verification checks passed successfully!');
  } catch (error) {
    console.error('\n❌ Verification Failed:', error.message);
    process.exit(1);
  }
};

runVerification();
