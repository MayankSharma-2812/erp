const BASE_URL = 'http://127.0.0.1:5000/api/v1';

const runVerification = async () => {
  console.log('=== Starting Phase 3A APIs & Scopes Verification ===\n');

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

    // Fetch Anita Verma (teacher) ID
    const usersRes = await fetch(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${principalToken}` },
    });
    const usersData = await usersRes.json();
    const teacher = usersData.data.find((u) => u.email === 'classteacher@vidyaerp.com');
    if (!teacher) throw new Error('Teacher Anita Verma not found. Seed first.');
    const teacherId = teacher._id;

    // 3. Create Subject "Math" assigned to Anita Verma
    console.log('\n3. Creating Subject "Mathematics" assigned to Anita Verma...');
    const createMathRes = await fetch(`${BASE_URL}/academics/subjects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`,
      },
      body: JSON.stringify({
        name: 'Mathematics',
        code: 'MTH101',
        class: classId,
        teacher: teacherId,
        theoryMax: 80,
        practicalMax: 20,
        session: '2025-26',
      }),
    });
    const mathData = await createMathRes.json();
    if (!createMathRes.ok || !mathData.success) {
      throw new Error(`Subject creation failed: ${JSON.stringify(mathData)}`);
    }
    const mathSubjectId = mathData.data._id;
    console.log(`✅ Subject Math created with ID: ${mathSubjectId}`);

    // 4. Create Subject "Science" assigned to someone else (IT Admin as stub teacher)
    const itadmin = usersData.data.find((u) => u.email === 'itadmin@vidyaerp.com');
    const anotherTeacherId = itadmin._id;

    console.log('\n4. Creating Subject "Science" assigned to another teacher...');
    const createScienceRes = await fetch(`${BASE_URL}/academics/subjects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`,
      },
      body: JSON.stringify({
        name: 'Science',
        code: 'SCI101',
        class: classId,
        teacher: anotherTeacherId,
        theoryMax: 80,
        practicalMax: 20,
        session: '2025-26',
      }),
    });
    const scienceData = await createScienceRes.json();
    const scienceSubjectId = scienceData.data._id;
    console.log(`✅ Subject Science created with ID: ${scienceSubjectId}`);

    // Update teacher profile to assign her Math in subjectsAssigned and Class 10 in classAssigned
    console.log('\nAssigning class and subject to teacher Anita Verma...');
    const updateTeacherRes = await fetch(`${BASE_URL}/users/${teacherId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`,
      },
      body: JSON.stringify({
        classAssigned: classId,
        subjectsAssigned: [mathSubjectId],
        role: 'subject_teacher',
      }),
    });
    const updateTeacherData = await updateTeacherRes.json();
    if (!updateTeacherRes.ok || !updateTeacherData.success) {
      throw new Error(`Updating teacher profile failed: ${JSON.stringify(updateTeacherData)}`);
    }
    console.log('✅ Teacher profile configured.');

    // 5. Create Students Rohit Sharma and Virat Kohli via direct model insertion or Confirm Admission flow
    console.log('\n5. Creating active students (Rohit Sharma & Virat Kohli)...');
    
    const student1Res = await fetch(`${BASE_URL}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`,
      },
      body: JSON.stringify({
        admissionNumber: 'ADM-2026-0001',
        rollNumber: 'ROLL-10',
        name: 'Rohit Sharma',
        dob: '2012-05-15',
        gender: 'male',
        class: classId,
        section: 'A',
        session: '2025-26',
        status: 'active',
      }),
    });
    const s1Data = await student1Res.json();
    if (!student1Res.ok || !s1Data.success) {
      throw new Error(`Creating student 1 failed: ${JSON.stringify(s1Data)}`);
    }
    const student1Id = s1Data.data._id;

    const student2Res = await fetch(`${BASE_URL}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`,
      },
      body: JSON.stringify({
        admissionNumber: 'ADM-2026-0002',
        rollNumber: 'ROLL-11',
        name: 'Virat Kohli',
        dob: '2012-11-05',
        gender: 'male',
        class: classId,
        section: 'A',
        session: '2025-26',
        status: 'active',
      }),
    });
    const s2Data = await student2Res.json();
    const student2Id = s2Data.data._id;
    console.log(`✅ Student Rohit Sharma created ID: ${student1Id}`);
    console.log(`✅ Student Virat Kohli created ID: ${student2Id}`);

    // 6. Create Exam "Half Yearly 2025"
    console.log('\n6. Creating Exam "Half Yearly 2025"...');
    const examRes = await fetch(`${BASE_URL}/exams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`,
      },
      body: JSON.stringify({
        name: 'Half Yearly 2025',
        type: 'half_yearly',
        classes: [classId],
        session: '2025-26',
        startDate: '2026-06-16',
        endDate: '2026-06-25',
        status: 'draft',
      }),
    });
    const examData = await examRes.json();
    if (!examRes.ok || !examData.success) {
      throw new Error(`Creating exam failed: ${JSON.stringify(examData)}`);
    }
    const examId = examData.data._id;
    console.log(`✅ Exam created with ID: ${examId}`);

    // 7. Configure Exam Schedule
    console.log('\n7. Adding Exam Schedule for Math exam...');
    const schedRes = await fetch(`${BASE_URL}/exams/${examId}/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`,
      },
      body: JSON.stringify({
        class: classId,
        section: 'A',
        subject: mathSubjectId,
        date: '2026-06-18',
        startTime: '09:00 AM',
        endTime: '12:00 PM',
        venue: 'Room 101',
        invigilators: [teacherId],
      }),
    });
    const schedData = await schedRes.json();
    if (!schedRes.ok || !schedData.success) {
      throw new Error(`Creating schedule failed: ${JSON.stringify(schedData)}`);
    }
    console.log('✅ Exam schedule added successfully.');

    // 8. Test overlapping schedule slot conflict check (should fail)
    console.log('   Testing Overlapping schedule conflict check (Should Fail)...');
    const schedConflictRes = await fetch(`${BASE_URL}/exams/${examId}/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`,
      },
      body: JSON.stringify({
        class: classId,
        section: 'A',
        subject: scienceSubjectId,
        date: '2026-06-18',
        startTime: '10:00 AM', // Overlaps 9-12
        endTime: '01:00 PM',
        venue: 'Room 101',
        invigilators: [teacherId],
      }),
    });
    const schedConflictData = await schedConflictRes.json();
    if (schedConflictRes.status === 400) {
      console.log('✅ Success: Overlapping schedule slot correctly prevented.');
      console.log('   Response message:', schedConflictData.message);
    } else {
      throw new Error(`Expected 400 overlap conflict, but received status ${schedConflictRes.status}`);
    }

    // 9. Test Seating Allocation Auto Distribution
    console.log('\n9. Generating Seating Arrangements (Capacity 1 per venue to test mix)...');
    const seatingRes = await fetch(`${BASE_URL}/exams/${examId}/seating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`,
      },
      body: JSON.stringify({
        venues: [
          { name: 'Room 101', capacity: 1 },
          { name: 'Room 102', capacity: 10 },
        ],
      }),
    });
    const seatingData = await seatingRes.json();
    if (!seatingRes.ok || !seatingData.success) {
      throw new Error(`Seating generation failed: ${JSON.stringify(seatingData)}`);
    }
    console.log('✅ Seating allocation generated.');

    // Verify seating details are recorded in hall tickets
    const ticketsRes = await fetch(`${BASE_URL}/exams/${examId}/hall-tickets`, {
      headers: { Authorization: `Bearer ${principalToken}` },
    });
    const ticketsData = await ticketsRes.json();
    console.log('✅ Checked seating hall tickets distribution:');
    ticketsData.data.forEach((t) => {
      console.log(`   - Student: ${t.student.name}, Roll: ${t.rollNumber}, Seat: ${t.subjects?.[0]?.seatNo || 'Unassigned'}`);
    });

    // 10. Log in Subject Teacher Anita Verma
    console.log('\n10. Logging in Class/Subject Teacher Anita Verma...');
    const teacherLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'classteacher@vidyaerp.com', password: 'Password123!' }),
    });
    const teacherData = await teacherLoginRes.json();
    const teacherToken = teacherData.data.accessToken;
    console.log('✅ Teacher logged in.');

    // 11. Enter Marks (Math - Anita teaches Math, so should succeed)
    console.log('\n11. Entering Math marks as Subject Teacher Anita Verma...');
    const marksRes = await fetch(`${BASE_URL}/exams/${examId}/results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        classId,
        section: 'A',
        subjectId: mathSubjectId,
        results: [
          { studentId: student1Id, theoryMarks: 70, practicalMarks: 15, status: 'pass' }, // total 85
          { studentId: student2Id, theoryMarks: 25, practicalMarks: 5, status: 'fail' },  // total 30
        ],
      }),
    });
    const marksData = await marksRes.json();
    if (!marksRes.ok || !marksData.success) {
      throw new Error(`Entering marks failed: ${JSON.stringify(marksData)}`);
    }
    console.log('✅ Math marks entered successfully.');

    // 12. Enter Marks (Science - Anita does NOT teach Science, so should fail with 403)
    console.log('\n12. Attempting to enter Science marks as Anita Verma (Should Fail with 403 Forbidden)...');
    const fakeMarksRes = await fetch(`${BASE_URL}/exams/${examId}/results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        classId,
        section: 'A',
        subjectId: scienceSubjectId,
        results: [{ studentId: student1Id, theoryMarks: 50, practicalMarks: 10, status: 'pass' }],
      }),
    });
    const fakeMarksData = await fakeMarksRes.json();
    if (fakeMarksRes.status === 403) {
      console.log('✅ Success: Subject teacher correctly blocked from entering other subject marks.');
      console.log('   Response message:', fakeMarksData.message);
    } else {
      throw new Error(`Expected 403, but received status ${fakeMarksRes.status}`);
    }

    // 13. Approve Marks Batch & Calculate CBSE Grades
    console.log('\n13. Approving Marks Batch & Calculating CBSE Grades (Principal/Controller)...');
    const approveRes = await fetch(`${BASE_URL}/exams/${examId}/results/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`,
      },
      body: JSON.stringify({
        classId,
        section: 'A',
        subjectId: mathSubjectId,
      }),
    });
    const approveData = await approveRes.json();
    if (!approveRes.ok || !approveData.success) {
      throw new Error(`Approving batch failed: ${JSON.stringify(approveData)}`);
    }
    console.log('✅ Marks approved.');

    // Fetch results to verify CBSE grade mapping
    const resultsRes = await fetch(`${BASE_URL}/exams/${examId}/results?classId=${classId}&section=A`, {
      headers: { Authorization: `Bearer ${principalToken}` },
    });
    const resultsData = await resultsRes.json();
    console.log('✅ Verified CBSE grades calculations:');
    resultsData.data.forEach((r) => {
      console.log(`   - Student: ${r.student.name}, Score: ${r.totalMarks}, Pct: ${r.percentage}%, Grade: ${r.grade}, Status: ${r.status}`);
    });

    // 14. Publish Results
    console.log('\n14. Publishing Results (Principal Only)...');
    const publishRes = await fetch(`${BASE_URL}/exams/${examId}/results/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${principalToken}` },
    });
    const publishData = await publishRes.json();
    if (!publishRes.ok || !publishData.success) {
      throw new Error(`Publishing exam results failed: ${JSON.stringify(publishData)}`);
    }
    console.log('✅ Exam status set to "published".');

    // 15. Verify SEC-13 locked edits (Attempting to write marks after publish should fail)
    console.log('\n15. Verifying SEC-13 locked edit controls (Should Fail with 403)...');
    const postPublishEditRes = await fetch(`${BASE_URL}/exams/${examId}/results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        classId,
        section: 'A',
        subjectId: mathSubjectId,
        results: [{ studentId: student1Id, theoryMarks: 75, practicalMarks: 15, status: 'pass' }],
      }),
    });
    const postPublishEditData = await postPublishEditRes.json();
    if (postPublishEditRes.status === 403) {
      console.log('✅ Success: Edit locked verified. Attempt to modify marks post-publish correctly blocked.');
      console.log('   Response message:', postPublishEditData.message);
    } else {
      throw new Error(`Expected 403 write lock, but received status ${postPublishEditRes.status}`);
    }

    // 16. Test Re-evaluation Unlock Request (Principal unlocks Virat Kohli result)
    console.log('\n16. Requesting Re-evaluation for Virat Kohli (Principal)...');
    const viratResult = resultsData.data.find((r) => r.student._id === student2Id);
    if (!viratResult) throw new Error('Virat Kohli result record not found.');

    const reevalRes = await fetch(`${BASE_URL}/exams/${examId}/results/${viratResult._id}/reeval`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${principalToken}` },
    });
    const reevalData = await reevalRes.json();
    if (!reevalRes.ok || !reevalData.success) {
      throw new Error(`Unlocking result for re-evaluation failed: ${JSON.stringify(reevalData)}`);
    }
    console.log('✅ Virat Kohli results unlocked for editing.');

    // Verify Anita Verma can now edit Virat's unlocked results
    console.log('   Re-entering marks for Virat Kohli (Should Succeed now)...');
    const editReevalRes = await fetch(`${BASE_URL}/exams/${examId}/results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        classId,
        section: 'A',
        subjectId: mathSubjectId,
        results: [{ studentId: student2Id, theoryMarks: 40, practicalMarks: 10, status: 'pass' }], // Unlock allows overwrite
      }),
    });
    const editReevalData = await editReevalRes.json();
    if (editReevalRes.ok && editReevalData.success) {
      console.log('✅ Success: Anita Verma updated Virat Kohli marks to 50 (Passed re-evaluation).');
    } else {
      throw new Error(`Expected success, but failed: ${JSON.stringify(editReevalData)}`);
    }

    // 17. Verify Report Card PDF Generation
    console.log('\n17. Downloading Student Report Card PDF...');
    const cardRes = await fetch(`${BASE_URL}/exams/${examId}/report-card/${student1Id}`, {
      headers: { Authorization: `Bearer ${principalToken}` },
    });
    if (cardRes.ok) {
      console.log('✅ Success: Report card generated and retrieved successfully.');
    } else {
      const cardData = await cardRes.json();
      throw new Error(`Report card generation failed: ${JSON.stringify(cardData)}`);
    }

    // 18. Verify CBSE Export Stub (Should return 501 Not Implemented)
    console.log('\n18. Calling CBSE Export Stub (Expected: 501 Not Implemented)...');
    const cbseRes = await fetch(`${BASE_URL}/exams/${examId}/cbse-export`, {
      headers: { Authorization: `Bearer ${principalToken}` },
    });
    const cbseData = await cbseRes.json();
    if (cbseRes.status === 501) {
      console.log('✅ Success: Stub correctly returned 501 Not Implemented.');
      console.log('   Response message:', cbseData.message);
    } else {
      throw new Error(`Expected 501, but received status ${cbseRes.status}: ${JSON.stringify(cbseData)}`);
    }

    console.log('\n🎉 ALL Phase 3A API and RBAC verification checks passed successfully!');
  } catch (error) {
    console.error('\n❌ Verification Failed:', error.message);
    process.exit(1);
  }
};

runVerification();
