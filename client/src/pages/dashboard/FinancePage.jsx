import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import {
  IndianRupee,
  Layers,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ClipboardList,
  TrendingUp,
  DollarSign,
  PlusCircle,
  FileText,
  UserCheck,
  RefreshCw,
  Info,
  Calendar,
} from 'lucide-react';

export default function FinancePage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('structures');
  const [classes, setClasses] = useState([]);

  // Loading States
  const [loading, setLoading] = useState(false);

  // Tab: Structures
  const [structures, setStructures] = useState([]);
  const [showAddStructure, setShowAddStructure] = useState(false);
  const [newStructure, setNewStructure] = useState({
    session: '2025-26',
    class: '',
    heads: [{ name: '', amount: '', frequency: 'monthly', dueDay: 10 }],
  });

  // Tab: Countersign Queue
  const [pendingTx, setPendingTx] = useState([]);

  // Tab: Defaulters
  const [defaulters, setDefaulters] = useState([]);

  // Tab: Expenses & Budgets
  const [expenses, setExpenses] = useState([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [vendorOnly, setVendorOnly] = useState(false);
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    head: '',
    amount: '',
    description: '',
    vendor: '',
    billRef: '',
  });

  const [budgets, setBudgets] = useState([]);
  const [budgetVsActual, setBudgetVsActual] = useState([]);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [newBudget, setNewBudget] = useState({
    session: '2025-26',
    head: '',
    budgeted: '',
  });

  // Tab: Waivers
  const [waivers, setWaivers] = useState([]);
  const [students, setStudents] = useState([]);
  const [showAddWaiver, setShowAddWaiver] = useState(false);
  const [newWaiver, setNewWaiver] = useState({
    studentId: '',
    heads: [],
    amount: '',
    reason: '',
  });
  const [selectedStudentLedger, setSelectedStudentLedger] = useState(null);

  // Load basic configurations
  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    // Reload active tab data
    if (activeTab === 'structures') fetchStructures();
    else if (activeTab === 'countersigns') fetchPendingTransactions();
    else if (activeTab === 'defaulters') fetchDefaulters();
    else if (activeTab === 'expenses') {
      fetchExpenses();
      fetchBudgets();
      fetchBudgetVsActual();
    } else if (activeTab === 'waivers') {
      fetchWaivers();
      fetchStudents();
    }
  }, [activeTab, vendorOnly]);

  const fetchClasses = async () => {
    try {
      const res = await axios.get('/academics/classes');
      if (res.data && res.data.success) {
        setClasses(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get('/students');
      if (res.data && res.data.success) {
        setStudents(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- STRUCTURES API ---
  const fetchStructures = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/finance/structures');
      if (res.data && res.data.success) {
        setStructures(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load fee structures');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHead = () => {
    setNewStructure(prev => ({
      ...prev,
      heads: [...prev.heads, { name: '', amount: '', frequency: 'monthly', dueDay: 10 }],
    }));
  };

  const handleRemoveHead = index => {
    setNewStructure(prev => ({
      ...prev,
      heads: prev.heads.filter((_, i) => i !== index),
    }));
  };

  const handleHeadChange = (index, field, value) => {
    const updated = [...newStructure.heads];
    updated[index][field] = value;
    setNewStructure(prev => ({ ...prev, heads: updated }));
  };

  const submitStructure = async (e) => {
    e.preventDefault();
    try {
      const formatted = {
        ...newStructure,
        heads: newStructure.heads.map(h => ({
          ...h,
          amount: parseFloat(h.amount),
          dueDay: parseInt(h.dueDay),
        })),
      };
      const res = await axios.post('/finance/structures', formatted);
      if (res.data && res.data.success) {
        toast.success('Fee structure added successfully!');
        setShowAddStructure(false);
        setNewStructure({
          session: '2025-26',
          class: '',
          heads: [{ name: '', amount: '', frequency: 'monthly', dueDay: 10 }],
        });
        fetchStructures();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create fee structure');
    }
  };

  // --- COUNTERSIGN API ---
  const fetchPendingTransactions = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/finance/countersigns');
      if (res.data && res.data.success) {
        setPendingTx(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load countersign queue');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTransaction = async (txId) => {
    try {
      const res = await axios.post(`/finance/countersigns/${txId}/approve`);
      if (res.data && res.data.success) {
        toast.success('Transaction countersigned successfully!');
        fetchPendingTransactions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve transaction');
    }
  };

  const handleRejectTransaction = async (txId) => {
    try {
      const res = await axios.post(`/finance/countersigns/${txId}/reject`);
      if (res.data && res.data.success) {
        toast.warning('Transaction rejected');
        fetchPendingTransactions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject transaction');
    }
  };

  // --- DEFAULTERS API ---
  const fetchDefaulters = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/finance/defaulters');
      if (res.data && res.data.success) {
        setDefaulters(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load defaulters report');
    } finally {
      setLoading(false);
    }
  };

  // --- EXPENSES & BUDGETS API ---
  const fetchExpenses = async () => {
    try {
      const res = await axios.get(`/finance/expenses?vendorOnly=${vendorOnly}`);
      if (res.data && res.data.success) {
        setExpenses(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to fetch expenses');
    }
  };

  const fetchBudgets = async () => {
    try {
      const res = await axios.get('/finance/budgets');
      if (res.data && res.data.success) {
        setBudgets(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBudgetVsActual = async () => {
    try {
      const res = await axios.get('/finance/budgets/vs-actual');
      if (res.data && res.data.success) {
        setBudgetVsActual(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const submitExpense = async (e) => {
    e.preventDefault();
    try {
      const formatted = {
        ...newExpense,
        amount: parseFloat(newExpense.amount),
      };
      const res = await axios.post('/finance/expenses', formatted);
      if (res.data && res.data.success) {
        toast.success('Expense logged successfully');
        setShowAddExpense(false);
        setNewExpense({
          date: new Date().toISOString().split('T')[0],
          head: '',
          amount: '',
          description: '',
          vendor: '',
          billRef: '',
        });
        fetchExpenses();
        fetchBudgetVsActual();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create expense');
    }
  };

  const submitBudget = async (e) => {
    e.preventDefault();
    try {
      const formatted = {
        ...newBudget,
        budgeted: parseFloat(newBudget.budgeted),
      };
      const res = await axios.post('/finance/budgets', formatted);
      if (res.data && res.data.success) {
        toast.success('Budget created successfully');
        setShowAddBudget(false);
        setNewBudget({ session: '2025-26', head: '', budgeted: '' });
        fetchBudgets();
        fetchBudgetVsActual();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create budget');
    }
  };

  // --- WAIVERS API ---
  const fetchWaivers = async () => {
    try {
      const res = await axios.get('/finance/waivers');
      if (res.data && res.data.success) {
        setWaivers(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectWaiverStudent = async (studentId) => {
    setNewWaiver(prev => ({ ...prev, studentId, heads: [] }));
    if (!studentId) {
      setSelectedStudentLedger(null);
      return;
    }
    try {
      const res = await axios.get(`/finance/ledger/student/${studentId}`);
      if (res.data && res.data.success) {
        setSelectedStudentLedger(res.data.data);
      }
    } catch (e) {
      toast.error('Failed to load ledger for waiver selection');
    }
  };

  const submitWaiver = async (e) => {
    e.preventDefault();
    if (!newWaiver.studentId || !newWaiver.heads.length || !newWaiver.amount || !newWaiver.reason) {
      toast.warning('Please complete all waiver details');
      return;
    }
    try {
      const formatted = {
        studentId: newWaiver.studentId,
        heads: newWaiver.heads,
        amount: parseFloat(newWaiver.amount),
        reason: newWaiver.reason,
        session: selectedStudentLedger.session,
      };
      const res = await axios.post('/finance/waivers', formatted);
      if (res.data && res.data.success) {
        toast.success('Waiver request submitted successfully!');
        setShowAddWaiver(false);
        setNewWaiver({ studentId: '', heads: [], amount: '', reason: '' });
        setSelectedStudentLedger(null);
        fetchWaivers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit waiver');
    }
  };

  const handleApproveWaiver = async (waiverId) => {
    try {
      const res = await axios.post(`/finance/waivers/${waiverId}/approve`);
      if (res.data && res.data.success) {
        toast.success('Waiver approved and applied');
        fetchWaivers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve waiver');
    }
  };

  const handleRejectWaiver = async (waiverId) => {
    try {
      const res = await axios.post(`/finance/waivers/${waiverId}/reject`);
      if (res.data && res.data.success) {
        toast.warning('Waiver request rejected');
        fetchWaivers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject waiver');
    }
  };

  // Role check helper
  const isCashier = user && user.role === 'cashier';
  const isPrincipal = user && user.role === 'principal' || user?.role === 'vice_principal';
  const isAccountsOfficer = user && user.role === 'accounts_officer';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Finance Management</h1>
        <p className="text-gray-500 mt-1">Configure structures, track budgets vs actuals, approve waivers, and view reports.</p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveTab('structures')}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 outline-none ${
            activeTab === 'structures' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Fee Setup
        </button>
        <button
          onClick={() => setActiveTab('countersigns')}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 outline-none ${
            activeTab === 'countersigns' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Countersign Queue
        </button>
        <button
          onClick={() => setActiveTab('defaulters')}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 outline-none ${
            activeTab === 'defaulters' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Defaulters Report
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 outline-none ${
            activeTab === 'expenses' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Expenses & Budgets
        </button>
        <button
          onClick={() => setActiveTab('waivers')}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 outline-none ${
            activeTab === 'waivers' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Fee Waivers
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div className="p-8 text-center text-gray-500 flex justify-center items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" /> Loading data...
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: STRUCTURES */}
          {activeTab === 'structures' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-950">Active Fee Structures</h2>
                {!isCashier && (
                  <button
                    onClick={() => setShowAddStructure(true)}
                    className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4" /> Setup Fee Structure
                  </button>
                )}
              </div>

              {showAddStructure && (
                <form onSubmit={submitStructure} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                  <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-3">Create New Fee Structure</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Session</label>
                      <input
                        type="text"
                        required
                        className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-indigo-500"
                        value={newStructure.session}
                        onChange={e => setNewStructure(prev => ({ ...prev, session: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Class</label>
                      <select
                        required
                        className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                        value={newStructure.class}
                        onChange={e => setNewStructure(prev => ({ ...prev, class: e.target.value }))}
                      >
                        <option value="">Select Class</option>
                        {classes.map(c => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <span className="text-sm font-bold text-gray-700">Fee Heads</span>
                      <button
                        type="button"
                        onClick={handleAddHead}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        + Add Head
                      </button>
                    </div>

                    {newStructure.heads.map((head, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end bg-gray-55/30 p-4 rounded-xl border border-gray-100">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Head Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Tuition Fee"
                            className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                            value={head.name}
                            onChange={e => handleHeadChange(idx, 'name', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Amount (INR)</label>
                          <input
                            type="number"
                            required
                            className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                            value={head.amount}
                            onChange={e => handleHeadChange(idx, 'amount', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Frequency</label>
                          <select
                            className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                            value={head.frequency}
                            onChange={e => handleHeadChange(idx, 'frequency', e.target.value)}
                          >
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="annual">Annual</option>
                          </select>
                        </div>
                        <div className="flex gap-2 items-center">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Due Day of Month</label>
                            <input
                              type="number"
                              min="1"
                              max="28"
                              required
                              className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                              value={head.dueDay}
                              onChange={e => handleHeadChange(idx, 'dueDay', e.target.value)}
                            />
                          </div>
                          {newStructure.heads.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveHead(idx)}
                              className="text-red-600 hover:text-red-800 text-sm font-semibold p-1"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddStructure(false)}
                      className="border border-gray-350 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700"
                    >
                      Save Structure
                    </button>
                  </div>
                </form>
              )}

              {/* Structure list */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {structures.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                          <th className="px-6 py-4">Class</th>
                          <th className="px-6 py-4">Session</th>
                          <th className="px-6 py-4">Heads Count</th>
                          <th className="px-6 py-4">Total Fee (Annualized)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                        {structures.map(s => {
                          const totalAmt = s.heads.reduce((sum, h) => sum + h.amount, 0);
                          return (
                            <tr key={s._id} className="hover:bg-gray-50/50">
                              <td className="px-6 py-4 font-semibold text-gray-800">
                                {s.class ? s.class.name : 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-gray-650">{s.session}</td>
                              <td className="px-6 py-4 text-gray-650">{s.heads.length} heads</td>
                              <td className="px-6 py-4 text-indigo-650 font-bold">₹{totalAmt}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">No fee structures configured yet.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: COUNTERSIGN QUEUE */}
          {activeTab === 'countersigns' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-950">Pending Countersign Payments</h2>
                <div className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" /> Requires approval for manual receipts &gt; ₹10,000
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {pendingTx.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                          <th className="px-6 py-4">Receipt Number</th>
                          <th className="px-6 py-4">Student</th>
                          <th className="px-6 py-4">Collected By</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Method</th>
                          <th className="px-6 py-4">Heads</th>
                          <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                        {pendingTx.map(tx => (
                          <tr key={tx._id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4 font-semibold text-gray-800">{tx.receiptNumber}</td>
                            <td className="px-6 py-4">
                              <div className="font-semibold">{tx.student?.name}</div>
                              <div className="text-xs text-gray-400">Adm ID: {tx.student?.admissionNumber}</div>
                            </td>
                            <td className="px-6 py-4 text-gray-650">
                              {tx.collectedBy?.name} ({tx.collectedBy?.role?.toUpperCase()})
                            </td>
                            <td className="px-6 py-4 text-amber-700 font-bold">₹{tx.amount}</td>
                            <td className="px-6 py-4 uppercase font-semibold text-xs text-gray-600">{tx.method}</td>
                            <td className="px-6 py-4 text-gray-500">{tx.heads.join(', ')}</td>
                            <td className="px-6 py-4 text-center">
                              {!isCashier ? (
                                <div className="flex justify-center gap-2">
                                  <button
                                    onClick={() => handleApproveTransaction(tx._id)}
                                    className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                                    title="Countersign / Approve"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleRejectTransaction(tx._id)}
                                    className="p-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                                    title="Reject / Deny"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 italic">Locked</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">No transactions awaiting countersign approval.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DEFAULTERS */}
          {activeTab === 'defaulters' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-950">Overdue Defaulters List</h2>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {defaulters.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                          <th className="px-6 py-4">Student</th>
                          <th className="px-6 py-4">Class</th>
                          <th className="px-6 py-4">Total Due</th>
                          <th className="px-6 py-4">Remaining Balance</th>
                          <th className="px-6 py-4">Overdue Details</th>
                          <th className="px-6 py-4">Escalation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                        {defaulters.map(d => (
                          <tr key={d.student.id} className={`hover:bg-gray-50/50 ${d.escalated ? 'bg-rose-50/30' : ''}`}>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-800">{d.student.name}</div>
                              <div className="text-xs text-gray-400 font-medium">Adm No: {d.student.admissionNumber}</div>
                            </td>
                            <td className="px-6 py-4 text-gray-650">
                              Class {d.student.class} - {d.student.section || 'A'}
                            </td>
                            <td className="px-6 py-4 text-gray-650 font-medium">₹{d.totalDue}</td>
                            <td className="px-6 py-4 text-gray-900 font-bold">₹{d.balance}</td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                {d.overdueEntries.map((e, idx) => (
                                  <div key={idx} className="text-xs text-gray-650">
                                    • {e.head}: <span className="font-semibold text-amber-700">₹{e.amount - e.paidAmount - e.waivedAmount}</span> (due {new Date(e.dueDate).toLocaleDateString()}, {e.daysOverdue} days past)
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {d.escalated ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full border border-rose-100 animate-pulse">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Escalated (&gt;7 Days)
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-xs font-semibold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">
                                  Overdue
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">No overdue fee accounts found. All students paid up!</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: EXPENSES & BUDGETS */}
          {activeTab === 'expenses' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Expenses panel */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-950">Logged Expenses</h2>
                  <div className="flex gap-4 items-center">
                    <label className="flex items-center gap-1.5 text-sm text-gray-600 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-indigo-600"
                        checked={vendorOnly}
                        onChange={e => setVendorOnly(e.target.checked)}
                      />
                      Show Vendor Payments Only
                    </label>

                    {!isCashier && (
                      <button
                        onClick={() => setShowAddExpense(true)}
                        className="bg-indigo-600 text-white font-semibold py-2 px-3 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-1.5 text-xs shadow-sm"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Log Expense
                      </button>
                    )}
                  </div>
                </div>

                {showAddExpense && (
                  <form onSubmit={submitExpense} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 text-sm">Add Expense Entry</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
                        <input
                          type="date"
                          required
                          className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                          value={newExpense.date}
                          onChange={e => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Expense Head</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Maintenance, Salary"
                          className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                          value={newExpense.head}
                          onChange={e => setNewExpense(prev => ({ ...prev, head: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Amount (INR)</label>
                        <input
                          type="number"
                          required
                          className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                          value={newExpense.amount}
                          onChange={e => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Bill Reference No</label>
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                          value={newExpense.billRef}
                          onChange={e => setNewExpense(prev => ({ ...prev, billRef: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Vendor Name (Optional)</label>
                      <input
                        type="text"
                        placeholder="Leave empty if not a vendor payment"
                        className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                        value={newExpense.vendor}
                        onChange={e => setNewExpense(prev => ({ ...prev, vendor: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                        value={newExpense.description}
                        onChange={e => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>

                    <div className="flex justify-end gap-2 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setShowAddExpense(false)}
                        className="border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700"
                      >
                        Log Entry
                      </button>
                    </div>
                  </form>
                )}

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  {expenses.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Head</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Ref/Vendor</th>
                            <th className="px-6 py-4">Logged By</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                          {expenses.map(exp => (
                            <tr key={exp._id} className="hover:bg-gray-50/50">
                              <td className="px-6 py-4 text-gray-650">
                                {new Date(exp.date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 font-semibold text-gray-800">{exp.head}</td>
                              <td className="px-6 py-4 text-red-700 font-bold">₹{exp.amount}</td>
                              <td className="px-6 py-4">
                                <div className="text-gray-700">{exp.billRef || 'N/A'}</div>
                                {exp.vendor && (
                                  <span className="inline-block text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-150 px-1.5 py-0.5 rounded-full mt-0.5">
                                    Vendor: {exp.vendor}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-gray-500 text-xs">
                                {exp.enteredBy?.name}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">No expense records logged.</div>
                  )}
                </div>
              </div>

              {/* Budgets panel */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Budget Trackers</h2>
                  {!isCashier && (
                    <button
                      onClick={() => setShowAddBudget(true)}
                      className="bg-indigo-50 text-indigo-700 font-semibold py-1.5 px-2.5 rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-1 text-xs"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Define
                    </button>
                  )}
                </div>

                {showAddBudget && (
                  <form onSubmit={submitBudget} className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                    <h3 className="font-bold text-gray-900 text-xs border-b border-gray-100 pb-1.5">Define Head Budget</h3>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Session</label>
                      <input
                        type="text"
                        required
                        className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                        value={newBudget.session}
                        onChange={e => setNewBudget(prev => ({ ...prev, session: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Head Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Salary, Maintenance"
                        className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                        value={newBudget.head}
                        onChange={e => setNewBudget(prev => ({ ...prev, head: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Budgeted Limit (INR)</label>
                      <input
                        type="number"
                        required
                        className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                        value={newBudget.budgeted}
                        onChange={e => setNewBudget(prev => ({ ...prev, budgeted: e.target.value }))}
                      />
                    </div>
                    <div className="flex justify-end gap-1.5 text-[10px] font-semibold pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddBudget(false)}
                        className="border border-gray-300 px-2.5 py-1 rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-indigo-600 text-white px-2.5 py-1 rounded hover:bg-indigo-700"
                      >
                        Create
                      </button>
                    </div>
                  </form>
                )}

                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <div className="text-xs font-bold text-gray-450 uppercase tracking-wider">
                    Budget vs Actual (Session 2025-26)
                  </div>

                  {budgetVsActual.length > 0 ? (
                    <div className="space-y-4">
                      {budgetVsActual.map(item => {
                        const pct = Math.min(100, Math.round((item.actual / item.budgeted) * 100));
                        const isOver = item.actual > item.budgeted;

                        return (
                          <div key={item._id} className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="font-semibold text-gray-800">{item.head}</span>
                              <span className={`font-bold ${isOver ? 'text-rose-600' : 'text-gray-500'}`}>
                                ₹{item.actual} / ₹{item.budgeted}
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isOver ? 'bg-rose-500 animate-pulse' : pct > 85 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                            {isOver && (
                              <div className="text-[10px] font-bold text-rose-600 flex items-center gap-0.5">
                                <AlertTriangle className="w-3 h-3" /> Over budget by ₹{item.actual - item.budgeted}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 italic text-center py-4">No budget structures defined for reports.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: WAIVERS */}
          {activeTab === 'waivers' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Waiver list */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-950">Waiver Requests log</h2>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  {waivers.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                            <th className="px-6 py-4">Student</th>
                            <th className="px-6 py-4">Heads Affected</th>
                            <th className="px-6 py-4">Waiver Amount</th>
                            <th className="px-6 py-4">Requested By</th>
                            <th className="px-6 py-4">Reason</th>
                            <th className="px-6 py-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                          {waivers.map(w => (
                            <tr key={w._id} className="hover:bg-gray-50/50">
                              <td className="px-6 py-4">
                                <div className="font-semibold text-gray-800">{w.student?.name}</div>
                                <div className="text-xs text-gray-400">Adm ID: {w.student?.admissionNumber}</div>
                              </td>
                              <td className="px-6 py-4 text-gray-500">{w.heads.join(', ')}</td>
                              <td className="px-6 py-4 font-bold text-indigo-650">₹{w.amount}</td>
                              <td className="px-6 py-4 text-xs text-gray-500">{w.requestedBy?.name}</td>
                              <td className="px-6 py-4 text-gray-600 text-xs max-w-xs truncate" title={w.reason}>
                                {w.reason}
                              </td>
                              <td className="px-6 py-4">
                                {w.status === 'pending' ? (
                                  isPrincipal ? (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleApproveWaiver(w._id)}
                                        className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-250 px-2 py-1 rounded hover:bg-emerald-100"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => handleRejectWaiver(w._id)}
                                        className="text-[10px] font-bold bg-red-50 text-red-700 border border-red-250 px-2 py-1 rounded hover:bg-red-100"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                      Pending Approval
                                    </span>
                                  )
                                ) : (
                                  <span
                                    className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${
                                      w.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                    }`}
                                  >
                                    {w.status.toUpperCase()}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">No waiver requests recorded.</div>
                  )}
                </div>
              </div>

              {/* Request Waiver Form */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                  <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-1.5">
                    <UserCheck className="w-5 h-5 text-indigo-600" /> Request Fee Waiver
                  </h3>

                  {isAccountsOfficer || isPrincipal ? (
                    <form onSubmit={submitWaiver} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-650 mb-1">Select Student</label>
                        <select
                          required
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                          value={newWaiver.studentId}
                          onChange={e => handleSelectWaiverStudent(e.target.value)}
                        >
                          <option value="">Select Student</option>
                          {students.map(s => (
                            <option key={s._id} value={s._id}>{s.name} ({s.admissionNumber})</option>
                          ))}
                        </select>
                      </div>

                      {selectedStudentLedger && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-650 mb-1">Select Heads to Waive</label>
                            <div className="space-y-2 border border-gray-200 p-3 rounded-lg max-h-40 overflow-y-auto bg-gray-50/20">
                              {selectedStudentLedger.entries.map((entry, idx) => {
                                const isWaived = entry.status === 'waived';
                                const isPaid = entry.status === 'paid';
                                return (
                                  <label key={idx} className="flex items-center gap-2 text-xs font-medium text-gray-750 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      disabled={isWaived || isPaid}
                                      className="rounded border-gray-300 text-indigo-600"
                                      checked={newWaiver.heads.includes(entry.head)}
                                      onChange={e => {
                                        if (e.target.checked) {
                                          setNewWaiver(prev => ({ ...prev, heads: [...prev.heads, entry.head] }));
                                        } else {
                                          setNewWaiver(prev => ({ ...prev, heads: prev.heads.filter(h => h !== entry.head) }));
                                        }
                                      }}
                                    />
                                    {entry.head} (Remaining: ₹{entry.amount - entry.paidAmount - entry.waivedAmount})
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-650 mb-1">Waiver Amount (INR)</label>
                            <input
                              type="number"
                              required
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                              value={newWaiver.amount}
                              onChange={e => setNewWaiver(prev => ({ ...prev, amount: e.target.value }))}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-655 mb-1">Waiver Reason</label>
                            <textarea
                              required
                              rows="3"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                              placeholder="Describe the reason (e.g. Scholarship, Meritorious)"
                              value={newWaiver.reason}
                              onChange={e => setNewWaiver(prev => ({ ...prev, reason: e.target.value }))}
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-indigo-650 text-white font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors text-sm shadow-sm"
                          >
                            Submit Waiver Request
                          </button>
                        </div>
                      )}
                    </form>
                  ) : (
                    <div className="text-xs text-gray-500 bg-gray-50 p-4 rounded-xl flex items-start gap-2">
                      <Info className="w-4 h-4 text-gray-400 mt-0.5" />
                      Only Accounts Officers or Principal can request a fee waiver. Cashiers are restricted.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
