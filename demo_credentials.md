# VidyaERP — Demo Credentials & RBAC Access Matrix

This document lists the pre-seeded credentials for all user types, roles, and portals to assist you with your sales pitch and school demonstrations.

---

## 🔑 Login Credentials

The password for **ALL accounts** listed below is: `Password123!`

### 1. Administration & Academic Roles

| Name | Role | Email Address | Capabilities |
| :--- | :--- | :--- | :--- |
| **Dr. Rajesh Sharma** | Principal | `principal@vidyaerp.com` | Full access to all modules, co-authorizes payroll runs, edits configurations. |
| **Mrs. Shalini Sen** | Vice Principal | `viceprincipal@vidyaerp.com` | Full administrative visibility, matches Principal permissions except key setup. |
| **Mr. Anand Verma** | Academic Coordinator | `coordinator@vidyaerp.com` | Manages subjects, syllabus progress, timetables, and overall academics. |
| **Ms. Anita Verma** | Class Teacher | `classteacher@vidyaerp.com` | Manages Class 11-A, logs student attendance, edits academic syllabus. |
| **Mr. Vikram Malhotra** | Subject Teacher | `teacher@vidyaerp.com` | Logs examination marks, maintains lesson plans. |
| **Mr. Rajiv Dixit** | Exam Controller | `examcontroller@vidyaerp.com` | schedules examinations, publishes hall tickets, inputs marks reports. |
| **Mr. Suresh Patel** | IT Admin | `itadmin@vidyaerp.com` | System environments status, backups, configuration modifications. |

### 2. Operations & Back-Office Roles

| Name | Role | Email Address | Capabilities |
| :--- | :--- | :--- | :--- |
| **Mr. Sanjay Mehta** | Accounts Officer | `accounts@vidyaerp.com` | Manages school balance sheets, budgets, fee ledger demands, payrolls. |
| **Mr. Ramesh Kumar** | Cashier | `cashier@vidyaerp.com` | Receives cash/offline payments at the billing desk. |
| **Mrs. Preeti Kapoor** | HR Manager | `hr@vidyaerp.com` | Roster records, marks staff attendance, compiles monthly salary payouts. |
| **Mr. Harish Rawat** | Hostel Warden | `warden@vidyaerp.com` | Manages hostel rooms, allocations, outing requests history, visitor logs. |
| **Mr. Amit Shah** | Asst Warden | `asstwarden@vidyaerp.com` | Performs daily morning/night rolls calls, handles gate pass approvals. |
| **Dr. John Doe** | Medical Officer | `medicalofficer@vidyaerp.com` | Maintains sickbay log register, clinic visit forms, medication details. |
| **Ms. Meenakshi Iyer** | Admissions Officer | `admissions@vidyaerp.com` | Registers new student applications, tracks admission pipeline status. |
| **Mr. Gurpreet Singh** | Transport Manager | `transport@vidyaerp.com` | Organizes routes, vehicle compliance parameters, driver assignments. |
| **Mrs. Sudha Murthy** | Librarian | `librarian@vidyaerp.com` | Catalogs physical books, log issues/returns, levies overdue library fines. |

### 3. Student Portal Roles

These accounts represent the student dashboard experience (with full academic profiles, fee ledgers, timetables, outings, and health history):

| Student Name | Class & Sec | Email Address | Boarding Status | Transport Stop |
| :--- | :--- | :--- | :--- | :--- |
| **Rohan Gupta** | Class 11-A | `rohan@vidyaerp.com` | Resident (Aravali Room 101) | N/A |
| **Priya Sharma** | Class 12-A | `priya@vidyaerp.com` | Resident (Shivalik Room 201) | N/A |
| **Kabir Malhotra** | Class 10-A | `kabir@vidyaerp.com` | Day Scholar | Preet Vihar (Route 1) |
| **Anjali Desai** | Class 10-B | `anjali@vidyaerp.com` | Day Scholar | Noida Sec 62 (Route 2) |
| **Aarav Mehta** | Class 11-A | `aarav@vidyaerp.com` | Resident (Aravali Room 102) | N/A |
| **Sneha Reddy** | Class 12-B | `sneha@vidyaerp.com` | Resident (Shivalik Room 202) | N/A |
| **Ishaan Verma** | Class 10-A | `ishaan@vidyaerp.com` | Day Scholar | Self Arranged |
| **Divya Nair** | Class 11-A | `divya@vidyaerp.com` | Day Scholar | Self Arranged |
| **Aditya Sen** | Class 12-A | `aditya@vidyaerp.com` | Resident (Aravali Room 103) | N/A |
| **Meera Krishnan** | Class 10-B | `meera@vidyaerp.com` | Day Scholar | Self Arranged |

