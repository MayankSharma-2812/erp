import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import {
  CalendarDays,
  ClipboardCheck,
  Send,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Calendar,
  Briefcase,
  Coffee,
} from 'lucide-react';

const LEAVE_TYPES = [
  { key: 'CL', label: 'Casual Leave', color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
  { key: 'EL', label: 'Earned Leave', color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  { key: 'ML', label: 'Medical Leave', color: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-700' },
  { key: 'LOP', label: 'Loss of Pay', color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
  { key: 'OD', label: 'On Duty', color: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-700' },
  { key: 'special', label: 'Special', color: 'bg-pink-500', bg: 'bg-pink-50', text: 'text-pink-700' },
];

const STATUS_BADGE = {
  approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  rejected: 'bg-rose-50 text-rose-700 border border-rose-200',
  cancelled: 'bg-gray-100 text-gray-500 border border-gray-200',
};

const ATTENDANCE_BADGE = {
  present: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  absent: 'bg-rose-50 text-rose-700 border border-rose-200',
  half_day: 'bg-amber-50 text-amber-700 border border-amber-200',
  on_leave: 'bg-sky-50 text-sky-700 border border-sky-200',
  holiday: 'bg-purple-50 text-purple-700 border border-purple-200',
};

export default function StaffPortalPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('leaves');
  const [loading, setLoading] = useState(false);

  // ──── Leaves state ────
  const [balances, setBalances] = useState({});
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    type: 'CL',
    fromDate: '',
    toDate: '',
    days: 1,
    reason: '',
  });

  // ──── Attendance state ────
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // ──── Data fetching ────
  useEffect(() => {
    if (activeTab === 'leaves') fetchLeavesSummary();
    if (activeTab === 'attendance') fetchAttendance();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'attendance') fetchAttendance();
  }, [selectedMonth]);

  const fetchLeavesSummary = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hr/my-leaves-summary');
      if (res.data.success) {
        setBalances(res.data.data.balances || {});
        setLeaveRequests(res.data.data.requests || []);
      }
    } catch (e) {
      toast.error('Failed to load leave summary');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/hr/my-attendance?month=${selectedMonth}`);
      if (res.data.success) {
        setAttendanceStats(res.data.data.stats || null);
        setAttendanceRecords(res.data.data.records || []);
      }
    } catch (e) {
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!leaveForm.fromDate || !leaveForm.toDate || !leaveForm.reason.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      setSubmitting(true);
      const res = await api.post('/hr/leaves', {
        type: leaveForm.type,
        fromDate: leaveForm.fromDate,
        toDate: leaveForm.toDate,
        days: Number(leaveForm.days),
        reason: leaveForm.reason.trim(),
      });
      if (res.data.success) {
        toast.success('Leave application submitted successfully');
        setLeaveForm({ type: 'CL', fromDate: '', toDate: '', days: 1, reason: '' });
        fetchLeavesSummary();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit leave application');
    } finally {
      setSubmitting(false);
    }
  };

  // ──── Helper renderers ────
  const getProgressPercent = (taken, provided) => {
    if (!provided || provided === 0) return 0;
    return Math.min(Math.round((taken / provided) * 100), 100);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    return timeStr;
  };

  // ──── Render ────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Staff Portal</h1>
          <p className="text-gray-500 mt-1">
            Welcome back, {user?.name || 'Staff'}. Manage your leaves and attendance.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-2">
        <button
          onClick={() => setActiveTab('leaves')}
          className={`py-3 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'leaves'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
          }`}
        >
          <CalendarDays size={16} />
          Leaves Tracker
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`py-3 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'attendance'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
          }`}
        >
          <ClipboardCheck size={16} />
          My Attendance
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="animate-spin text-indigo-600 mb-2" size={32} />
          <span>Loading data...</span>
        </div>
      ) : (
        <>
          {/* ════════════════════════════════════════════════
              TAB 1: LEAVES TRACKER
              ════════════════════════════════════════════════ */}
          {activeTab === 'leaves' && (
            <div className="space-y-6">
              {/* Leave Balance Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {LEAVE_TYPES.map((lt) => {
                  const b = balances[lt.key] || { provided: 0, taken: 0, pending: 0, remaining: 0 };
                  const pct = getProgressPercent(b.taken, b.provided);
                  return (
                    <div
                      key={lt.key}
                      className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                            {lt.label}
                          </span>
                          <h3 className="text-2xl font-bold mt-1 text-gray-800">
                            {b.remaining}{' '}
                            <span className="text-sm font-medium text-gray-400">remaining</span>
                          </h3>
                        </div>
                        <div className={`p-3 ${lt.bg} ${lt.text} rounded-xl`}>
                          <CalendarDays className="w-5 h-5" />
                        </div>
                      </div>

                      {/* Stats row */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          Provided: <strong className="text-gray-700">{b.provided}</strong>
                        </span>
                        <span>
                          Taken: <strong className="text-gray-700">{b.taken}</strong>
                        </span>
                        <span>
                          Pending: <strong className="text-gray-700">{b.pending}</strong>
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${lt.color} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 text-right">{pct}% used</p>
                    </div>
                  );
                })}
              </div>

              {/* Leave History Table */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                  <Clock size={18} className="text-gray-400" />
                  <h2 className="text-lg font-bold text-gray-800">Leave History</h2>
                </div>
                {leaveRequests.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-sm">
                    No leave requests found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs font-semibold text-gray-400 uppercase border-b border-gray-100">
                          <th className="px-6 py-3">Type</th>
                          <th className="px-6 py-3">From</th>
                          <th className="px-6 py-3">To</th>
                          <th className="px-6 py-3">Days</th>
                          <th className="px-6 py-3">Reason</th>
                          <th className="px-6 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {leaveRequests.map((req, idx) => {
                          const typeInfo = LEAVE_TYPES.find((t) => t.key === req.type) || {
                            label: req.type,
                          };
                          return (
                            <tr key={req._id || idx} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-3 font-medium text-gray-800">
                                {typeInfo.label}
                              </td>
                              <td className="px-6 py-3 text-gray-600">{formatDate(req.fromDate)}</td>
                              <td className="px-6 py-3 text-gray-600">{formatDate(req.toDate)}</td>
                              <td className="px-6 py-3 text-gray-600">{req.days}</td>
                              <td className="px-6 py-3 text-gray-600 max-w-[200px] truncate">
                                {req.reason}
                              </td>
                              <td className="px-6 py-3">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                                    STATUS_BADGE[req.status] || STATUS_BADGE.pending
                                  }`}
                                >
                                  {req.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Apply for Leave Form */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                  <Send size={18} className="text-gray-400" />
                  <h2 className="text-lg font-bold text-gray-800">Apply for Leave</h2>
                </div>
                <form onSubmit={handleApplyLeave} className="p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Type */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Leave Type
                      </label>
                      <select
                        value={leaveForm.type}
                        onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-indigo-600"
                      >
                        {LEAVE_TYPES.map((lt) => (
                          <option key={lt.key} value={lt.key}>
                            {lt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* From Date */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        From Date
                      </label>
                      <input
                        type="date"
                        value={leaveForm.fromDate}
                        onChange={(e) => setLeaveForm({ ...leaveForm, fromDate: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-indigo-600"
                        required
                      />
                    </div>

                    {/* To Date */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={leaveForm.toDate}
                        onChange={(e) => setLeaveForm({ ...leaveForm, toDate: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-indigo-600"
                        required
                      />
                    </div>

                    {/* Days */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Days
                      </label>
                      <input
                        type="number"
                        min={0.5}
                        step={0.5}
                        value={leaveForm.days}
                        onChange={(e) => setLeaveForm({ ...leaveForm, days: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-indigo-600"
                        required
                      />
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Reason
                    </label>
                    <textarea
                      rows={3}
                      value={leaveForm.reason}
                      onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                      placeholder="Briefly describe the reason for your leave..."
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-indigo-600 resize-none"
                      required
                    />
                  </div>

                  {/* Submit */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-sm font-semibold transition flex items-center gap-2 disabled:opacity-60"
                    >
                      {submitting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                      {submitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════
              TAB 2: MY ATTENDANCE
              ════════════════════════════════════════════════ */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              {attendanceStats && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-gray-400 uppercase">Present</span>
                      <h3 className="text-2xl font-bold mt-1 text-gray-800">
                        {attendanceStats.present ?? 0}
                      </h3>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-gray-400 uppercase">Absent</span>
                      <h3 className="text-2xl font-bold mt-1 text-gray-800">
                        {attendanceStats.absent ?? 0}
                      </h3>
                    </div>
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                      <XCircle className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-gray-400 uppercase">Half Day</span>
                      <h3 className="text-2xl font-bold mt-1 text-gray-800">
                        {attendanceStats.halfDay ?? 0}
                      </h3>
                    </div>
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                      <Coffee className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-gray-400 uppercase">On Leave</span>
                      <h3 className="text-2xl font-bold mt-1 text-gray-800">
                        {attendanceStats.onLeave ?? 0}
                      </h3>
                    </div>
                    <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
                      <Briefcase className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-gray-400 uppercase">Holidays</span>
                      <h3 className="text-2xl font-bold mt-1 text-gray-800">
                        {attendanceStats.holiday ?? 0}
                      </h3>
                    </div>
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                      <Calendar className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              )}

              {/* Month Picker & Records */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck size={18} className="text-gray-400" />
                    <h2 className="text-lg font-bold text-gray-800">Attendance Records</h2>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
                    <Calendar size={16} className="text-gray-400" />
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="text-sm font-semibold text-gray-800 bg-transparent border-none focus:outline-none"
                    />
                  </div>
                </div>

                {attendanceRecords.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-sm">
                    No attendance records found for this month.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs font-semibold text-gray-400 uppercase border-b border-gray-100">
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">In Time</th>
                          <th className="px-6 py-3">Out Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {[...attendanceRecords]
                          .sort((a, b) => new Date(b.date) - new Date(a.date))
                          .map((rec, idx) => (
                            <tr key={rec._id || idx} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-3 font-medium text-gray-800">
                                {formatDate(rec.date)}
                              </td>
                              <td className="px-6 py-3">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                                    ATTENDANCE_BADGE[rec.status] || 'bg-gray-100 text-gray-500 border border-gray-200'
                                  }`}
                                >
                                  {rec.status?.replace('_', ' ') || '—'}
                                </span>
                              </td>
                              <td className="px-6 py-3 text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Clock size={14} className="text-gray-300" />
                                  {formatTime(rec.inTime)}
                                </span>
                              </td>
                              <td className="px-6 py-3 text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Clock size={14} className="text-gray-300" />
                                  {formatTime(rec.outTime)}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
