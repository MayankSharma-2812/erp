# VidyaERP — Next-Generation Boarding School Management System
### Product Demonstration & Sales Pitch Guide

Welcome to the official preview of **VidyaERP**, a premium, comprehensive ERP platform tailored specifically to modernize school administrations, streamline CBSE academic operations, and connect parents, students, and educators in a unified digital ecosystem.

---

## 🌟 Why Choose VidyaERP? (The Core Benefits)

VidyaERP is designed to eliminate administrative overhead, secure data distribution, and provide absolute transparency to school management, staff, parents, and students. Here is how VidyaERP transforms your institution:

### 1. Robust Role-Based Security (18 Access Tiers)
Every staff member sees only what is relevant to their job. From the Principal to the Cashier, Hostel Warden, and Medical Officer, user scopes are governed by an enterprise-grade security matrix.

### 2. Comprehensive Parent & Student Portals
Bridge the gap between home and school. Parents can instantly view their child’s academic records, check daily biometric attendance, download identity cards, track hostel details, and monitor clinic visits.

### 3. Frictionless Financial Management
Automate fee demand collections, track outstanding ledgers, and simulate instant online payments. Back-office cashiers benefit from automated receipt logging and manual safety caps, while HR managers can compile monthly payroll runs with automatic salary deductions.

### 4. Duration-Sensitive Gate Pass Approvals
Track boarders' security. Outing requests are automatically routed based on duration: short outings (under 24h) can be authorized by assistant wardens, while extended home leaves are securely forwarded to the Hostel Warden or Principal.

### 5. Fast Roster & Identity Card Generation
Generate landscape printed registers for manual rosters or class grading in one click. Compile and print beautifully styled student identity cards populated with emergency contacts, blood groups, and transport route stops.

---

## 🔑 Demo Login Portals

To help you experience VidyaERP, a complete demonstration database has been pre-seeded. 

* **Master Password (All Accounts)**: `Password123!`
* **Portal Link**: `http://localhost:5173`

### 1. Leadership & Academic Administration

| User | Role | Email Address | Core Use Case |
| :--- | :--- | :--- | :--- |
| **Dr. Rajesh Sharma** | Principal | `principal@vidyaerp.com` | Complete administrative overview, co-authorizes monthly payrolls, setup configurations. |
| **Mrs. Shalini Sen** | Vice Principal | `viceprincipal@vidyaerp.com` | Full school operations visibility, backs up Principal decisions. |
| **Mr. Anand Verma** | Academic Coordinator | `coordinator@vidyaerp.com` | Manages subjects database, lesson plans tracking, classes timetable schedules. |
| **Ms. Anita Verma** | Class Teacher | `classteacher@vidyaerp.com` | Tutor for Class 11-A. Logs daily student attendance, reviews syllabus metrics. |
| **Mr. Vikram Malhotra** | Subject Teacher | `teacher@vidyaerp.com` | Inputs exam grades, drafts lesson plans for assigned classes. |
| **Mr. Rajiv Dixit** | Exam Controller | `examcontroller@vidyaerp.com` | Schedules term exams, manages venues allocation, prints hall tickets. |

### 2. Operations & Administrative Staff

| User | Role | Email Address | Core Use Case |
| :--- | :--- | :--- | :--- |
| **Mr. Sanjay Mehta** | Accounts Officer | `accounts@vidyaerp.com` | Demands fee structures, approves cashier entries, initiates payroll. |
| **Mr. Ramesh Kumar** | Cashier | `cashier@vidyaerp.com` | Processes physical check/cash fee collections at the front counter. |
| **Mrs. Preeti Kapoor** | HR Manager | `hr@vidyaerp.com` | Manages staff records, approves leaves, compiles monthly salary ledgers. |
| **Mr. Harish Rawat** | Hostel Warden | `warden@vidyaerp.com` | Manages boys/girls blocks allocations, reviews visitor logs. |
| **Mr. Amit Shah** | Assistant Warden | `asstwarden@vidyaerp.com` | Logs morning/night rolls calls, handles gate pass short leaves. |
| **Dr. John Doe** | Medical Officer | `medicalofficer@vidyaerp.com` | Health profiles manager, sickbay bed check-ins, medical prescriptions. |
| **Ms. Meenakshi Iyer** | Admissions Officer | `admissions@vidyaerp.com` | Registers new student enquiries, confirms boarder documents. |
| **Mr. Gurpreet Singh** | Transport Manager | `transport@vidyaerp.com` | Routes planner, vehicle registration checks, driver licensing compliance. |
| **Mrs. Sudha Murthy** | Librarian | `librarian@vidyaerp.com` | Book checkouts, returns registration, computes late fines. |

