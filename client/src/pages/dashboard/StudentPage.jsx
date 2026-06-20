import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import {
  User,
  GraduationCap,
  Calendar,
  IndianRupee,
  Building2,
  Coffee,
  HeartPulse,
  Clock,
  BookMarked,
  Printer,
  ChevronRight,
  ClipboardCheck,
  CheckCircle,
  Download,
} from 'lucide-react';

export default function StudentPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');

  // Student Profile, Ledger, Timetable, Outings, Clinic visits
  const [student, setStudent] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [timetable, setTimetable] = useState({});
  const [outings, setOutings] = useState([]);
  const [clinicVisits, setClinicVisits] = useState([]);
  const [syllabus, setSyllabus] = useState([]);
  const [attendanceData, setAttendanceData] = useState({ stats: null, records: [] });
  const [messMenu, setMessMenu] = useState({});
  
  // loading
  const [loading, setLoading] = useState(true);
  const [submittingOuting, setSubmittingOuting] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Outing Request inputs
  const [newOuting, setNewOuting] = useState({
    destination: '',
    purpose: '',
    departDate: '',
    returnDate: '',
    contactDuring: '',
  });

  // selected fee heads to pay online
  const [selectedHeads, setSelectedHeads] = useState([]);
  const [amountToPay, setAmountToPay] = useState(0);

  // Mess Menu week start
  const [weekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  });

  useEffect(() => {
    if (user && user.studentProfile) {
      fetchStudentData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Fetch attendance when attendance tab is active
  useEffect(() => {
    if (activeTab === 'attendance' && user?.studentProfile) {
      fetchAttendanceData();
    }
  }, [activeTab]);

  const fetchAttendanceData = async () => {
    try {
      const res = await axios.get('/attendance/my-attendance');
      if (res.data.success) {
        setAttendanceData({
          stats: res.data.data.stats,
          records: res.data.data.records || [],
        });
      }
    } catch (err) {
      toast.error('Failed to load attendance data');
    }
  };

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const studentId = user.studentProfile;
      
      // 1. Fetch Student Profile
      const studentRes = await axios.get(`/students/${studentId}`);
      if (studentRes.data.success) {
        setStudent(studentRes.data.data);
        const classId = studentRes.data.data.class?._id;
        const section = studentRes.data.data.section;
        const session = studentRes.data.data.session || '2025-26';

        // 2. Fetch Fee Ledger
        const ledgerRes = await axios.get(`/finance/ledger/student/${studentId}`);
        if (ledgerRes.data.success) setLedger(ledgerRes.data.data);

        // 3. Fetch Timetable if classId exists
        if (classId) {
          const timetableRes = await axios.get(`/academics/timetable?classId=${classId}&section=${section}`);
          if (timetableRes.data.success) {
            // Group slots by day
            const grouped = {};
            timetableRes.data.data.forEach(slot => {
              if (!grouped[slot.day]) grouped[slot.day] = {};
              grouped[slot.day][slot.period] = slot;
            });
            setTimetable(grouped);
          }

          // 4. Fetch Syllabus progress
          const syllabusRes = await axios.get(`/academics/syllabus?classId=${classId}`);
          if (syllabusRes.data.success) setSyllabus(syllabusRes.data.data);
        }

        // 5. Fetch Outings
        const outingRes = await axios.get(`/hostel/outings?studentId=${studentId}`);
        if (outingRes.data.success) setOutings(outingRes.data.data);

        // 6. Fetch Medical Clinic visits
        const medicalRes = await axios.get(`/health/visits?studentId=${studentId}`);
        if (medicalRes.data.success) setClinicVisits(medicalRes.data.data);

        // 7. Fetch Mess Menu
        const menuRes = await axios.get(`/hostel/mess/menu?weekStartDate=${weekStart}`);
        if (menuRes.data.success && menuRes.data.data && menuRes.data.data.menu) {
          const menuObj = {};
          menuRes.data.data.menu.forEach(item => {
            menuObj[item.day] = item;
          });
          setMessMenu(menuObj);
        }
      }
    } catch (e) {
      toast.error('Failed to sync student dashboard info');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadICard = () => {
    const token = useAuthStore.getState().accessToken;
    window.open(`/api/v1/students/${user.studentProfile}/icard?token=${token}`, '_blank');
    toast.success('I-Card opened in new tab!');
  };

  const handleApplyOuting = async (e) => {
    e.preventDefault();
    setSubmittingOuting(true);
    try {
      const res = await axios.post('/hostel/outings', {
        ...newOuting,
        studentId: user.studentProfile,
      });
      if (res.data.success) {
        toast.success('Outing request submitted successfully');
        setNewOuting({ destination: '', purpose: '', departDate: '', returnDate: '', contactDuring: '' });
        // Refresh outings list
        const outingRes = await axios.get(`/hostel/outings?studentId=${user.studentProfile}`);
        if (outingRes.data.success) setOutings(outingRes.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit outing request');
    } finally {
      setSubmittingOuting(false);
    }
  };

  const handleHeadToggle = (headName, amount) => {
    if (selectedHeads.includes(headName)) {
      setSelectedHeads(prev => prev.filter(h => h !== headName));
      setAmountToPay(prev => Math.max(0, prev - amount));
    } else {
      setSelectedHeads(prev => [...prev, headName]);
      setAmountToPay(prev => prev + amount);
    }
  };

  const handlePayOnline = async () => {
    if (!selectedHeads.length) {
      toast.warning('Please select at least one fee head to pay.');
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await axios.post('/finance/razorpay/order', {
        studentId: user.studentProfile,
        amount: amountToPay,
        heads: selectedHeads,
        session: ledger.session,
      });

      if (res.data && res.data.success) {
        const orderData = res.data.data;

        // Load Razorpay Script
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
            description: `Payment for: ${selectedHeads.join(', ')}`,
            order_id: orderData.orderId,
            handler: async (response) => {
              try {
                // Verify payment on webhook/server
                const verifyRes = await axios.post('/finance/razorpay/webhook', {
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  // webhook payload simulation
                  payload: {
                    payment: {
                      entity: {
                        order_id: response.razorpay_order_id,
                        status: 'captured',
                        amount: orderData.amount,
                      }
                    }
                  }
                });

                if (verifyRes.data) {
                  toast.success('Payment completed successfully!');
                  setSelectedHeads([]);
                  setAmountToPay(0);
                  fetchStudentData(); // Reload ledger
                }
              } catch (verifyErr) {
                toast.error('Payment verification failed.');
              }
            },
            prefill: {
              name: student?.name,
              email: user.email,
            },
            theme: { color: '#ec4899' }, // Student Portal pink accent
          };

          const rzp = new window.Razorpay(rzpOptions);
          rzp.open();
        };
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate Razorpay checkout');
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-gray-500 font-semibold">
        Syncing Student Portal...
      </div>
    );
  }

  if (!user || !user.studentProfile) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm text-center">
        <h2 className="text-xl font-bold text-red-600">Access Restricted</h2>
        <p className="text-gray-500 mt-2">This portal is only accessible by active boarding students.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className={`p-6 bg-gradient-to-r ${user.role === 'parent' ? 'from-emerald-500 to-teal-500' : 'from-pink-500 to-rose-500'} rounded-3xl text-white shadow-md flex justify-between items-center`}>
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-sans">
            {user.role === 'parent' ? `Hello, Parent of ${student?.name}!` : `Hello, ${student?.name}!`}
          </h1>
          <p className="opacity-90 text-sm">
            {user.role === 'parent' ? 'Welcome to your VidyaERP parent portal.' : 'Welcome to your VidyaERP student dashboard portal.'}
          </p>
        </div>
        <div className="p-3 bg-white/20 rounded-full">
          <GraduationCap className="w-10 h-10" />
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-gray-200 gap-6 overflow-x-auto">
        {[
          { key: 'overview', label: 'Dashboard Overview', icon: User },
          { key: 'fees', label: 'Fees & Payments', icon: IndianRupee },
          { key: 'timetable', label: 'Weekly Timetable', icon: Calendar },
          { key: 'hostel', label: 'Hostel & Outings', icon: Building2 },
          { key: 'attendance', label: 'Attendance', icon: ClipboardCheck },
          { key: 'health', label: 'Medical History', icon: HeartPulse },
        ].map(tab => {
          const activeColor = user.role === 'parent' ? 'border-emerald-500 text-emerald-600' : 'border-pink-500 text-pink-600';
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                activeTab === tab.key
                  ? activeColor
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TABS CONTENT */}

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {/* Student Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
              <User className="w-5 h-5 text-pink-500" /> Academic Profile
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Admission No:</span> <span className="font-semibold">{student?.admissionNumber}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Roll Number:</span> <span className="font-semibold">{student?.rollNumber || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Class & Sec:</span> <span className="font-semibold">{student?.class?.name} - {student?.section}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Session Year:</span> <span className="font-semibold">{student?.session}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Boarding Resident:</span> <span className={`px-2 py-0.5 rounded text-xs font-bold ${student?.isBoarding ? 'bg-teal-50 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>{student?.isBoarding ? 'Yes' : 'No'}</span></div>
            </div>
            <button
              onClick={handleDownloadICard}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-xl text-sm font-bold transition border border-pink-200"
            >
              <Download className="w-4 h-4" /> Download Identity Card
            </button>
          </div>

          {/* Fees Stats */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-pink-500" /> Fee Summary
            </h3>
            {ledger ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Total Demanded:</span> <span className="font-bold text-gray-800">₹{ledger.totalDue.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Total Paid:</span> <span className="font-bold text-green-600">₹{ledger.totalPaid.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between border-t pt-2 mt-2"><span className="text-gray-700 font-semibold">Outstanding Balance:</span> <span className="font-bold text-red-600 text-base">₹{ledger.balance.toLocaleString('en-IN')}</span></div>
              </div>
            ) : (
              <div className="text-sm text-gray-400 py-6 text-center">No fee ledger details found.</div>
            )}
          </div>

          {/* Library and Transport */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-pink-500" /> Operations Overview
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Library Card No:</span> <span className="font-semibold">{student?.libraryCardNo || 'Not Issued'}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Transport Allocation:</span> <span className="font-semibold">{student?.transportRoute ? 'Allocated Route' : 'Self Arranged'}</span></div>
            </div>
          </div>

          {/* Syllabus tracker */}
          <div className="col-span-1 md:col-span-3 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Your Class Syllabus Progress</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {syllabus.map(topic => (
                <div key={topic._id} className="p-3 bg-gray-50 rounded-xl flex justify-between items-center">
                  <div>
                    <div className="font-bold text-gray-700">{topic.topic}</div>
                    <div className="text-xs text-gray-400">Subject Order: {topic.order}</div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-semibold uppercase ${
                    topic.status === 'completed' ? 'bg-green-50 text-green-700' : topic.status === 'in_progress' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {topic.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
              {syllabus.length === 0 && (
                <div className="col-span-2 text-sm text-gray-400 py-4 text-center">No syllabus topics scheduled.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FEES & ONLINE PAYMENTS */}
      {activeTab === 'fees' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h3 className="font-bold text-lg text-gray-800 font-sans">Your Fees Ledger</h3>
              <p className="text-xs text-gray-400">Select pending heads and checkout online securely using Razorpay.</p>
            </div>
            {amountToPay > 0 && (
              <button
                onClick={handlePayOnline}
                disabled={submittingPayment}
                className="px-6 py-2.5 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-200 text-white rounded-xl text-sm font-bold transition shadow-sm"
              >
                {submittingPayment ? 'Processing...' : `Pay Online: ₹${amountToPay.toLocaleString('en-IN')}`}
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-200">
                  <th className="px-6 py-4 w-12">Pay</th>
                  <th className="px-6 py-4">Fee Head</th>
                  <th className="px-6 py-4 text-right">Demanded</th>
                  <th className="px-6 py-4 text-right">Paid</th>
                  <th className="px-6 py-4 text-right">Waived</th>
                  <th className="px-6 py-4 text-right">Remaining</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {ledger?.entries.map((entry, index) => {
                  const remaining = entry.amount - entry.paidAmount - entry.waivedAmount;
                  const isPending = remaining > 0;
                  return (
                    <tr key={index} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        {isPending ? (
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-pink-500 accent-pink-500 focus:ring-pink-500 rounded border-gray-300"
                            checked={selectedHeads.includes(entry.head)}
                            onChange={() => handleHeadToggle(entry.head, remaining)}
                          />
                        ) : (
                          <span className="text-green-600"><CheckCircle className="w-4 h-4" /></span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-800">{entry.head}</td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-700">₹{entry.amount.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-right text-green-600">₹{entry.paidAmount.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-right text-amber-500">₹{entry.waivedAmount.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">₹{remaining.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(entry.dueDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                          entry.status === 'paid' ? 'bg-green-50 text-green-700' : entry.status === 'waived' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TIMETABLE GRID */}
      {activeTab === 'timetable' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-lg text-gray-800">Your Weekly Schedule Grid</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-200">
                  <th className="px-4 py-3">Day / Period</th>
                  {[1, 2, 3, 4, 5, 6].map(p => (
                    <th key={p} className="px-4 py-3">Period {p}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                  <tr key={day}>
                    <td className="px-4 py-4 font-bold text-gray-700 bg-gray-50/50">{day}</td>
                    {[1, 2, 3, 4, 5, 6].map(period => {
                      const slot = timetable[day] && timetable[day][period];
                      return (
                        <td key={period} className="px-2 py-4">
                          {slot ? (
                            <div className="p-2 bg-pink-50 border border-pink-100 rounded-xl space-y-0.5">
                              <div className="font-bold text-pink-700 text-xs">{slot.subject?.name}</div>
                              <div className="text-2xs text-pink-500 font-semibold">{slot.startTime} - {slot.endTime}</div>
                              <div className="text-2xs text-gray-400 font-medium">Room {slot.roomNo}</div>
                            </div>
                          ) : (
                            <span className="text-gray-300 text-xs">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* HOSTEL & OUTINGS */}
      {activeTab === 'hostel' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Outing Form */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4 h-fit">
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Apply for Outing Gate Pass</h3>
            <form onSubmit={handleApplyOuting} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Destination</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-xl p-2 mt-1 text-sm focus:outline-pink-500"
                  value={newOuting.destination}
                  onChange={e => setNewOuting({ ...newOuting, destination: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Purpose</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-xl p-2 mt-1 text-sm focus:outline-pink-500"
                  value={newOuting.purpose}
                  onChange={e => setNewOuting({ ...newOuting, purpose: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Contact Number during outing</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-xl p-2 mt-1 text-sm focus:outline-pink-500"
                  value={newOuting.contactDuring}
                  onChange={e => setNewOuting({ ...newOuting, contactDuring: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Departure Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full border border-gray-300 rounded-xl p-2 mt-1 text-sm focus:outline-pink-500"
                  value={newOuting.departDate}
                  onChange={e => setNewOuting({ ...newOuting, departDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Return Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full border border-gray-300 rounded-xl p-2 mt-1 text-sm focus:outline-pink-500"
                  value={newOuting.returnDate}
                  onChange={e => setNewOuting({ ...newOuting, returnDate: e.target.value })}
                />
              </div>
              <button
                type="submit"
                disabled={submittingOuting}
                className="w-full py-2 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-200 text-white rounded-xl text-sm font-bold transition"
              >
                {submittingOuting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>

          {/* Outings log */}
          <div className="col-span-1 md:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Your Outing Requests History</h3>
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {outings.map(o => (
                <div key={o._id} className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center border border-gray-100">
                  <div className="space-y-1">
                    <div className="font-bold text-gray-700">{o.destination}</div>
                    <div className="text-xs text-gray-400">Purpose: {o.purpose}</div>
                    <div className="text-2xs text-gray-400">
                      Out: {new Date(o.departDate).toLocaleString()} | In: {new Date(o.returnDate).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase ${
                      o.status === 'approved' ? 'bg-green-50 text-green-700' : o.status === 'pending' ? 'bg-amber-50 text-amber-700' : o.status === 'returned' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {o.status}
                    </span>
                    {o.approvedBy && (
                      <div className="text-3xs text-gray-400 mt-1">Authorized by {o.approvedBy?.name} ({o.approvalLevel})</div>
                    )}
                  </div>
                </div>
              ))}
              {outings.length === 0 && (
                <div className="text-sm text-gray-400 py-12 text-center">No outing requests registered.</div>
              )}
            </div>
          </div>

          {/* Weekly Mess Menu */}
          <div className="col-span-1 md:col-span-3 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
              <Coffee className="w-5 h-5 text-pink-500" /> Weekly Mess Menu
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                const dayMenu = messMenu[day];
                return (
                  <div key={day} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs space-y-2">
                    <div className="font-extrabold text-pink-500 uppercase text-center border-b pb-1 mb-1">{day}</div>
                    <div><span className="font-bold text-gray-500">B:</span> {dayMenu?.breakfast || 'Not Set'}</div>
                    <div><span className="font-bold text-gray-500">L:</span> {dayMenu?.lunch || 'Not Set'}</div>
                    <div><span className="font-bold text-gray-500">S:</span> {dayMenu?.eveningSnack || 'Not Set'}</div>
                    <div><span className="font-bold text-gray-500">D:</span> {dayMenu?.dinner || 'Not Set'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* HEALTH & CLINIC VISITS */}
      {activeTab === 'health' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4 h-fit">
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Your Medical File</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Blood Group:</span> <span className="font-bold text-pink-600">O+ (Sample)</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Known Allergies:</span> <span className="font-semibold text-gray-700">None (Sample)</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Chronic Conditions:</span> <span className="font-semibold text-gray-700">None (Sample)</span></div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Clinic Log History</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {clinicVisits.map(visit => (
                <div key={visit._id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="font-bold text-gray-800">Complaint: {visit.complaint}</div>
                    <div className="text-xs text-gray-600">
                      <span className="font-semibold text-gray-700">Diagnosis:</span> {visit.diagnosis}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="font-semibold">Treatment:</span> {visit.treatment}
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-400 font-semibold">
                    {new Date(visit.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {clinicVisits.length === 0 && (
                <div className="text-sm text-gray-400 py-12 text-center">No clinic visit records found.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Stat Cards */}
          {attendanceData.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: 'Attendance Rate', value: `${attendanceData.stats.attendanceRate ?? 0}%`, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                { label: 'Present Days', value: attendanceData.stats.present ?? 0, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
                { label: 'Absent Days', value: attendanceData.stats.absent ?? 0, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
                { label: 'Late Days', value: attendanceData.stats.late ?? 0, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
                { label: 'Leave Days', value: attendanceData.stats.leave ?? 0, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
              ].map(stat => (
                <div key={stat.label} className={`${stat.bg} border ${stat.border} rounded-2xl p-5 text-center space-y-1`}>
                  <div className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Recent Attendance Records */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-pink-500" /> Recent Attendance (Last 90 Days)
            </h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {attendanceData.records.length > 0 ? (
                attendanceData.records.slice(0, 90).map((record, idx) => {
                  const statusColors = {
                    present: 'bg-green-50 text-green-700 border-green-200',
                    absent: 'bg-red-50 text-red-700 border-red-200',
                    late: 'bg-amber-50 text-amber-700 border-amber-200',
                    leave: 'bg-blue-50 text-blue-700 border-blue-200',
                    holiday: 'bg-purple-50 text-purple-700 border-purple-200',
                  };
                  const colorClass = statusColors[record.status] || 'bg-gray-50 text-gray-600 border-gray-200';
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <span className="text-sm font-semibold text-gray-700">
                        {new Date(record.date).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                      <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase border ${colorClass}`}>
                        {record.status}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-gray-400 py-12 text-center">No attendance records found.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
