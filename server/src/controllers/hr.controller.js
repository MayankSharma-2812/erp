const User = require('../models/User');
const StaffAttendance = require('../models/StaffAttendance');
const Leave = require('../models/Leave');
const PayrollRun = require('../models/PayrollRun');
const Payslip = require('../models/Payslip');
const { generatePdfFromHtml } = require('../services/pdf.service');
const path = require('path');
const fs = require('fs');

// --- STAFF ATTENDANCE ---
const markStaffAttendance = async (req, res, next) => {
  try {
    const { staffId, date, status, inTime, outTime } = req.body;
    if (!staffId || !date || !status) {
      return res.status(400).json({ success: false, message: 'Missing staffId, date, or status' });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    const attendance = await StaffAttendance.findOneAndUpdate(
      { staff: staffId, date: attendanceDate },
      { status, inTime, outTime, markedBy: req.user.id },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: attendance,
      message: 'Staff attendance marked successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getStaffAttendance = async (req, res, next) => {
  try {
    const { staffId, date, month } = req.query;
    const query = {};
    if (staffId) query.staff = staffId;
    
    if (date) {
      const attendanceDate = new Date(date);
      attendanceDate.setUTCHours(0, 0, 0, 0);
      query.date = attendanceDate;
    } else if (month) {
      // month is YYYY-MM
      const start = new Date(`${month}-01T00:00:00.000Z`);
      const end = new Date(start);
      end.setUTCMonth(end.getUTCMonth() + 1);
      query.date = { $gte: start, $lt: end };
    }

    const attendance = await StaffAttendance.find(query)
      .populate('staff', 'name email role')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

// --- LEAVE MANAGEMENT ---
const applyLeave = async (req, res, next) => {
  try {
    const { type, fromDate, toDate, days, reason } = req.body;
    if (!type || !fromDate || !toDate || !days) {
      return res.status(400).json({ success: false, message: 'Missing required leave fields' });
    }

    const leave = await Leave.create({
      staff: req.user.id,
      type,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      days,
      reason,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      data: leave,
      message: 'Leave request applied successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getLeaves = async (req, res, next) => {
  try {
    const { staffId, status } = req.query;
    const query = {};
    if (staffId) query.staff = staffId;
    if (status) query.status = status;

    const leaves = await Leave.find(query)
      .populate('staff', 'name email role')
      .populate('approvedBy', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: leaves,
    });
  } catch (error) {
    next(error);
  }
};

const approveLeave = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Leave request is already processed' });
    }

    leave.status = status;
    leave.approvedBy = req.user.id;
    await leave.save();

    res.status(200).json({
      success: true,
      data: leave,
      message: `Leave request ${status} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// --- PAYROLL runs ---
const initiatePayrollRun = async (req, res, next) => {
  try {
    const { month } = req.body; // YYYY-MM
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing month (YYYY-MM)' });
    }

    // Check if payroll run already exists
    let run = await PayrollRun.findOne({ month });
    if (run && ['approved', 'disbursed'].includes(run.status)) {
      return res.status(400).json({
        success: false,
        message: `Payroll for ${month} is already ${run.status} and cannot be re-initiated.`,
      });
    }

    // If it exists in draft/submitted, we will clear its payslips and re-initiate
    if (run) {
      await Payslip.deleteMany({ run: run._id });
    } else {
      run = new PayrollRun({ month });
    }

    run.status = 'draft';
    run.initiatedBy = req.user.id;
    await run.save();

    // Get all active users
    const staffMembers = await User.find({ isActive: true });

    const startOfMonth = new Date(`${month}-01T00:00:00.000Z`);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setUTCMonth(endOfMonth.getUTCMonth() + 1);

    let runTotalAmount = 0;
    const payslips = [];

    for (const staff of staffMembers) {
      // 1. Calculate LOP Days from StaffAttendance
      // status: absent = 1 LOP day, half_day = 0.5 LOP day
      const attendances = await StaffAttendance.find({
        staff: staff._id,
        date: { $gte: startOfMonth, $lt: endOfMonth },
      });

      let absentDays = 0;
      attendances.forEach(a => {
        if (a.status === 'absent') absentDays += 1;
        else if (a.status === 'half_day') absentDays += 0.5;
      });

      // 2. Calculate LOP Days from approved LOP leaves
      const leaves = await Leave.find({
        staff: staff._id,
        type: 'LOP',
        status: 'approved',
        fromDate: { $lt: endOfMonth },
        toDate: { $gte: startOfMonth },
      });

      let lopLeaveDays = 0;
      leaves.forEach(l => {
        // Find overlap of leave with the current month
        const leaveStart = new Date(Math.max(l.fromDate.getTime(), startOfMonth.getTime()));
        const leaveEnd = new Date(Math.min(l.toDate.getTime(), endOfMonth.getTime() - 1));
        const diffMs = leaveEnd - leaveStart;
        if (diffMs >= 0) {
          // Add 1 because both ends are inclusive in leave request duration calculations
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;
          // Scale it to not exceed total request days
          lopLeaveDays += Math.min(diffDays, l.days);
        }
      });

      const totalLopDays = absentDays + lopLeaveDays;

      // Salary parameters (Sensible defaults based on roles)
      let basicSalary = 30000;
      let da = 5000;
      let hra = 6000;
      let otherAllowances = 4000;

      if (staff.role === 'principal') {
        basicSalary = 80000;
        da = 12000;
        hra = 15000;
        otherAllowances = 5000;
      } else if (staff.role === 'vice_principal') {
        basicSalary = 60000;
        da = 9000;
        hra = 12000;
        otherAllowances = 4000;
      }

      const grossSalary = basicSalary + da + hra + otherAllowances;

      // Deductions
      const pfDeduction = Math.round(basicSalary * 0.12); // 12% PF
      const esiDeduction = Math.round(grossSalary * 0.0075); // 0.75% ESI
      const tdsDeduction = grossSalary > 50000 ? Math.round(grossSalary * 0.05) : 0; // 5% TDS for high salary

      const lopAmount = Math.round((basicSalary / 30) * totalLopDays);
      const totalDeductions = pfDeduction + esiDeduction + tdsDeduction + lopAmount;

      const netSalary = Math.max(0, grossSalary - totalDeductions);

      const payslip = await Payslip.create({
        run: run._id,
        staff: staff._id,
        month,
        basicSalary,
        da,
        hra,
        otherAllowances,
        grossSalary,
        pfDeduction,
        esiDeduction,
        tdsDeduction,
        lopDays: totalLopDays,
        lopAmount,
        netSalary,
      });

      payslips.push(payslip);
      runTotalAmount += netSalary;
    }

    run.totalAmount = runTotalAmount;
    await run.save();

    res.status(200).json({
      success: true,
      data: {
        run,
        payslips,
      },
      message: 'Payroll run initiated successfully as draft',
    });
  } catch (error) {
    next(error);
  }
};

const getPayrollRuns = async (req, res, next) => {
  try {
    const runs = await PayrollRun.find({}).sort({ month: -1 });
    res.status(200).json({
      success: true,
      data: runs,
    });
  } catch (error) {
    next(error);
  }
};

const getPayrollRunById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const run = await PayrollRun.findById(id);
    if (!run) {
      return res.status(404).json({ success: false, message: 'Payroll run not found' });
    }

    const payslips = await Payslip.find({ run: id }).populate('staff', 'name email role deptAssigned');

    res.status(200).json({
      success: true,
      data: {
        run,
        payslips,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateDraftPayslip = async (req, res, next) => {
  try {
    const { runId, payslipId } = req.params;
    const { basicSalary, da, hra, otherAllowances, pfDeduction, esiDeduction, tdsDeduction } = req.body;

    const run = await PayrollRun.findById(runId);
    if (!run) {
      return res.status(404).json({ success: false, message: 'Payroll run not found' });
    }

    if (run.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Payroll run is not in draft status' });
    }

    const payslip = await Payslip.findById(payslipId);
    if (!payslip || payslip.run.toString() !== runId) {
      return res.status(404).json({ success: false, message: 'Payslip not found in this run' });
    }

    if (basicSalary !== undefined) payslip.basicSalary = basicSalary;
    if (da !== undefined) payslip.da = da;
    if (hra !== undefined) payslip.hra = hra;
    if (otherAllowances !== undefined) payslip.otherAllowances = otherAllowances;
    if (pfDeduction !== undefined) payslip.pfDeduction = pfDeduction;
    if (esiDeduction !== undefined) payslip.esiDeduction = esiDeduction;
    if (tdsDeduction !== undefined) payslip.tdsDeduction = tdsDeduction;

    // Recalculate gross and net
    payslip.grossSalary = payslip.basicSalary + payslip.da + payslip.hra + payslip.otherAllowances;
    
    // Recalculate LOP amount based on updated basicSalary
    payslip.lopAmount = Math.round((payslip.basicSalary / 30) * payslip.lopDays);

    const totalDeductions = payslip.pfDeduction + payslip.esiDeduction + payslip.tdsDeduction + payslip.lopAmount;
    payslip.netSalary = Math.max(0, payslip.grossSalary - totalDeductions);

    await payslip.save();

    // Recalculate run total
    const allPayslips = await Payslip.find({ run: runId });
    run.totalAmount = allPayslips.reduce((sum, p) => sum + p.netSalary, 0);
    await run.save();

    res.status(200).json({
      success: true,
      data: payslip,
      message: 'Draft payslip details updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

const submitPayrollRun = async (req, res, next) => {
  try {
    const { id } = req.params;
    const run = await PayrollRun.findById(id);
    if (!run) {
      return res.status(404).json({ success: false, message: 'Payroll run not found' });
    }

    if (run.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Only draft payroll runs can be submitted' });
    }

    run.status = 'submitted';
    await run.save();

    res.status(200).json({
      success: true,
      data: run,
      message: 'Payroll run submitted to Principal for authorization',
    });
  } catch (error) {
    next(error);
  }
};

const approvePayrollRun = async (req, res, next) => {
  try {
    const { id } = req.params;
    const run = await PayrollRun.findById(id);
    if (!run) {
      return res.status(404).json({ success: false, message: 'Payroll run not found' });
    }

    if (run.status !== 'submitted') {
      return res.status(400).json({ success: false, message: 'Only submitted payroll runs can be approved' });
    }

    run.status = 'approved';
    run.approvedBy = req.user.id;
    run.approvedAt = new Date();
    await run.save();

    res.status(200).json({
      success: true,
      data: run,
      message: 'Payroll run authorized/approved by Principal',
    });
  } catch (error) {
    next(error);
  }
};

const disbursePayrollRun = async (req, res, next) => {
  try {
    const { id } = req.params;
    const run = await PayrollRun.findById(id);
    if (!run) {
      return res.status(404).json({ success: false, message: 'Payroll run not found' });
    }

    if (run.status !== 'approved' && run.status !== 'submitted') {
      return res.status(400).json({ success: false, message: 'Payroll run must be authorized/approved/submitted before disbursement' });
    }

    run.status = 'disbursed';
    if (!run.approvedBy) {
      run.approvedBy = req.user.id;
      run.approvedAt = new Date();
    }
    await run.save();

    // Fetch all payslips and generate PDFs
    const payslips = await Payslip.find({ run: id }).populate('staff');
    
    // Ensure uploads/payslips directory exists
    const payslipDir = path.join(__dirname, '../../uploads/payslips');
    if (!fs.existsSync(payslipDir)) {
      fs.mkdirSync(payslipDir, { recursive: true });
    }

    for (const payslip of payslips) {
      const fileName = `payslip_${payslip._id}.pdf`;
      const filePath = path.join(payslipDir, fileName);

      // Generate HTML content for payslip
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; margin: 40px; }
            .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
            .school-title { font-size: 24px; font-weight: bold; color: #1e3a8a; margin: 0; }
            .payslip-title { font-size: 18px; color: #555; margin-top: 10px; text-transform: uppercase; letter-spacing: 1px; }
            .meta-section { display: flex; justify-content: space-between; margin-top: 30px; margin-bottom: 30px; font-size: 14px; }
            .meta-col { width: 48%; }
            .meta-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #eee; }
            .meta-label { font-weight: 600; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            th { background-color: #3b82f6; color: white; font-weight: bold; text-align: left; padding: 10px; }
            td { padding: 10px; border: 1px solid #ddd; }
            .section-title { font-size: 16px; font-weight: bold; color: #1e3a8a; border-bottom: 1px solid #3b82f6; padding-bottom: 5px; margin-top: 30px; }
            .totals { font-weight: bold; background-color: #f3f4f6; }
            .net-pay { font-size: 18px; font-weight: bold; color: #1e3a8a; background-color: #eff6ff; border: 2px solid #bfdbfe; text-align: center; padding: 15px; margin-top: 30px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="school-title">VidyaERP Academy</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">CBSE Boarding School Management System</p>
            <div class="payslip-title">Salary Payslip — ${payslip.month}</div>
          </div>

          <div class="meta-section">
            <div class="meta-col">
              <div class="meta-row">
                <span class="meta-label">Employee Name:</span>
                <span>${payslip.staff.name}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Email:</span>
                <span>${payslip.staff.email}</span>
              </div>
            </div>
            <div class="meta-col">
              <div class="meta-row">
                <span class="meta-label">Designation/Role:</span>
                <span>${payslip.staff.role.replace('_', ' ').toUpperCase()}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Payslip ID:</span>
                <span>${payslip._id}</span>
              </div>
            </div>
          </div>

          <div class="section-title">Salary & Allowances (Earnings)</div>
          <table>
            <thead>
              <tr>
                <th>Earnings Head</th>
                <th style="text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Basic Salary</td>
                <td style="text-align: right;">${payslip.basicSalary.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>Dearness Allowance (DA)</td>
                <td style="text-align: right;">${payslip.da.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>House Rent Allowance (HRA)</td>
                <td style="text-align: right;">${payslip.hra.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>Other Allowances</td>
                <td style="text-align: right;">${payslip.otherAllowances.toLocaleString('en-IN')}</td>
              </tr>
              <tr class="totals">
                <td>Gross Salary</td>
                <td style="text-align: right;">${payslip.grossSalary.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          <div class="section-title">Deductions</div>
          <table>
            <thead>
              <tr>
                <th>Deduction Head</th>
                <th style="text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Provident Fund (PF)</td>
                <td style="text-align: right;">${payslip.pfDeduction.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>Employee State Insurance (ESI)</td>
                <td style="text-align: right;">${payslip.esiDeduction.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>Tax Deducted at Source (TDS)</td>
                <td style="text-align: right;">${payslip.tdsDeduction.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>Loss of Pay (LOP) Days: ${payslip.lopDays}</td>
                <td style="text-align: right;">${payslip.lopAmount.toLocaleString('en-IN')}</td>
              </tr>
              <tr class="totals">
                <td>Total Deductions</td>
                <td style="text-align: right;">${(payslip.pfDeduction + payslip.esiDeduction + payslip.tdsDeduction + payslip.lopAmount).toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          <div class="net-pay">
            NET TAKE HOME PAY: ₹${payslip.netSalary.toLocaleString('en-IN')}
          </div>

          <div class="footer">
            <p>This is a computer-generated payslip and does not require a physical signature.</p>
            <p>&copy; ${new Date().getFullYear()} VidyaERP. All rights reserved.</p>
          </div>
        </body>
        </html>
      `;

      await generatePdfFromHtml(htmlContent, filePath);
      
      payslip.fileUrl = `/uploads/payslips/${fileName}`;
      await payslip.save();
    }

    res.status(200).json({
      success: true,
      message: 'Salary disbursed successfully. Payslips generated.',
    });
  } catch (error) {
    next(error);
  }
};

const getPayslips = async (req, res, next) => {
  try {
    const { staffId, month, runId } = req.query;
    const query = {};
    if (staffId) query.staff = staffId;
    if (month) query.month = month;
    if (runId) query.run = runId;

    const payslips = await Payslip.find(query)
      .populate('staff', 'name email role deptAssigned')
      .populate('run')
      .sort({ month: -1 });

    res.status(200).json({
      success: true,
      data: payslips,
    });
  } catch (error) {
    next(error);
  }
};

const getPayslipById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payslip = await Payslip.findById(id).populate('staff', 'name email role deptAssigned').populate('run');
    if (!payslip) {
      return res.status(404).json({ success: false, message: 'Payslip not found' });
    }
    res.status(200).json({
      success: true,
      data: payslip,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  markStaffAttendance,
  getStaffAttendance,
  applyLeave,
  getLeaves,
  approveLeave,
  initiatePayrollRun,
  getPayrollRuns,
  getPayrollRunById,
  updateDraftPayslip,
  submitPayrollRun,
  approvePayrollRun,
  disbursePayrollRun,
  getPayslips,
  getPayslipById,
};
