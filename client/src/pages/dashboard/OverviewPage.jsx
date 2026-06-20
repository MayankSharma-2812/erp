import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { format } from 'date-fns';
import {
  ClipboardCheck,
  IndianRupee,
  Building2,
  FileText,
  TrendingUp,
  UserCheck,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Cake,
  PartyPopper,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

// Mock data for fee collection trend (6 months)
const feeTrendData = [
  { month: 'Jan', amount: 3.2 },
  { month: 'Feb', amount: 3.8 },
  { month: 'Mar', amount: 4.5 },
  { month: 'Apr', amount: 4.0 },
  { month: 'May', amount: 5.2 },
  { month: 'Jun', amount: 4.2 },
];

// Mock data for class-wise attendance
const classAttendanceData = [
  { className: 'Class XII', percentage: 94 },
  { className: 'Class XI', percentage: 91 },
  { className: 'Class X', percentage: 88 },
  { className: 'Class IX', percentage: 85 },
  { className: 'Class VIII', percentage: 89 },
];

// Mock data for pending approvals list
const pendingApprovals = [
  { id: 1, type: 'Leave Request', student: 'Aarav Mehta (Class X)', detail: 'Sick leave - 2 days', date: 'Today, 08:30 AM' },
  { id: 2, type: 'Fee Waiver', student: 'Priya Sharma (Class XII)', detail: '10% tuition waiver request', date: 'Yesterday, 04:15 PM' },
  { id: 3, type: 'Outing Pass', student: 'Rohan Gupta (Class XI)', detail: 'Weekend home visit', date: 'Yesterday, 11:00 AM' },
];

const OverviewPage = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const currentDate = format(new Date(), 'eeee, MMMM dd, yyyy');
  const [birthdays, setBirthdays] = useState({ students: [], staff: [], total: 0 });

  useEffect(() => {
    if (user && (user.role === 'student' || user.role === 'parent')) {
      navigate('/dashboard/student', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchBirthdays = async () => {
      try {
        const res = await api.get('/reports/birthdays');
        if (res.data.success) {
          setBirthdays(res.data.data);
        }
      } catch (err) {
        // silently fail, not critical
      }
    };
    fetchBirthdays();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome & Date Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            Good morning, {user?.name || 'Dr. Rajesh Sharma'}
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Here's what's happening at Vidya School today.
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm text-xs font-semibold text-gray-600">
          <Clock className="h-4 w-4 text-indigo-600" />
          <span>{currentDate}</span>
        </div>
      </div>

      {/* 4 Stat Cards in a row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Attendance */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today's Attendance</span>
            <div className="p-2.5 rounded-xl bg-green-50 text-green-600">
              <ClipboardCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">87.3%</h3>
            <div className="flex items-center space-x-1 mt-1.5">
              <span className="text-xs font-bold text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-0.5" /> +2.1%
              </span>
              <span className="text-[10px] text-gray-400 font-medium">from last week</span>
            </div>
          </div>
        </div>

        {/* Card 2: Fee Collected */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fee Collected</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">₹4.2L</h3>
            <div className="flex items-center space-x-1 mt-1.5">
              <span className="text-xs font-bold text-indigo-600 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-0.5" /> 84%
              </span>
              <span className="text-[10px] text-gray-400 font-medium">target achieved</span>
            </div>
          </div>
        </div>

        {/* Card 3: Hostel Occupancy */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hostel Occupancy</span>
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">94%</h3>
            <div className="flex items-center space-x-1 mt-1.5">
              <span className="text-[10px] text-gray-500 font-semibold">470 / 500 Beds Occupied</span>
            </div>
          </div>
        </div>

        {/* Card 4: Upcoming Exam */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Upcoming Exam</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">12 Days</h3>
            <div className="flex items-center space-x-1 mt-1.5">
              <span className="text-xs font-bold text-amber-600">Half Yearly</span>
              <span className="text-[10px] text-gray-400 font-medium">starts June 27</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fee Collection Trend - 6 Months */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
            <h2 className="text-sm font-bold text-gray-900 tracking-wide">Fee Collection Trend (Lakhs)</h2>
            <span className="text-xs font-semibold text-gray-400 uppercase">Last 6 Months</span>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feeTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: '#F9FAFB' }}
                  contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="amount" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={32}>
                  {feeTrendData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 4 ? '#4F46E5' : '#818CF8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Class-wise Attendance */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
            <h2 className="text-sm font-bold text-gray-900 tracking-wide">Attendance by Class</h2>
            <span className="text-xs font-semibold text-gray-400 uppercase">Today</span>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classAttendanceData} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                <XAxis type="number" domain={[0, 100]} stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis dataKey="className" type="category" stroke="#111827" fontSize={11} tickLine={false} axisLine={false} width={80} />
                <Tooltip
                  contentStyle={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="percentage" fill="#16A34A" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pending Approvals Row */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <h2 className="text-sm font-bold text-gray-900 tracking-wide">Pending Approvals Queue</h2>
          <span className="px-2.5 py-1 text-[10px] font-bold bg-amber-50 text-amber-700 rounded-full">3 Action Required</span>
        </div>
        <div className="divide-y divide-gray-100">
          {pendingApprovals.map((item) => (
            <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-gray-50 text-gray-500 border border-gray-100 mt-0.5">
                  {item.type === 'Leave Request' && <UserCheck className="h-5 w-5 text-indigo-500" />}
                  {item.type === 'Fee Waiver' && <IndianRupee className="h-5 w-5 text-green-500" />}
                  {item.type === 'Outing Pass' && <Building2 className="h-5 w-5 text-amber-500" />}
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-400 capitalize">{item.type}</span>
                  <h4 className="text-sm font-bold text-gray-900 mt-0.5">{item.student}</h4>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{item.detail}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 sm:self-center">
                <span className="text-[10px] text-gray-400 font-semibold hidden md:block">{item.date}</span>
                <button
                  onClick={() => toast.success('Request approved successfully')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => toast.error('Request rejected')}
                  className="px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  <XCircle className="h-3.5 w-3.5 text-gray-400" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Birthdays Widget */}
      {birthdays.total > 0 && (
        <div className="bg-gradient-to-br from-amber-50 via-pink-50 to-purple-50 p-6 rounded-2xl border border-pink-200/60 shadow-sm animate-in fade-in duration-500">
          <div className="flex items-center justify-between border-b border-pink-100 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-pink-100 rounded-xl">
                <Cake className="h-5 w-5 text-pink-600" />
              </div>
              <h2 className="text-sm font-bold text-gray-900 tracking-wide">Today's Birthdays 🎂</h2>
            </div>
            <span className="px-3 py-1 text-[10px] font-bold bg-pink-100 text-pink-700 rounded-full">
              {birthdays.total} Celebration{birthdays.total > 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {birthdays.students.map((s) => (
              <div key={s._id} className="flex items-center gap-3 bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-pink-100/50 hover:shadow-md transition-all duration-200">
                <div className="p-2 bg-gradient-to-br from-pink-400 to-rose-500 text-white rounded-full flex-shrink-0">
                  <Cake className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-800">{s.name}</div>
                  <div className="text-[10px] text-gray-500 font-medium">{s.className} {s.section ? `- ${s.section}` : ''} · Student</div>
                </div>
              </div>
            ))}
            {birthdays.staff.map((s) => (
              <div key={s._id} className="flex items-center gap-3 bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-purple-100/50 hover:shadow-md transition-all duration-200">
                <div className="p-2 bg-gradient-to-br from-purple-400 to-indigo-500 text-white rounded-full flex-shrink-0">
                  <Cake className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-800">{s.name}</div>
                  <div className="text-[10px] text-gray-500 font-medium capitalize">{s.role?.replace(/_/g, ' ')} · Staff</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewPage;
