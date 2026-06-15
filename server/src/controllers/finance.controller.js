const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const Razorpay = require('razorpay');

const FeeStructure = require('../models/FeeStructure');
const FeeLedger = require('../models/FeeLedger');
const FeeTransaction = require('../models/FeeTransaction');
const RazorpayOrder = require('../models/RazorpayOrder');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const FeeWaiver = require('../models/FeeWaiver');
const Student = require('../models/Student');
const User = require('../models/User');

const config = require('../config/env');
const { generatePdfFromHtml } = require('../services/pdf.service');

// Helper to check if cashier is performing an disallowed write
const blockCashier = (req, res) => {
  if (req.user && req.user.role === 'cashier') {
    res.status(403).json({
      success: false,
      message: 'Forbidden: Cashier does not have permissions for this operation.',
    });
    return true;
  }
  return false;
};

// Helper to generate a unique receipt number
const generateReceiptNumber = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `RCPT-${year}-${rand}`;
};

// Helper to create client-printable HTML receipt
const generateReceiptHtml = (transaction, student, ledger) => {
  const dateStr = new Date(transaction.createdAt || new Date()).toLocaleDateString();
  const headsList = transaction.heads.map(h => `<li>${h}</li>`).join('');
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Fee Payment Receipt</title>
      <style>
        body { font-family: 'Inter', sans-serif; padding: 30px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #ddd; padding-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; color: #1e3a8a; }
        .details { margin: 20px 0; display: flex; justify-content: space-between; }
        .details table { width: 100%; border-collapse: collapse; }
        .details td { padding: 8px; vertical-align: top; }
        .details td.label { font-weight: bold; width: 150px; }
        .heads { margin: 25px 0; }
        .heads h3 { margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        .total { font-size: 18px; font-weight: bold; text-align: right; padding-top: 20px; border-top: 2px solid #eee; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #777; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>VidyaERP Boarding School</h1>
        <p>Fee Payment Receipt</p>
      </div>
      <div class="details">
        <table>
          <tr>
            <td class="label">Receipt Number:</td>
            <td>${transaction.receiptNumber}</td>
            <td class="label">Date:</td>
            <td>${dateStr}</td>
          </tr>
          <tr>
            <td class="label">Student Name:</td>
            <td>${student.name}</td>
            <td class="label">Admission No:</td>
            <td>${student.admissionNumber}</td>
          </tr>
          <tr>
            <td class="label">Class/Section:</td>
            <td>${student.class ? (student.class.name || student.class) : 'N/A'} - ${student.section || 'A'}</td>
            <td class="label">Session:</td>
            <td>${ledger.session}</td>
          </tr>
          <tr>
            <td class="label">Payment Method:</td>
            <td>${transaction.method.toUpperCase()}</td>
            <td class="label">Status:</td>
            <td><strong>${transaction.status.toUpperCase()}</strong></td>
          </tr>
        </table>
      </div>
      <div class="heads">
        <h3>Items Paid</h3>
        <ul>
          ${headsList}
        </ul>
      </div>
      <div class="total">
        Amount Paid: INR ${transaction.amount.toFixed(2)}
      </div>
      <div class="footer">
        <p>This is a computer-generated receipt and does not require a signature.</p>
      </div>
    </body>
    </html>
  `;
};

// Generate and save receipt file
const saveReceiptFile = async (transaction, student, ledger) => {
  const htmlContent = generateReceiptHtml(transaction, student, ledger);
  const outputPath = path.join(__dirname, '../../uploads/receipts', `${transaction.receiptNumber}.pdf`);
  await generatePdfFromHtml(htmlContent, outputPath);
  // Return relative access URL
  return `/uploads/receipts/${transaction.receiptNumber}.pdf`;
};

// --- FEE STRUCTURE CRUD ---
const createFeeStructure = async (req, res, next) => {
  try {
    if (blockCashier(req, res)) return;
    const structure = await FeeStructure.create(req.body);
    res.status(201).json({
      success: true,
      data: structure,
      message: 'Fee structure created successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getFeeStructures = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.session) query.session = req.query.session;
    if (req.query.classId) query.class = req.query.classId;

    const structures = await FeeStructure.find(query).populate('class');
    res.status(200).json({
      success: true,
      data: structures,
    });
  } catch (error) {
    next(error);
  }
};

const updateFeeStructure = async (req, res, next) => {
  try {
    if (blockCashier(req, res)) return;
    const structure = await FeeStructure.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!structure) {
      return res.status(404).json({ success: false, message: 'Fee structure not found' });
    }
    res.status(200).json({
      success: true,
      data: structure,
      message: 'Fee structure updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

const deleteFeeStructure = async (req, res, next) => {
  try {
    if (blockCashier(req, res)) return;
    const structure = await FeeStructure.findByIdAndDelete(req.params.id);
    if (!structure) {
      return res.status(404).json({ success: false, message: 'Fee structure not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Fee structure deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// --- STUDENT FEE LEDGER ---
const getStudentLedger = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    
    if (req.user && req.user.role === 'student' && studentId !== req.user.studentProfile?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Students can only access their own fee ledger',
      });
    }

    const { session } = req.query;
    const query = { student: studentId };
    if (session) query.session = session;

    const ledger = await FeeLedger.findOne(query).populate({
      path: 'student',
      populate: { path: 'class' }
    });

    if (!ledger) {
      return res.status(404).json({
        success: false,
        message: 'Fee ledger not found for this student',
      });
    }

    res.status(200).json({
      success: true,
      data: ledger,
    });
  } catch (error) {
    next(error);
  }
};

// --- RAZORPAY ONLINE PAYMENTS ---
const createRazorpayOrder = async (req, res, next) => {
  try {
    const { studentId, amount, heads, session } = req.body;
    if (!studentId || !amount || !heads || !heads.length) {
      return res.status(400).json({
        success: false,
        message: 'Missing studentId, amount, or heads to pay',
      });
    }

    if (req.user && req.user.role === 'student' && studentId !== req.user.studentProfile?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Students can only create payment orders for their own ledger',
      });
    }

    const instance = new Razorpay({
      key_id: config.RAZORPAY_KEY_ID,
      key_secret: config.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(amount * 100), // in paise
      currency: 'INR',
      receipt: `order_rcpt_${Date.now()}`,
    };

    const order = await instance.orders.create(options);

    // Create RazorpayOrder log
    await RazorpayOrder.create({
      orderId: order.id,
      student: studentId,
      amount,
      currency: 'INR',
      status: 'created',
      heads,
      session: session || '2025-26',
    });

    res.status(201).json({
      success: true,
      data: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: config.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    next(error);
  }
};

const razorpayWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return res.status(400).json({ success: false, message: 'Missing Razorpay signature' });
    }

    // Verify HMAC SHA256 signature
    const shasum = crypto.createHmac('sha256', config.RAZORPAY_WEBHOOK_SECRET);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest !== signature) {
      return res.status(400).json({ success: false, message: 'Invalid signature verification' });
    }

    const event = req.body.event;
    if (event === 'payment.captured') {
      const payload = req.body.payload.payment.entity;
      const orderId = payload.order_id;
      const paymentId = payload.id;

      const rzpOrder = await RazorpayOrder.findOne({ orderId });
      if (rzpOrder && rzpOrder.status !== 'paid') {
        rzpOrder.status = 'paid';
        rzpOrder.paymentId = paymentId;
        rzpOrder.signature = signature;
        await rzpOrder.save();

        // Find the ledger
        const ledger = await FeeLedger.findOne({
          student: rzpOrder.student,
          session: rzpOrder.session || '2025-26',
        });

        if (ledger) {
          const student = await Student.findById(rzpOrder.student).populate('class');
          
          // Apply amount to selected heads
          let remainingAmount = rzpOrder.amount;
          const paidHeads = [];

          for (const headName of rzpOrder.heads) {
            const entry = ledger.entries.find(e => e.head === headName);
            if (entry && entry.status !== 'paid' && entry.status !== 'waived') {
              const pendingForHead = entry.amount - entry.paidAmount - entry.waivedAmount;
              if (pendingForHead > 0) {
                const payForThisHead = Math.min(remainingAmount, pendingForHead);
                entry.paidAmount += payForThisHead;
                remainingAmount -= payForThisHead;
                paidHeads.push(headName);

                if (entry.paidAmount + entry.waivedAmount >= entry.amount) {
                  entry.status = 'paid';
                } else {
                  entry.status = 'partial';
                }
              }
            }
          }

          // Recalculate totals
          ledger.totalPaid = ledger.entries.reduce((sum, e) => sum + e.paidAmount, 0);
          const totalWaived = ledger.entries.reduce((sum, e) => sum + e.waivedAmount, 0);
          ledger.balance = ledger.totalDue - ledger.totalPaid - totalWaived;
          await ledger.save();

          // Create FeeTransaction
          const receiptNumber = generateReceiptNumber();
          const transaction = await FeeTransaction.create({
            ledger: ledger._id,
            student: rzpOrder.student,
            amount: rzpOrder.amount,
            method: 'online',
            razorpayOrderId: orderId,
            razorpayPaymentId: paymentId,
            receiptNumber,
            heads: paidHeads,
            status: 'success',
          });

          // Generate receipt file
          const receiptUrl = await saveReceiptFile(transaction, student, ledger);
          transaction.receiptUrl = receiptUrl;
          await transaction.save();
        }
      }
    }

    res.status(200).json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    next(error);
  }
};

// --- MANUAL PAYMENTS & COUNTERSIGN ---
const createManualPayment = async (req, res, next) => {
  try {
    const { studentId, amount, method, heads, session, reference } = req.body;
    if (!studentId || !amount || !method || !heads || !heads.length) {
      return res.status(400).json({
        success: false,
        message: 'Missing studentId, amount, method, or heads to pay',
      });
    }

    const activeSession = session || '2025-26';
    const ledger = await FeeLedger.findOne({ student: studentId, session: activeSession });
    if (!ledger) {
      return res.status(404).json({ success: false, message: 'Fee ledger not found' });
    }

    const receiptNumber = generateReceiptNumber();

    // Check if countersign is required (> ₹10,000)
    const requiresCountersign = amount > 10000;

    const transaction = await FeeTransaction.create({
      ledger: ledger._id,
      student: studentId,
      amount,
      method,
      receiptNumber,
      heads,
      collectedBy: req.user.id,
      status: requiresCountersign ? 'pending' : 'success',
      billRef: reference, // store reference if any
    });

    if (requiresCountersign) {
      return res.status(202).json({
        success: true,
        data: transaction,
        message: 'Transaction saved as pending countersign. Amount exceeds ₹10,000 limit.',
      });
    }

    // Process payment immediately
    const student = await Student.findById(studentId).populate('class');
    let remainingAmount = amount;
    const paidHeads = [];

    for (const headName of heads) {
      const entry = ledger.entries.find(e => e.head === headName);
      if (entry && entry.status !== 'paid' && entry.status !== 'waived') {
        const pendingForHead = entry.amount - entry.paidAmount - entry.waivedAmount;
        if (pendingForHead > 0) {
          const payForThisHead = Math.min(remainingAmount, pendingForHead);
          entry.paidAmount += payForThisHead;
          remainingAmount -= payForThisHead;
          paidHeads.push(headName);

          if (entry.paidAmount + entry.waivedAmount >= entry.amount) {
            entry.status = 'paid';
          } else {
            entry.status = 'partial';
          }
        }
      }
    }

    ledger.totalPaid = ledger.entries.reduce((sum, e) => sum + e.paidAmount, 0);
    const totalWaived = ledger.entries.reduce((sum, e) => sum + e.waivedAmount, 0);
    ledger.balance = ledger.totalDue - ledger.totalPaid - totalWaived;
    await ledger.save();

    // Generate receipt file
    const receiptUrl = await saveReceiptFile(transaction, student, ledger);
    transaction.receiptUrl = receiptUrl;
    transaction.heads = paidHeads;
    await transaction.save();

    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Payment recorded successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getPendingCountersigns = async (req, res, next) => {
  try {
    const transactions = await FeeTransaction.find({ status: 'pending' })
      .populate('student')
      .populate('collectedBy')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

const countersignPayment = async (req, res, next) => {
  try {
    if (blockCashier(req, res)) return;
    const transaction = await FeeTransaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Transaction is not in a pending countersign status',
      });
    }

    const ledger = await FeeLedger.findById(transaction.ledger);
    if (!ledger) {
      return res.status(404).json({ success: false, message: 'Ledger not found' });
    }

    const student = await Student.findById(transaction.student).populate('class');

    // Process and update ledger
    let remainingAmount = transaction.amount;
    const paidHeads = [];

    for (const headName of transaction.heads) {
      const entry = ledger.entries.find(e => e.head === headName);
      if (entry && entry.status !== 'paid' && entry.status !== 'waived') {
        const pendingForHead = entry.amount - entry.paidAmount - entry.waivedAmount;
        if (pendingForHead > 0) {
          const payForThisHead = Math.min(remainingAmount, pendingForHead);
          entry.paidAmount += payForThisHead;
          remainingAmount -= payForThisHead;
          paidHeads.push(headName);

          if (entry.paidAmount + entry.waivedAmount >= entry.amount) {
            entry.status = 'paid';
          } else {
            entry.status = 'partial';
          }
        }
      }
    }

    ledger.totalPaid = ledger.entries.reduce((sum, e) => sum + e.paidAmount, 0);
    const totalWaived = ledger.entries.reduce((sum, e) => sum + e.waivedAmount, 0);
    ledger.balance = ledger.totalDue - ledger.totalPaid - totalWaived;
    await ledger.save();

    transaction.status = 'success';
    transaction.heads = paidHeads;
    const receiptUrl = await saveReceiptFile(transaction, student, ledger);
    transaction.receiptUrl = receiptUrl;
    await transaction.save();

    res.status(200).json({
      success: true,
      data: transaction,
      message: 'Transaction countersigned successfully and ledger updated.',
    });
  } catch (error) {
    next(error);
  }
};

const rejectCountersign = async (req, res, next) => {
  try {
    if (blockCashier(req, res)) return;
    const transaction = await FeeTransaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Transaction is not in a pending countersign status',
      });
    }

    transaction.status = 'failed';
    await transaction.save();

    res.status(200).json({
      success: true,
      data: transaction,
      message: 'Transaction rejected successfully',
    });
  } catch (error) {
    next(error);
  }
};

// --- DEFAULTERS LIST REPORT ---
const getDefaulters = async (req, res, next) => {
  try {
    const ledgers = await FeeLedger.find({ balance: { $gt: 0 } })
      .populate({
        path: 'student',
        populate: { path: 'class' }
      });

    const now = new Date();
    const defaulters = [];

    for (const ledger of ledgers) {
      if (!ledger.student) continue;

      const overdueEntries = ledger.entries.filter(e => {
        return e.status !== 'paid' && e.status !== 'waived' && new Date(e.dueDate) < now;
      });

      if (overdueEntries.length > 0) {
        // Map overdue entries and compute escalation flag (past due > 7 days)
        const mappedEntries = overdueEntries.map(e => {
          const diffDays = Math.floor((now - new Date(e.dueDate)) / (1000 * 60 * 60 * 24));
          const escalated = diffDays > 7;
          return {
            head: e.head,
            amount: e.amount,
            dueDate: e.dueDate,
            paidAmount: e.paidAmount,
            waivedAmount: e.waivedAmount,
            status: e.status,
            escalated,
            daysOverdue: diffDays,
          };
        });

        // Determine if student has any escalated entry
        const isEscalated = mappedEntries.some(e => e.escalated);

        defaulters.push({
          student: {
            id: ledger.student._id,
            name: ledger.student.name,
            admissionNumber: ledger.student.admissionNumber,
            rollNumber: ledger.student.rollNumber,
            class: ledger.student.class ? ledger.student.class.name : 'N/A',
            section: ledger.student.section,
          },
          session: ledger.session,
          totalDue: ledger.totalDue,
          totalPaid: ledger.totalPaid,
          balance: ledger.balance,
          overdueEntries: mappedEntries,
          escalated: isEscalated,
        });
      }
    }

    res.status(200).json({
      success: true,
      data: defaulters,
    });
  } catch (error) {
    next(error);
  }
};

// --- EXPENSES CRUD & VENDOR LOGS ---
const createExpense = async (req, res, next) => {
  try {
    if (blockCashier(req, res)) return;
    const expenseData = {
      ...req.body,
      enteredBy: req.user.id,
    };
    const expense = await Expense.create(expenseData);
    res.status(201).json({
      success: true,
      data: expense,
      message: 'Expense created successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getExpenses = async (req, res, next) => {
  try {
    const { vendorOnly } = req.query;
    const query = {};

    // Filter by vendor presence if vendorOnly is set
    if (vendorOnly === 'true') {
      query.vendor = { $ne: null, $not: /^\s*$/ };
    }

    const expenses = await Expense.find(query)
      .populate('enteredBy', 'name email role')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: expenses,
    });
  } catch (error) {
    next(error);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    if (blockCashier(req, res)) return;
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    res.status(200).json({
      success: true,
      data: expense,
      message: 'Expense updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    if (blockCashier(req, res)) return;
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// --- BUDGETS CRUD & BUDGET VS ACTUAL REPORT ---
const createBudget = async (req, res, next) => {
  try {
    if (blockCashier(req, res)) return;
    const budget = await Budget.create(req.body);
    res.status(201).json({
      success: true,
      data: budget,
      message: 'Budget created successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getBudgets = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.session) query.session = req.query.session;
    const budgets = await Budget.find(query);
    res.status(200).json({
      success: true,
      data: budgets,
    });
  } catch (error) {
    next(error);
  }
};

const updateBudget = async (req, res, next) => {
  try {
    if (blockCashier(req, res)) return;
    const budget = await Budget.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }
    res.status(200).json({
      success: true,
      data: budget,
      message: 'Budget updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

const deleteBudget = async (req, res, next) => {
  try {
    if (blockCashier(req, res)) return;
    const budget = await Budget.findByIdAndDelete(req.params.id);
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Budget deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Budget vs Actual analytics report
const getBudgetVsActual = async (req, res, next) => {
  try {
    const session = req.query.session || '2025-26';
    
    // Parse session: e.g. "2025-26" -> Start April 1, 2025 to March 31, 2026
    const parts = session.split('-');
    const startYear = parseInt(parts[0]);
    let endYear = startYear + 1;
    if (parts[1] && parts[1].length === 2) {
      endYear = parseInt(parts[0].slice(0, 2) + parts[1]);
    }

    const startDate = new Date(startYear, 3, 1); // April 1st
    const endDate = new Date(endYear, 2, 31, 23, 59, 59, 999); // March 31st

    const budgets = await Budget.find({ session });
    const expenses = await Expense.find({
      date: { $gte: startDate, $lte: endDate },
    });

    const report = budgets.map(b => {
      // Sum expenses matching the head
      const matchingExpenses = expenses.filter(e => e.head.toLowerCase() === b.head.toLowerCase());
      const actualSum = matchingExpenses.reduce((sum, e) => sum + e.amount, 0);

      return {
        _id: b._id,
        session: b.session,
        head: b.head,
        budgeted: b.budgeted,
        actual: actualSum,
        variance: b.budgeted - actualSum,
      };
    });

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

// --- FEE WAIVERS WORKFLOW ---
const requestWaiver = async (req, res, next) => {
  try {
    const { studentId, heads, amount, reason, session } = req.body;
    if (!studentId || !heads || !heads.length || !amount || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Missing studentId, heads, amount, or reason for waiver request',
      });
    }

    const activeSession = session || '2025-26';
    const ledger = await FeeLedger.findOne({ student: studentId, session: activeSession });
    if (!ledger) {
      return res.status(404).json({ success: false, message: 'Fee ledger not found' });
    }

    const waiver = await FeeWaiver.create({
      student: studentId,
      ledger: ledger._id,
      heads,
      amount,
      reason,
      requestedBy: req.user.id,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      data: waiver,
      message: 'Fee waiver request submitted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getWaivers = async (req, res, next) => {
  try {
    const waivers = await FeeWaiver.find({})
      .populate('student')
      .populate('requestedBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: waivers,
    });
  } catch (error) {
    next(error);
  }
};

const approveWaiver = async (req, res, next) => {
  try {
    if (blockCashier(req, res)) return;
    
    // Check if the user is Principal or Accounts Officer (Principal is normal approver, we can allow Principal only or Principal + Vice Principal)
    const allowedRoles = ['principal', 'vice_principal'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only Principal or Vice Principal can approve waivers.',
      });
    }

    const waiver = await FeeWaiver.findById(req.params.id);
    if (!waiver) {
      return res.status(404).json({ success: false, message: 'Fee waiver request not found' });
    }

    if (waiver.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Waiver request is not in pending status',
      });
    }

    const ledger = await FeeLedger.findById(waiver.ledger);
    if (!ledger) {
      return res.status(404).json({ success: false, message: 'Ledger not found' });
    }

    // Apply waiver amount among the specified heads
    let remainingWaiver = waiver.amount;
    for (const headName of waiver.heads) {
      const entry = ledger.entries.find(e => e.head === headName);
      if (entry && entry.status !== 'paid' && entry.status !== 'waived') {
        const pendingForHead = entry.amount - entry.paidAmount - entry.waivedAmount;
        if (pendingForHead > 0) {
          const waiveForThisHead = Math.min(remainingWaiver, pendingForHead);
          entry.waivedAmount += waiveForThisHead;
          remainingWaiver -= waiveForThisHead;

          if (entry.paidAmount + entry.waivedAmount >= entry.amount) {
            entry.status = 'waived';
          } else {
            entry.status = 'partial';
          }
        }
      }
    }

    ledger.totalPaid = ledger.entries.reduce((sum, e) => sum + e.paidAmount, 0);
    const totalWaived = ledger.entries.reduce((sum, e) => sum + e.waivedAmount, 0);
    ledger.balance = ledger.totalDue - ledger.totalPaid - totalWaived;
    await ledger.save();

    waiver.status = 'approved';
    waiver.approvedBy = req.user.id;
    waiver.approvedAt = new Date();
    await waiver.save();

    res.status(200).json({
      success: true,
      data: waiver,
      message: 'Fee waiver approved successfully and applied to ledger.',
    });
  } catch (error) {
    next(error);
  }
};

const rejectWaiver = async (req, res, next) => {
  try {
    if (blockCashier(req, res)) return;
    
    const allowedRoles = ['principal', 'vice_principal'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only Principal or Vice Principal can reject waivers.',
      });
    }

    const waiver = await FeeWaiver.findById(req.params.id);
    if (!waiver) {
      return res.status(404).json({ success: false, message: 'Fee waiver request not found' });
    }

    if (waiver.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Waiver request is not in pending status',
      });
    }

    waiver.status = 'rejected';
    waiver.approvedBy = req.user.id;
    waiver.approvedAt = new Date();
    await waiver.save();

    res.status(200).json({
      success: true,
      data: waiver,
      message: 'Fee waiver request rejected.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFeeStructure,
  getFeeStructures,
  updateFeeStructure,
  deleteFeeStructure,
  getStudentLedger,
  createRazorpayOrder,
  razorpayWebhook,
  createManualPayment,
  getPendingCountersigns,
  countersignPayment,
  rejectCountersign,
  getDefaulters,
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
  getBudgetVsActual,
  requestWaiver,
  getWaivers,
  approveWaiver,
  rejectWaiver,
};
