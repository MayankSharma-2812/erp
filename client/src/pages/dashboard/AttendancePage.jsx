import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import {
  ClipboardCheck,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Clock,
  ChevronRight,
  TrendingUp,
  FileText
} from 'lucide-react';

const AttendancePage = () => {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('mark');
  const [loading, setLoading] = useState(false);

  // Class/Section selections
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Roster state
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // studentId -> status

  // Log state
  const [logRecords, setLogRecords] = useState([]);

  // Stats state
  const [statsRecords, setStatsRecords] = useState([]);
  const [statsRange, setStatsRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  // Consecutive absences
  const [flaggedStudents, setFlaggedStudents] = useState([]);

  // Load initial classes and lock for class teachers
  useEffect(() => {
    const initializePage = async () => {
      try {
        setLoading(true);
        const [classRes, userRes] = await Promise.all([
          api.get('/academics/classes'),
          api.get('/users'),
        ]);

        const classesList = classRes.data.data;
        setClasses(classesList);

        // Class Teacher lock verification
        if (currentUser.role === 'class_teacher') {
          const profile = userRes.data.data.find((u) => u._id === currentUser.id);
          if (profile && profile.classAssigned) {
            const matchedClass = classesList.find((c) => c._id === (profile.classAssigned._id || profile.classAssigned));
            if (matchedClass) {
              setSelectedClass(matchedClass);
              if (matchedClass.sections && matchedClass.sections.length > 0) {
                setSelectedSection(matchedClass.sections[0]);
              }
              setLoading(false);
              return;
            }
          }
        }

        // Defaults for other roles
        if (classesList.length > 0) {
          setSelectedClass(classesList[0]);
          if (classesList[0].sections && classesList[0].sections.length > 0) {
            setSelectedSection(classesList[0].sections[0]);
          }
        }
      } catch (err) {
        toast.error('Failed to initialize attendance module');
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [currentUser]);

  // Fetch student roster when class or section changes
  useEffect(() => {
    if (!selectedClass || !selectedSection || activeTab !== 'mark') return;

    const fetchRoster = async () => {
      try {
        setLoading(true);
        // Fetch students and existing attendance logs for that day
        const [studentRes, attendanceRes] = await Promise.all([
          api.get('/students', { params: { classId: selectedClass._id, section: selectedSection, status: 'active' } }),
          api.get('/attendance', { params: { classId: selectedClass._id, section: selectedSection, date: selectedDate } })
        ]);

        const roster = studentRes.data.data;
        setStudents(roster);

        // Pre-fill attendance statuses
        const initialRecords = {};
        roster.forEach((s) => {
          initialRecords[s._id] = 'present'; // default to present
        });

        // Overlay with already marked attendance if exists
        const markedLogs = attendanceRes.data.data || [];
        markedLogs.forEach((log) => {
          if (log.student) {
            initialRecords[log.student._id || log.student] = log.status;
          }
        });

        setAttendanceRecords(initialRecords);
      } catch (err) {
        toast.error('Failed to load student roster or logs');
      } finally {
        setLoading(false);
      }
    };

    fetchRoster();
  }, [selectedClass, selectedSection, selectedDate, activeTab]);

  // Fetch logs when log tab is active
  useEffect(() => {
    if (!selectedClass || !selectedSection || activeTab !== 'logs') return;

    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res = await api.get('/attendance', {
          params: { classId: selectedClass._id, section: selectedSection, date: selectedDate }
        });
        setLogRecords(res.data.data);
      } catch (err) {
        toast.error('Failed to fetch attendance logs');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [selectedClass, selectedSection, selectedDate, activeTab]);

  // Fetch stats when stats tab is active
  useEffect(() => {
    if (!selectedClass || !selectedSection || activeTab !== 'stats') return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/attendance/stats', {
          params: {
            classId: selectedClass._id,
            section: selectedSection,
            startDate: statsRange.start,
            endDate: statsRange.end
          }
        });
        setStatsRecords(res.data.data);
      } catch (err) {
        toast.error('Failed to fetch statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedClass, selectedSection, statsRange, activeTab]);

  // Fetch consecutive absences when flagged tab is active
  useEffect(() => {
    if (!selectedClass || !selectedSection || activeTab !== 'flagged') return;

    const fetchFlagged = async () => {
      try {
        setLoading(true);
        const res = await api.get('/attendance/consecutive-absences', {
          params: { classId: selectedClass._id, section: selectedSection }
        });
        setFlaggedStudents(res.data.data);
      } catch (err) {
        toast.error('Failed to fetch flagged absences');
      } finally {
        setLoading(false);
      }
    };

    fetchFlagged();
  }, [selectedClass, selectedSection, activeTab]);

  const handleClassChange = (e) => {
    const classId = e.target.value;
    const found = classes.find((c) => c._id === classId);
    setSelectedClass(found);
    if (found && found.sections && found.sections.length > 0) {
      setSelectedSection(found.sections[0]);
    } else {
      setSelectedSection('');
    }
  };

  const setStatusForAll = (status) => {
    const updated = { ...attendanceRecords };
    students.forEach((s) => {
      updated[s._id] = status;
    });
    setAttendanceRecords(updated);
    toast.success(`Marked all as ${status.toUpperCase()}`);
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const submitAttendance = async () => {
    try {
      setLoading(true);
      const recordsPayload = Object.keys(attendanceRecords).map((sid) => ({
        studentId: sid,
        status: attendanceRecords[sid],
      }));

      const payload = {
        classId: selectedClass._id,
        section: selectedSection,
        date: selectedDate,
        records: recordsPayload,
      };

      const res = await api.post('/attendance', payload);
      toast.success(res.data.message || 'Attendance saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit attendance');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'absent': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'late': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'leave': return 'bg-sky-50 text-sky-700 border-sky-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Attendance Manager</h1>
          <p className="text-gray-500 mt-1">Track student presence, view historical logs, and monitor absence trends.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Select */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-sm font-medium text-gray-500">Class:</span>
            <select
              value={selectedClass?._id || ''}
              onChange={handleClassChange}
              disabled={currentUser.role === 'class_teacher'}
              className="text-sm font-semibold text-gray-800 bg-transparent border-none focus:outline-none disabled:opacity-75"
            >
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.session})
                </option>
              ))}
            </select>
          </div>

          {/* Section Select */}
          {selectedClass && selectedClass.sections && selectedClass.sections.length > 0 && (
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-sm font-medium text-gray-500">Section:</span>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="text-sm font-semibold text-gray-800 bg-transparent border-none focus:outline-none"
              >
                {selectedClass.sections.map((sec) => (
                  <option key={sec} value={sec}>
                    Section {sec}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm">
            <Calendar size={16} className="text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm font-semibold text-gray-800 bg-transparent border-none focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-gray-200 flex gap-2">
        <button
          onClick={() => setActiveTab('mark')}
          className={`py-3 px-4 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'mark'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
          }`}
        >
          Mark Attendance
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`py-3 px-4 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'logs'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
          }`}
        >
          Daily Logs
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`py-3 px-4 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'stats'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
          }`}
        >
          Monthly Statistics
        </button>
        <button
          onClick={() => setActiveTab('flagged')}
          className={`py-3 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'flagged'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
          }`}
        >
          Flagged Absences
          {flaggedStudents.length > 0 && (
            <span className="bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full font-bold">
              {flaggedStudents.length}
            </span>
          )}
        </button>
      </div>

      {/* Content Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="animate-spin text-indigo-600 mb-2" size={32} />
            <span>Loading attendance information...</span>
          </div>
        ) : (
          <>
            {/* Tab: Mark Attendance */}
            {activeTab === 'mark' && (
              <div className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-gray-400" />
                    <span className="text-sm font-semibold text-gray-700">
                      Roster: {students.length} Students active in class section
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setStatusForAll('present')}
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      All Present
                    </button>
                    <button
                      onClick={() => setStatusForAll('absent')}
                      className="px-3 py-1.5 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
                    >
                      All Absent
                    </button>
                  </div>
                </div>

                {students.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    No active students found in this class section.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50/50">
                          <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Adm No.</th>
                          <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Roll No.</th>
                          <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Student Name</th>
                          <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Attendance Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {students.map((student) => {
                          const currentStatus = attendanceRecords[student._id] || 'present';
                          return (
                            <tr key={student._id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-3 text-sm font-mono text-gray-500">{student.admissionNumber}</td>
                              <td className="p-3 text-sm text-gray-700">{student.rollNumber || '--'}</td>
                              <td className="p-3 text-sm font-semibold text-gray-800">{student.name}</td>
                              <td className="p-3 text-right">
                                <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 gap-0.5">
                                  {['present', 'absent', 'late', 'leave'].map((status) => (
                                    <button
                                      key={status}
                                      onClick={() => handleStatusChange(student._id, status)}
                                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                                        currentStatus === status
                                          ? status === 'present'
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : status === 'absent'
                                            ? 'bg-rose-600 text-white shadow-xs'
                                            : status === 'late'
                                            ? 'bg-amber-500 text-white shadow-xs'
                                            : 'bg-sky-600 text-white shadow-xs'
                                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-150'
                                      }`}
                                    >
                                      {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </button>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {students.length > 0 && (
                  <div className="pt-6 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={submitAttendance}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
                    >
                      Submit Attendance Record
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Daily Logs */}
            {activeTab === 'logs' && (
              <div className="p-6">
                <h3 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <ClipboardCheck className="text-indigo-600" size={18} />
                  Daily Record Summary ({selectedDate})
                </h3>

                {logRecords.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    No attendance has been saved for this date. Go to 'Mark Attendance' to register it.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50/50">
                          <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Adm No.</th>
                          <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Student Name</th>
                          <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Marked By</th>
                          <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {logRecords.map((rec) => (
                          <tr key={rec._id}>
                            <td className="p-3 text-sm font-mono text-gray-500">{rec.student?.admissionNumber}</td>
                            <td className="p-3 text-sm font-semibold text-gray-800">{rec.student?.name}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(rec.status)}`}>
                                {rec.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-3 text-sm text-gray-600">Teacher Account</td>
                            <td className="p-3 text-sm text-gray-400 font-mono">
                              {new Date(rec.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Monthly Stats */}
            {activeTab === 'stats' && (
              <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-150">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-indigo-600" size={18} />
                    <span className="text-sm font-semibold text-gray-700">Configure Stats Range</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="date"
                      value={statsRange.start}
                      onChange={(e) => setStatsRange({ ...statsRange, start: e.target.value })}
                      className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none"
                    />
                    <span className="text-xs text-gray-400 font-medium">to</span>
                    <input
                      type="date"
                      value={statsRange.end}
                      onChange={(e) => setStatsRange({ ...statsRange, end: e.target.value })}
                      className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                {statsRecords.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    No logs found in the selected date range.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50/50">
                          <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Student Name</th>
                          <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Present</th>
                          <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Absent</th>
                          <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Late</th>
                          <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Leave</th>
                          <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Total Logs</th>
                          <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Attendance %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {statsRecords.map((stat) => (
                          <tr key={stat.studentId}>
                            <td className="p-3 text-sm font-semibold text-gray-800">{stat.name}</td>
                            <td className="p-3 text-sm text-center text-emerald-600 font-semibold">{stat.present}</td>
                            <td className="p-3 text-sm text-center text-rose-600 font-semibold">{stat.absent}</td>
                            <td className="p-3 text-sm text-center text-amber-500 font-semibold">{stat.late}</td>
                            <td className="p-3 text-sm text-center text-sky-600 font-semibold">{stat.leave}</td>
                            <td className="p-3 text-sm text-center text-gray-500">{stat.total}</td>
                            <td className="p-3 text-right">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                stat.attendancePercent >= 75
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {stat.attendancePercent}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Flagged Absences */}
            {activeTab === 'flagged' && (
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="text-rose-500" size={20} />
                  <div>
                    <h3 className="text-md font-bold text-gray-800">Flagged Consecutive Absences</h3>
                    <p className="text-xs text-gray-500">Students with 3 or more consecutive absent days (requires investigation).</p>
                  </div>
                </div>

                {flaggedStudents.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 bg-gray-50/30 border border-dashed border-gray-200 rounded-xl">
                    No students currently flagged for 3+ consecutive absent days in this class section.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {flaggedStudents.map((flag) => (
                      <div
                        key={flag.studentId}
                        className="bg-rose-50/30 border border-rose-200/80 p-4 rounded-xl flex items-start justify-between hover:bg-rose-50/55 transition-colors"
                      >
                        <div className="space-y-1">
                          <h4 className="font-bold text-gray-950 text-sm">{flag.name}</h4>
                          <div className="flex gap-3 text-xs text-gray-500 font-medium">
                            <span>Adm No: {flag.admissionNumber}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="bg-rose-100 text-rose-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
                            {flag.consecutiveAbsentCount} Days Absent
                          </span>
                          <span className="text-[10px] text-rose-500 font-semibold tracking-wider uppercase">
                            Consecutive
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;
