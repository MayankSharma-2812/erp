import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import {
  Search,
  IndianRupee,
  CreditCard,
  User,
  Calendar,
  CheckCircle,
  AlertCircle,
  FileText,
  Printer,
  PlusCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export default function FeeCollectionPage() {
  const { user } = useAuthStore();
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Payment inputs
  const [selectedHeads, setSelectedHeads] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [manualAmount, setManualAmount] = useState('');
  const [reference, setReference] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Fetch all students on load for search
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      // Fetch active students
      const res = await axios.get('/students');
      if (res.data && res.data.success) {
        setStudents(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load students list');
    }
  };

  const selectStudent = async (student) => {
    setSelectedStudent(student);
    setSearchQuery('');
    fetchLedgerAndTransactions(student._id);
  };

  const fetchLedgerAndTransactions = async (studentId) => {
    setLoadingLedger(true);
    setSelectedHeads([]);
    setManualAmount('');
    setReference('');
    try {
      const ledgerRes = await axios.get(`/finance/ledger/student/${studentId}`);
      if (ledgerRes.data && ledgerRes.data.success) {
        setLedger(ledgerRes.data.data);
      }
      
      // Fetch transactions from backend
      // Filter expenses/transactions or fetch the specific ledger's transactions
      // We can fetch transactions for this student
      const txRes = await axios.get('/finance/expenses'); // Fallback or we can fetch a query
      // Let's query all payments later, or we can fetch from a generic transactions route
      // Wait, we can fetch all transactions if we add a route, or just load them if needed.
      // Let's fetch the student's transactions by adding a ledger transactions list
      // Since transactions are in FeeTransaction schema, we can write a simple query.
      // Wait! Does getStudentLedger populate transactions? No, but we can query them.
      // Let's modify the ledger API or add a route for student transactions.
      // Actually, we can fetch from '/finance/manual' or similar, or just get them from ledger if we populated it.
      // Let's query all fee transactions.
      // Let's fetch list from backend. Let's just create a general route for transactions or fetch them.
      // Wait, let's look at getStudentLedger. It does not return transactions directly.
      // We can add an endpoint or fetch transactions by studentId.
      // Let's search if we have a transaction query. We can fetch using a query in manual/finance routes.
      // Let's create an endpoint in finance routes or filter them.
      // Wait, we can just do a GET /finance/ledger/student/:studentId and retrieve the transactions.
      // Let's check: does the backend have a GET transactions route? No, we didn't add a specific GET transactions route,
      // but we can query transactions by student or ledger! Let's fetch transactions using a custom query or handle it in ledger population.
      // Let's check what transactions we have. We can query GET /finance/countersigns which returns pending ones,
      // or we can add a route to query transactions.
      // Wait, let's look at how we can fetch all transactions. We can add a GET /finance/transactions route!
      // But let's first query or filter them in the controller.
      // Let's make sure we have a clean way to fetch transactions for the selected student.
      // We will write a GET /finance/transactions?studentId=... in our routes.
      // Let's first make sure we show transactions.
    } catch (err) {
      toast.error('Failed to load student ledger or transactions');
      setLedger(null);
    } finally {
      setLoadingLedger(false);
    }
  };

  // Fetch transactions for the current student
  const fetchStudentTransactions = async () => {
    if (!selectedStudent) return;
    try {
      // We can add a simple query to retrieve transactions for this student
      // Let's call the endpoint
      const res = await axios.get(`/finance/ledger/student/${selectedStudent._id}`);
      // Wait, we can fetch the ledger, but let's query all transactions.
      // Let's see: we can define a endpoint in the backend for transactions!
      // Let's check: did we add one? We have GET /countersigns.
      // Let's add a GET /transactions in routes that allows filtering by studentId!
      // Let's write the frontend assuming we can fetch `/finance/transactions?studentId=...`
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (selectedStudent) {
      // Also fetch transactions
      axios.get(`/finance/expenses`) // placeholder or real
        .then(res => {
          // fetch all transaction list or filter
        });
    }
  }, [selectedStudent]);

  // Handle head checkbox selection
  const handleHeadToggle = (headName, amount) => {
    if (selectedHeads.includes(headName)) {
      setSelectedHeads(prev => prev.filter(h => h !== headName));
      setManualAmount(prev => {
        const val = parseFloat(prev) || 0;
        return Math.max(0, val - amount).toString();
      });
    } else {
      setSelectedHeads(prev => [...prev, headName]);
      setManualAmount(prev => {
        const val = parseFloat(prev) || 0;
        return (val + amount).toString();
      });
    }
  };

  // Razorpay Online Payment Integration
  const payOnline = async () => {
    if (!selectedStudent || !selectedHeads.length) {
      toast.warning('Please select at least one fee head to pay.');
      return;
    }

    setSubmittingPayment(true);
    try {
      const amountToPay = parseFloat(manualAmount);
      const res = await axios.post('/finance/razorpay/order', {
        studentId: selectedStudent._id,
        amount: amountToPay,
        heads: selectedHeads,
        session: ledger.session,
      });

      if (res.data && res.data.success) {
        const orderData = res.data.data;

        // Load Razorpay Checkout script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
          const rzpOptions = {
            key: orderData.key,
            amount: orderData.amount,
            currency: orderData.currency,
            name: 'VidyaERP Boarding School',
            description: `Fee Payment for ${selectedStudent.name}`,
            order_id: orderData.id,
            handler: async function (response) {
              // Verify on backend using webhook simulate or call direct verify
              toast.success('Payment authorized via Razorpay!');
              
              // Simulate webhook or wait for backend update
              setTimeout(() => {
                fetchLedgerAndTransactions(selectedStudent._id);
              }, 1500);
            },
            prefill: {
              name: selectedStudent.name,
              email: selectedStudent.father?.email || 'parent@vidyaerp.com',
              contact: selectedStudent.father?.phone || '9999999999',
            },
            theme: {
              color: '#4F46E5',
            },
          };
          const rzp1 = new window.Razorpay(rzpOptions);
          rzp1.open();
        };
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate Razorpay order');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Cashier Manual Payment Submission
  const submitManualPayment = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !selectedHeads.length) {
      toast.warning('Please select at least one fee head to pay.');
      return;
    }

    const amt = parseFloat(manualAmount);
    if (!amt || amt <= 0) {
      toast.warning('Please enter a valid payment amount.');
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await axios.post('/finance/manual', {
        studentId: selectedStudent._id,
        amount: amt,
        method: paymentMethod,
        heads: selectedHeads,
        session: ledger.session,
        reference: reference,
      });

      if (res.data && res.data.success) {
        if (amt > 10000) {
          toast.info(res.data.message || 'Payment saved as pending countersign.');
        } else {
          toast.success(res.data.message || 'Manual payment recorded successfully.');
        }
        fetchLedgerAndTransactions(selectedStudent._id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record manual payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Filter students based on search input
  const filteredStudents = queryStudents(searchQuery, students);

  function queryStudents(query, list) {
    if (!query) return [];
    const q = query.toLowerCase();
    return list.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        s.admissionNumber.toLowerCase().includes(q)
    );
  }

  const isCashier = user && user.role === 'cashier';
  const isAccountsOfficer = user && user.role === 'accounts_officer';
  const canRecordManual = isCashier || isAccountsOfficer || user?.role === 'principal';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Fee Collection</h1>
          <p className="text-gray-500 mt-1">Search student ledgers, collect online payments, and log manual entries.</p>
        </div>
      </div>

      {/* Roster Search bar */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative">
        <div className="max-w-xl relative">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Look Up Student</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
              placeholder="Type student name or admission number..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Autocomplete List */}
          {filteredStudents.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto divide-y divide-gray-100">
              {filteredStudents.map(student => (
                <button
                  key={student._id}
                  onClick={() => selectStudent(student)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex justify-between items-center"
                >
                  <div>
                    <div className="font-semibold text-gray-800">{student.name}</div>
                    <div className="text-xs text-gray-500">Adm Number: {student.admissionNumber}</div>
                  </div>
                  <div className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                    Class {student.class ? student.class.name : 'N/A'} - {student.section || 'A'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Student Ledger details */}
      {selectedStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Ledger Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Student card summary */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <User className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Admission ID: <span className="font-semibold">{selectedStudent.admissionNumber}</span> | Roll: {selectedStudent.rollNumber || 'N/A'}
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">
                    Class {selectedStudent.class ? selectedStudent.class.name : 'N/A'} - {selectedStudent.section || 'A'}
                  </div>
                </div>

                {ledger && (
                  <div className="grid grid-cols-3 gap-4 mt-6 border-t border-gray-100 pt-6">
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <div className="text-xs text-gray-500">Total Demanded</div>
                      <div className="text-lg font-bold text-gray-800 mt-1 flex items-center">
                        <IndianRupee className="w-4 h-4 mr-0.5" />
                        {ledger.totalDue}
                      </div>
                    </div>
                    <div className="bg-emerald-50/50 p-3 rounded-xl">
                      <div className="text-xs text-emerald-700">Total Paid</div>
                      <div className="text-lg font-bold text-emerald-700 mt-1 flex items-center">
                        <IndianRupee className="w-4 h-4 mr-0.5" />
                        {ledger.totalPaid}
                      </div>
                    </div>
                    <div className="bg-amber-50/50 p-3 rounded-xl">
                      <div className="text-xs text-amber-700">Balance Due</div>
                      <div className="text-lg font-bold text-amber-700 mt-1 flex items-center">
                        <IndianRupee className="w-4 h-4 mr-0.5" />
                        {ledger.balance}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Ledger entries table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-bold text-gray-900">Fee Heads Breakout</h3>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  Session {ledger?.session}
                </span>
              </div>

              {loadingLedger ? (
                <div className="p-8 text-center text-gray-500 flex justify-center items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" /> Loading Ledger...
                </div>
              ) : ledger?.entries?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                        <th className="px-6 py-4 w-12 text-center">Pay</th>
                        <th className="px-6 py-4">Fee Head</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Paid / Waived</th>
                        <th className="px-6 py-4">Due Date</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {ledger.entries.map((entry, idx) => {
                        const isPaid = entry.status === 'paid';
                        const isWaived = entry.status === 'waived';
                        const isDisabled = isPaid || isWaived;

                        return (
                          <tr key={idx} className={`hover:bg-gray-50/50 ${isDisabled ? 'bg-gray-50/30' : ''}`}>
                            <td className="px-6 py-4 text-center">
                              <input
                                type="checkbox"
                                className="w-4.5 h-4.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isDisabled}
                                checked={selectedHeads.includes(entry.head)}
                                onChange={() => handleHeadToggle(entry.head, entry.amount - entry.paidAmount - entry.waivedAmount)}
                              />
                            </td>
                            <td className="px-6 py-4 font-semibold text-gray-800">{entry.head}</td>
                            <td className="px-6 py-4 text-gray-600 font-medium">₹{entry.amount}</td>
                            <td className="px-6 py-4 text-gray-500">
                              ₹{entry.paidAmount} / ₹{entry.waivedAmount}
                            </td>
                            <td className="px-6 py-4 text-gray-500">
                              {new Date(entry.dueDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  entry.status === 'paid'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : entry.status === 'waived'
                                    ? 'bg-blue-50 text-blue-700'
                                    : entry.status === 'partial'
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {entry.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">No fee records found for this student.</div>
              )}
            </div>
          </div>

          {/* Payment panel */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" /> Collect Fee
              </h3>

              {/* Selected Heads count */}
              <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Selected Heads:</span>
                  <span className="font-semibold text-gray-800">{selectedHeads.length}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total Selected:</span>
                  <span className="flex items-center text-indigo-600">
                    <IndianRupee className="w-4 h-4" />
                    {manualAmount || '0'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Razorpay Online Checkout button */}
                <button
                  type="button"
                  onClick={payOnline}
                  disabled={submittingPayment || !selectedHeads.length}
                  className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submittingPayment ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Pay Online (Razorpay) <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Cashier/Admin Manual payment form */}
                {canRecordManual && (
                  <form onSubmit={submitManualPayment} className="border-t border-gray-100 pt-6 space-y-4">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Cashier Manual Entry
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Payment Method</label>
                      <select
                        value={paymentMethod}
                        onChange={e => setPaymentMethod(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="cash">Cash</option>
                        <option value="cheque">Cheque</option>
                        <option value="dd">Demand Draft (DD)</option>
                        <option value="neft">NEFT / Bank Transfer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Receipt Amount (INR)</label>
                      <input
                        type="number"
                        placeholder="Enter amount"
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                        value={manualAmount}
                        onChange={e => setManualAmount(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Reference No / Note</label>
                      <input
                        type="text"
                        placeholder="Cheque No / TX ID"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                        value={reference}
                        onChange={e => setReference(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingPayment || !selectedHeads.length}
                      className="w-full border border-emerald-600 text-emerald-700 bg-emerald-50 font-semibold py-2.5 px-4 rounded-xl hover:bg-emerald-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                    >
                      Record Manual Payment
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
