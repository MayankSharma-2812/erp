import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import {
  Users,
  ClipboardCheck,
  Calendar,
  IndianRupee,
  PlusCircle,
  FileText,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Edit,
  Download,
  Send,
  Lock,
} from 'lucide-react';

export default function HrPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');

  // Roster, Attendance, Leaves
  const [staffList, setStaffList] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [staffAttendance, setStaffAttendance] = useState({});
  const [leaves, setLeaves] = useState([]);
  
  // Payroll Runs
  const [payrollRuns, setPayrollRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [runDetails, setRunDetails] = useState([]);

  // Forms and expansion
  const [showApplyLeave, setShowApplyLeave] = useState(false);
  const [showInitiateRun, setShowInitiateRun] = useState(false);
  const [showEditPayslip, setShowEditPayslip] = useState(false);

  // Form Inputs
  const [newLeave, setNewLeave] = useState({
    type: 'CL',
    fromDate: '',
    toDate: '',
    days: 1,
    reason: '',
  });
  const [newRunMonth, setNewRunMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [editingPayslip, setEditingPayslip] = useState(null);

  useEffect(() => {
    fetchStaff();
    fetchLeaves();
    fetchPayrollRuns();
  }, []);

  useEffect(() => {
    if (staffList.length > 0) {
      fetchStaffAttendance();
    }
  }, [attendanceDate, staffList]);

  const fetchStaff = async () => {
    try {
      const res = await axios.get('/users');
      if (res.data.success) {
        setStaffList(res.data.data.filter(u => u.isActive));
      }
    } catch (e) {
      toast.error('Failed to load staff list');
    }
  };

  const fetchStaffAttendance = async () => {
    try {
      const res = await axios.get(`/hr/attendance?date=${attendanceDate}`);
      if (res.data.success) {
        const attObj = {};
        res.data.data.forEach(record => {
          if (record.staff) {
            attObj[record.staff._id] = record.status;
          }
        });
        setStaffAttendance(attObj);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeaves = async () => {
    try {
      const res = await axios.get('/hr/leaves');
      if (res.data.success) setLeaves(res.data.data);
    } catch (e) {
      toast.error('Failed to load leave requests');
    }
  };

  const fetchPayrollRuns = async () => {
    try {
      const res = await axios.get('/hr/payroll/runs');
      if (res.data.success) setPayrollRuns(res.data.data);
    } catch (e) {
      toast.error('Failed to load payroll runs');
    }
  };

  const handleMarkAttendance = async (staffId, status) => {
    try {
      const res = await axios.post('/hr/attendance', {
        staffId,
        date: attendanceDate,
        status,
      });
      if (res.data.success) {
        toast.success('Attendance updated');
        fetchStaffAttendance();
      }
    } catch (err) {
      toast.error('Failed to mark staff attendance');
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/hr/leaves', newLeave);
      if (res.data.success) {
        toast.success('Leave applied successfully');
        setShowApplyLeave(false);
        setNewLeave({ type: 'CL', fromDate: '', toDate: '', days: 1, reason: '' });
        fetchLeaves();
      }
    } catch (err) {
      toast.error('Failed to submit leave request');
    }
  };

  const handleApproveLeave = async (id, status) => {
    try {
      const res = await axios.post(`/hr/leaves/${id}/approve`, { status });
      if (res.data.success) {
        toast.success(`Leave request ${status}`);
        fetchLeaves();
      }
    } catch (err) {
      toast.error('Failed to process leave approval');
    }
  };

  const handleInitiatePayrollRun = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/hr/payroll/run', { month: newRunMonth });
      if (res.data.success) {
        toast.success('Payroll run compiled successfully as draft!');
        setShowInitiateRun(false);
        fetchPayrollRuns();
        // Load the new run immediately
        const runId = res.data.data.run._id;
        handleSelectRun(runId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payroll run');
    }
  };

  const handleSelectRun = async (id) => {
    try {
      const res = await axios.get(`/hr/payroll/runs/${id}`);
      if (res.data.success) {
        setSelectedRun(res.data.data.run);
        setRunDetails(res.data.data.payslips);
        setActiveTab('payrollDetail');
      }
    } catch (err) {
      toast.error('Failed to load payroll details');
    }
  };

  const handleOpenEditPayslip = (payslip) => {
    setEditingPayslip({
      _id: payslip._id,
      basicSalary: payslip.basicSalary,
      da: payslip.da,
      hra: payslip.hra,
      otherAllowances: payslip.otherAllowances,
      pfDeduction: payslip.pfDeduction,
      esiDeduction: payslip.esiDeduction,
      tdsDeduction: payslip.tdsDeduction,
      staffName: payslip.staff?.name,
    });
    setShowEditPayslip(true);
  };

  const handleSavePayslipEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`/hr/payroll/runs/${selectedRun._id}/payslips/${editingPayslip._id}`, editingPayslip);
      if (res.data.success) {
        toast.success('Payslip adjusted successfully');
        setShowEditPayslip(false);
        setEditingPayslip(null);
        // Refresh run details
        handleSelectRun(selectedRun._id);
      }
    } catch (err) {
      toast.error('Failed to update payslip');
    }
  };

  const handleSubmitPayroll = async (id) => {
    try {
      const res = await axios.post(`/hr/payroll/runs/${id}/submit`);
      if (res.data.success) {
        toast.success('Payroll run submitted to Principal for co-authorization');
        handleSelectRun(id);
        fetchPayrollRuns();
      }
    } catch (err) {
      toast.error('Submission failed');
    }
  };

  const handleApprovePayroll = async (id) => {
    try {
      const res = await axios.post(`/hr/payroll/runs/${id}/approve`);
      if (res.data.success) {
        toast.success('Payroll run co-authorized successfully');
        handleSelectRun(id);
        fetchPayrollRuns();
      }
    } catch (err) {
      toast.error('Approval failed');
    }
  };

  const handleDisbursePayroll = async (id) => {
    try {
      const res = await axios.post(`/hr/payroll/runs/${id}/disburse`);
      if (res.data.success) {
        toast.success('Payroll disbursed successfully! Payslips generated.');
        handleSelectRun(id);
        fetchPayrollRuns();
      }
    } catch (err) {
      toast.error('Disbursement failed');
    }
  };

  // Calculations
  const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
  const isPrincipal = ['principal', 'vice_principal'].includes(user.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-sans">HR & Payroll</h1>
          <p className="text-gray-500">Manage staff attendance, leave approvals, monthly payroll computations and payslips.</p>
        </div>
        
        <div className="flex gap-2">
          {user.role === 'hr_manager' && (
            <button
              onClick={() => setShowInitiateRun(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> Run Payroll
            </button>
          )}
          <button
            onClick={() => setShowApplyLeave(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition"
          >
            Apply Leave
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6 overflow-x-auto">
        {[
          { key: 'overview', label: 'Overview', icon: Users },
          { key: 'attendance', label: 'Staff Attendance', icon: ClipboardCheck },
          { key: 'leaves', label: 'Leaves Registry', icon: Calendar },
          { key: 'payroll', label: 'Payroll processing', icon: IndianRupee },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* MODALS */}
      {showApplyLeave && (
        <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Apply Leave Request</h2>
          <form onSubmit={handleApplyLeave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Leave Type</label>
              <select
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                value={newLeave.type}
                onChange={e => setNewLeave({ ...newLeave, type: e.target.value })}
              >
                <option value="CL">Casual Leave (CL)</option>
                <option value="EL">Earned Leave (EL)</option>
                <option value="ML">Medical Leave (ML)</option>
                <option value="LOP">Loss of Pay (LOP)</option>
                <option value="OD">On Duty (OD)</option>
                <option value="special">Special Leave</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Number of Days</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                value={newLeave.days}
                onChange={e => setNewLeave({ ...newLeave, days: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">From Date</label>
              <input
                type="date"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                value={newLeave.fromDate}
                onChange={e => setNewLeave({ ...newLeave, fromDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">To Date</label>
              <input
                type="date"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                value={newLeave.toDate}
                onChange={e => setNewLeave({ ...newLeave, toDate: e.target.value })}
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-600 mb-1">Reason for Leave</label>
              <textarea
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                rows="3"
                value={newLeave.reason}
                onChange={e => setNewLeave({ ...newLeave, reason: e.target.value })}
              />
            </div>
            <div className="col-span-1 md:col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowApplyLeave(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition"
              >
                Submit Request
              </button>
            </div>
          </form>
        </div>
      )}

      {showInitiateRun && (
        <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Initiate Monthly Payroll run</h2>
          <form onSubmit={handleInitiatePayrollRun} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-600 mb-1">Select Month (YYYY-MM)</label>
              <input
                type="month"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                value={newRunMonth}
                onChange={e => setNewRunMonth(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowInitiateRun(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition"
              >
                Compile Payroll Run
              </button>
            </div>
          </form>
        </div>
      )}

      {showEditPayslip && editingPayslip && (
        <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-md space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Adjust Draft Payslip: {editingPayslip.staffName}</h2>
          <form onSubmit={handleSavePayslipEdit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Basic Salary</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg p-2 mt-1 text-sm focus:outline-indigo-600"
                value={editingPayslip.basicSalary}
                onChange={e => setEditingPayslip({ ...editingPayslip, basicSalary: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">DA Allow.</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg p-2 mt-1 text-sm focus:outline-indigo-600"
                value={editingPayslip.da}
                onChange={e => setEditingPayslip({ ...editingPayslip, da: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">HRA Allow.</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg p-2 mt-1 text-sm focus:outline-indigo-600"
                value={editingPayslip.hra}
                onChange={e => setEditingPayslip({ ...editingPayslip, hra: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">Other Allow.</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg p-2 mt-1 text-sm focus:outline-indigo-600"
                value={editingPayslip.otherAllowances}
                onChange={e => setEditingPayslip({ ...editingPayslip, otherAllowances: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">PF Deduct.</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg p-2 mt-1 text-sm focus:outline-indigo-600"
                value={editingPayslip.pfDeduction}
                onChange={e => setEditingPayslip({ ...editingPayslip, pfDeduction: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">ESI Deduct.</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg p-2 mt-1 text-sm focus:outline-indigo-600"
                value={editingPayslip.esiDeduction}
                onChange={e => setEditingPayslip({ ...editingPayslip, esiDeduction: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase">TDS Tax</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg p-2 mt-1 text-sm focus:outline-indigo-600"
                value={editingPayslip.tdsDeduction}
                onChange={e => setEditingPayslip({ ...editingPayslip, tdsDeduction: parseInt(e.target.value) })}
              />
            </div>
            <div className="col-span-1 md:col-span-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowEditPayslip(false); setEditingPayslip(null); }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase">Active Staff Roster</span>
                <h3 className="text-2xl font-bold mt-1 text-gray-800">{staffList.length} Staff</h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase">Pending Leaves</span>
                <h3 className="text-2xl font-bold mt-1 text-gray-800">{pendingLeaves} Requests</h3>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
            <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase">Active Run Month</span>
                <h3 className="text-2xl font-bold mt-1 text-gray-800">
                  {payrollRuns[0] ? payrollRuns[0].month : 'None'}
                </h3>
              </div>
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                <IndianRupee className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-800 font-sans">Current Staff Directory</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-200">
                    <th className="px-6 py-3">Employee Name</th>
                    <th className="px-6 py-3">Email Address</th>
                    <th className="px-6 py-3">Designation / Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {staffList.map(staff => (
                    <tr key={staff._id}>
                      <td className="px-6 py-4 font-semibold text-gray-800">{staff.name}</td>
                      <td className="px-6 py-4 text-gray-500">{staff.email}</td>
                      <td className="px-6 py-4">
                        <span className="capitalize px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-600">
                          {staff.role.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STAFF ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h3 className="font-bold text-lg text-gray-800 font-sans">Mark daily Staff Attendance</h3>
            <input
              type="date"
              className="border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
              value={attendanceDate}
              onChange={e => setAttendanceDate(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto animate-in fade-in duration-300">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-200">
                  <th className="px-6 py-3">Employee</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {staffList.map(staff => (
                  <tr key={staff._id}>
                    <td className="px-6 py-4 font-semibold text-gray-800">{staff.name}</td>
                    <td className="px-6 py-4 capitalize text-gray-500">{staff.role.replace('_', ' ')}</td>
                    <td className="px-6 py-4">
                      {staffAttendance[staff._id] ? (
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                          staffAttendance[staff._id] === 'present'
                            ? 'bg-green-50 text-green-700'
                            : staffAttendance[staff._id] === 'absent'
                            ? 'bg-red-50 text-red-700'
                            : staffAttendance[staff._id] === 'half_day'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                          {staffAttendance[staff._id]}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs font-bold">Unmarked</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.role === 'hr_manager' ? (
                        <div className="flex justify-end gap-1">
                          {['present', 'absent', 'half_day', 'on_leave'].map(status => (
                            <button
                              key={status}
                              onClick={() => handleMarkAttendance(staff._id, status)}
                              className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-2xs font-bold border border-gray-200 capitalize"
                            >
                              {status.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-2xs flex items-center justify-end gap-1"><Lock className="w-3.5 h-3.5" /> Read-only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LEAVES REGISTRY */}
      {activeTab === 'leaves' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-bold text-lg text-gray-800 font-sans">Leaves Registry & Requests</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-200">
                  <th className="px-6 py-4">Staff Member</th>
                  <th className="px-6 py-4">Leave Type & Reason</th>
                  <th className="px-6 py-4">From / To Dates</th>
                  <th className="px-6 py-4">Total Days</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {leaves.map(l => (
                  <tr key={l._id}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800">{l.staff?.name}</div>
                      <div className="text-xs text-gray-400 capitalize">{l.staff?.role.replace('_', ' ')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-700">{l.type}</div>
                      <div className="text-xs text-gray-400">{l.reason}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(l.fromDate).toLocaleDateString()} to {new Date(l.toDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-700">{l.days} days</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                        l.status === 'pending'
                          ? 'bg-amber-50 text-amber-700'
                          : l.status === 'approved'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {l.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {l.status === 'pending' && user.role === 'hr_manager' && (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleApproveLeave(l._id, 'approved')}
                            className="px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-bold transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleApproveLeave(l._id, 'rejected')}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {leaves.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-400">No leave requests in system.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PAYROLL RUNS */}
      {activeTab === 'payroll' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-lg text-gray-800 font-sans">Monthly Payroll Runs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-200">
                  <th className="px-6 py-4">Month</th>
                  <th className="px-6 py-4">Total Disbursement</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {payrollRuns.map(run => (
                  <tr key={run._id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-bold text-gray-800">{run.month}</td>
                    <td className="px-6 py-4 font-semibold text-gray-700">₹{run.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold rounded-full ${
                        run.status === 'draft'
                          ? 'bg-gray-50 text-gray-600'
                          : run.status === 'submitted'
                          ? 'bg-amber-50 text-amber-700'
                          : run.status === 'approved'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-green-50 text-green-700'
                      }`}>
                        {run.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleSelectRun(run._id)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL DISPLAY TAB FOR INDIVIDUAL RUN */}
      {activeTab === 'payrollDetail' && selectedRun && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <button
                  onClick={() => setActiveTab('payroll')}
                  className="text-xs font-bold text-indigo-600 hover:underline mb-1 inline-block"
                >
                  &larr; Back to Runs List
                </button>
                <h3 className="text-xl font-bold text-gray-800">Payroll Details: {selectedRun.month}</h3>
                <div className="text-xs text-gray-400 mt-0.5">
                  Current Status:{' '}
                  <span className="font-bold text-gray-700 uppercase">{selectedRun.status}</span>
                </div>
              </div>

              {/* Status Actions */}
              <div className="flex gap-2">
                {selectedRun.status === 'draft' && user.role === 'hr_manager' && (
                  <button
                    onClick={() => handleSubmitPayroll(selectedRun._id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition"
                  >
                    <Send className="w-3.5 h-3.5" /> Submit to Principal
                  </button>
                )}
                {selectedRun.status === 'submitted' && isPrincipal && (
                  <button
                    onClick={() => handleApprovePayroll(selectedRun._id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Co-Authorize (Approve)
                  </button>
                )}
                {(selectedRun.status === 'approved' || (selectedRun.status === 'submitted' && isPrincipal)) && (
                  <button
                    onClick={() => handleDisbursePayroll(selectedRun._id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold transition"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Disburse & Generate Payslips
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-200">
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3 text-right">Gross Pay</th>
                    <th className="px-4 py-3 text-right">PF + ESI + TDS</th>
                    <th className="px-4 py-3 text-center">LOP (Days / Amt)</th>
                    <th className="px-4 py-3 text-right">Net Take Home</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {runDetails.map(p => (
                    <tr key={p._id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800">{p.staff?.name}</div>
                        <div className="text-gray-400 capitalize">{p.staff?.role.replace('_', ' ')}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-700">
                        ₹{p.grossSalary.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right text-red-500">
                        -₹{(p.pfDeduction + p.esiDeduction + p.tdsDeduction).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="font-semibold text-gray-700">{p.lopDays} days</div>
                        <div className="text-red-500">-₹{p.lopAmount.toLocaleString('en-IN')}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        ₹{p.netSalary.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          {selectedRun.status === 'draft' && user.role === 'hr_manager' && (
                            <button
                              onClick={() => handleOpenEditPayslip(p)}
                              className="p-1 hover:bg-gray-100 text-gray-500 hover:text-gray-700 rounded transition"
                              title="Edit Draft details"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {selectedRun.status === 'disbursed' && p.fileUrl && (
                            <a
                              href={p.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-2xs font-bold transition"
                            >
                              <Download className="w-3 h-3" /> Payslip
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