### 3. Student & Pre-Linked Parent Portals

Each student is linked to a corresponding parent profile. Log in as a parent to see a view customized to your child's data.

| Student Name | Class | Student Portal Login | Parent Portal Login (Linked) |
| :--- | :--- | :--- | :--- |
| **Rohan Gupta** | Class 11-A | `rohan@vidyaerp.com` | `parent.100@vidyaerp.com` |
| **Priya Sharma** | Class 12-A | `priya@vidyaerp.com` | `parent.101@vidyaerp.com` |
| **Kabir Malhotra** | Class 10-A | `kabir@vidyaerp.com` | `parent.102@vidyaerp.com` |
| **Anjali Desai** | Class 10-B | `anjali@vidyaerp.com` | `parent.103@vidyaerp.com` |
| **Aarav Mehta** | Class 11-A | `aarav@vidyaerp.com` | `parent.104@vidyaerp.com` |

---

## 🎬 Guided Walkthroughs (Experience the System)

Try these simple user flows to experience the real-time capabilities of VidyaERP:

### Flow 1: Real-time Parent Portal & Online Payments
1. Log in as a **Parent** (`parent.100@vidyaerp.com`).
2. Notice the welcoming green header displaying *"Hello, Parent of Rohan Gupta!"*
3. Navigate to **Fees & Payments** tab. View the pending CBSE Exam fees.
4. Click **Pay Online** (simulates payment checkout). The ledger updates to a zero balance immediately.
5. Log in as the **Accounts Officer** (`accounts@vidyaerp.com`) and verify that Rohan's payment is logged in the fee collections report.

### Flow 2: Digital Staff Portal & Leaves Application
1. Log in as **Ms. Anita Verma** (`classteacher@vidyaerp.com`).
2. Open the **Staff Portal** on the sidebar.
3. Review your Casual and Medical leave quotas shown on visual progress cards.
4. Submit a leave request using the **Apply for Leave** panel.
5. Log in as the **HR Manager** (`hr@vidyaerp.com`), open the leave approvals dashboard, and approve the request.
6. Return to the teacher's **Staff Portal** to view the updated leave balances.

### Flow 3: Hostel Outings & Gate Pass Security
1. Log in as a **Resident Student** (`rohan@vidyaerp.com`).
2. Go to **Hostel & Outings** and fill out the Outing Gate Pass request form.
3. Depending on the duration of the outing, it is routed dynamically:
   - Short Outings (under 24 hours) can be approved by the **Assistant Warden** (`asstwarden@vidyaerp.com`).
   - Extended Outings (over 48 hours) require **Principal** approval (`principal@vidyaerp.com`).
4. Log in as the appropriate staff role to approve the request and view the generated Gate Pass code.

### Flow 4: Administrative Reports & Printing Registers
1. Log in as the **Principal** (`principal@vidyaerp.com`).
2. Point out the **Today's Birthdays 🎂** widget on the dashboard, which dynamically alerts the management of staff and student celebrations today.
3. Navigate to **Reports** on the sidebar.
4. Go to **Blank Register Sheets**, select *Class 11 - Section A*, and click **Generate & Download PDF**.
5. The system downloads a printable landscape grid sheet containing student names and empty grading/attendance columns.

---

*Designed and Created by **RankSchool Digital**.*