---

## 🔒 Role-Based Access Control (RBAC) Matrix

VidyaERP features a production-grade RBAC matrix. The table below represents which role can access what modules/endpoints:

| Module | Principal / VP | Accounts / Cashier | HR Manager | Hostel Warden / Asst | Medical Officer | Librarian | Transport Manager | Admissions Officer | Student |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Overview Dashboard** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Students Registry** | ✅ | Read-Only | Read-Only | Read-Only | Read-Only | Read-Only | Read-Only | Read-Write | Read-Only |
| **Admissions pipeline**| ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Academics & Syllabus**| ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Read-Only |
| **Schedules & Timetable**| ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Read-Only |
| **Marks Entry / Exams**| ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Read-Only |
| **Fee Ledgers & Finance**| ✅ | ✅ | Read-Only | Read-Only | ❌ | Read-Only | Read-Only | Read-Only | Read-Only |
| **Hostel & Outings** | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | Read-Write |
| **HR & Payroll runs** | ✅ | Read-Only | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Library cataloging** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | Read-Only |
| **Transport / Routes** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | Read-Only |
| **Health clinic logs** | ✅ | ❌ | ❌ | Read-Only | ✅ | ❌ | ❌ | ❌ | Read-Only |
| **Reports & CSV Export**| ✅ | Read-Only | Read-Only | Read-Only | Read-Only | Read-Only | Read-Only | Read-Only | Read-Only |
| **System Settings** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🛠️ Workflows & How to Demo

Here are some high-impact flows you can demonstrate during your presentation:

### Flow 1: Online Fee Payment & Automated Ledger Linkage
1. Log in as a **Student** (e.g., `rohan@vidyaerp.com`).
2. Navigate to **Fees & Payments** tab.
3. Check one or more outstanding fee heads (e.g. CBSE Exam registrations).
4. Click **Pay Online**. The integrated Razorpay checkout form will trigger.
5. complete using test cards. The student ledger immediately updates, showing a zero outstanding balance for that head!
6. Log in as the **Accounts Officer** or **Principal** to see the fee collection analytics update in real time.

### Flow 2: Hostel Gate Pass Duration-Based Approvals
1. Log in as a **Student** (e.g., `rohan@vidyaerp.com`).
2. Go to **Hostel & Outings**, fill out the Outing Gate Pass request form:
   - For duration **< 24 Hours**: Can be approved by the **Assistant Warden** (`asstwarden@vidyaerp.com`).
   - For duration **24–48 Hours**: Can be approved by the **Hostel Warden** (`warden@vidyaerp.com`).
   - For duration **> 48 Hours**: Must be approved by the **Principal** (`principal@vidyaerp.com`).
3. Log in as the corresponding staff role to approve the pass.

### Flow 3: HR Staff Attendance, LOP Leaves, and Payroll compilation
1. Log in as the **HR Manager** (`hr@vidyaerp.com`).
2. View the **Roster** of teachers and back-office staff.
3. Mark daily attendance. Apply for a Leave Request (with type `LOP` for Loss of Pay) on behalf of staff.
4. Navigate to **Payroll Runs** tab, compile salaries for the current month. The system automatically computes deductions (absent days = 1.0 day LOP, half day = 0.5 day LOP).
5. Log in as the **Principal** (`principal@vidyaerp.com`) to co-authorize the run.
6. Once authorized, click **Generate Payslip**. A beautiful PDF payslip is instantly rendered and downloadable.
