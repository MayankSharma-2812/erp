import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'sonner';
import {
  Calendar,
  Plus,
  Trash2,
  Loader2,
  Clock,
  User,
  BookOpen,
  Info
} from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const DEFAULT_TIMINGS = {
  1: { start: '08:00 AM', end: '08:45 AM' },
  2: { start: '08:45 AM', end: '09:30 AM' },
  3: { start: '09:45 AM', end: '10:30 AM' },
  4: { start: '10:30 AM', end: '11:15 AM' },
  5: { start: '11:15 AM', end: '12:00 PM' },
  6: { start: '12:00 PM', end: '12:45 PM' },
  7: { start: '01:30 PM', end: '02:15 PM' },
  8: { start: '02:15 PM', end: '03:00 PM' },
};

const TimetablePage = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [targetSlot, setTargetSlot] = useState({ day: '', period: '' });
  const [formData, setFormData] = useState({
    subject: '',
    teacher: '',
    startTime: '',
    endTime: '',
    session: '2025-26',
  });

  // Fetch initial classes and teachers
  useEffect(() => {
    const fetchInit = async () => {
      try {
        setLoading(true);
        const [classRes, userRes] = await Promise.all([
          api.get('/academics/classes'),
          api.get('/users'),
        ]);

        const classesData = classRes.data.data;
        setClasses(classesData);

        // Filter users who are teachers
        const teacherUsers = userRes.data.data.filter((u) =>
          u.role === 'class_teacher' || u.role === 'subject_teacher'
        );
        setTeachers(teacherUsers);

        if (classesData.length > 0) {
          setSelectedClass(classesData[0]);
          if (classesData[0].sections && classesData[0].sections.length > 0) {
            setSelectedSection(classesData[0].sections[0]);
          }
        }
      } catch (err) {
        toast.error('Failed to load initial data');
      } finally {
        setLoading(false);
      }
    };

    fetchInit();
  }, []);

  // Fetch subjects and slots when class/section changes
  useEffect(() => {
    if (!selectedClass) return;

    const fetchClassData = async () => {
      try {
        const [subjRes, slotRes] = await Promise.all([
          api.get('/academics/subjects', { params: { classId: selectedClass._id } }),
          api.get('/academics/timetable', { params: { classId: selectedClass._id, section: selectedSection } }),
        ]);

        setSubjects(subjRes.data.data);
        setSlots(slotRes.data.data);
      } catch (err) {
        toast.error('Failed to fetch class timetable/subjects');
      }
    };

    fetchClassData();
  }, [selectedClass, selectedSection]);

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

  const handleOpenAddModal = (day, period) => {
    const defaultTime = DEFAULT_TIMINGS[period] || { start: '', end: '' };
    setTargetSlot({ day, period });
    setFormData({
      subject: '',
      teacher: '',
      startTime: defaultTime.start,
      endTime: defaultTime.end,
      session: selectedClass?.session || '2025-26',
    });
    setShowAddModal(true);
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.teacher || !formData.startTime || !formData.endTime) {
      toast.error('All fields are required');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        class: selectedClass._id,
        section: selectedSection,
        day: targetSlot.day,
        period: targetSlot.period,
        subject: formData.subject,
        teacher: formData.teacher,
        startTime: formData.startTime,
        endTime: formData.endTime,
        session: formData.session,
      };

      const res = await api.post('/academics/timetable', payload);
      toast.success(res.data.message || 'Timetable slot scheduled');
      setShowAddModal(false);

      // Refresh slots
      const slotRes = await api.get('/academics/timetable', {
        params: { classId: selectedClass._id, section: selectedSection },
      });
      setSlots(slotRes.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error scheduling slot');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (id) => {
    if (!window.confirm('Are you sure you want to delete this timetable slot?')) return;

    try {
      setLoading(true);
      const res = await api.delete(`/academics/timetable/${id}`);
      toast.success(res.data.message || 'Slot deleted successfully');

      // Refresh slots
      const slotRes = await api.get('/academics/timetable', {
        params: { classId: selectedClass._id, section: selectedSection },
      });
      setSlots(slotRes.data.data);
    } catch (err) {
      toast.error('Failed to delete slot');
    } finally {
      setLoading(false);
    }
  };

  // Helper to find slot in state
  const findSlot = (day, period) => {
    return slots.find((s) => s.day === day && s.period === period);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Weekly Timetable</h1>
          <p className="text-gray-500 mt-1">Configure class period slots and resolve double-booking conflicts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-sm font-medium text-gray-500">Class:</span>
            <select
              value={selectedClass?._id || ''}
              onChange={handleClassChange}
              className="text-sm font-semibold text-gray-800 bg-transparent border-none focus:outline-none"
            >
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.session})
                </option>
              ))}
            </select>
          </div>

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
        </div>
      </div>

      {/* Grid Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 font-semibold text-gray-600 text-sm w-28">Day</th>
                {PERIODS.map((p) => (
                  <th key={p} className="p-4 font-semibold text-gray-600 text-sm min-w-[150px] border-l border-gray-200">
                    <div className="flex flex-col">
                      <span>Period {p}</span>
                      <span className="text-[11px] text-gray-400 font-normal">
                        {DEFAULT_TIMINGS[p]?.start} - {DEFAULT_TIMINGS[p]?.end}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => (
                <tr key={day} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-bold text-gray-700 text-sm bg-gray-50/70">{day}</td>
                  {PERIODS.map((period) => {
                    const slot = findSlot(day, period);
                    return (
                      <td
                        key={period}
                        className="p-3 border-l border-gray-100 relative group min-h-[100px]"
                      >
                        {slot ? (
                          <div className="flex flex-col justify-between h-full bg-indigo-50/40 border border-indigo-100 p-2.5 rounded-xl transition-all hover:bg-indigo-50/70">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-indigo-950 text-sm leading-tight">
                                  {slot.subject?.name || 'Unknown Subject'}
                                </span>
                                <button
                                  onClick={() => handleDeleteSlot(slot._id)}
                                  className="text-gray-400 hover:text-red-600 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Delete slot"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                              <span className="text-[11px] text-indigo-700/80 font-mono mt-0.5 block">
                                {slot.subject?.code}
                              </span>
                            </div>

                            <div className="mt-3 pt-2 border-t border-indigo-100/50 flex flex-col gap-1 text-[11px] text-gray-600">
                              <span className="flex items-center gap-1 font-medium">
                                <User size={12} className="text-indigo-400" />
                                {slot.teacher?.name || 'No Teacher'}
                              </span>
                              <span className="flex items-center gap-1 font-mono text-[10px] text-gray-400">
                                <Clock size={12} />
                                {slot.startTime} - {slot.endTime}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenAddModal(day, period)}
                            className="w-full h-full min-h-[80px] flex flex-col items-center justify-center border border-dashed border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/20 rounded-xl transition-all group/btn"
                          >
                            <Plus size={18} className="text-gray-300 group-hover/btn:text-indigo-500 transition-colors" />
                            <span className="text-[10px] text-gray-400 font-medium mt-1 group-hover/btn:text-indigo-600">
                              Assign
                            </span>
                          </button>
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

      {/* Add Slot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all animate-in fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-md w-full overflow-hidden animate-in slide-in-from-bottom-4">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Assign Slot: {targetSlot.day}, Period {targetSlot.period}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Class {selectedClass?.name} - Section {selectedSection}
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-semibold bg-gray-100 hover:bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSlot} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Subject *
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Teacher *
                </label>
                <select
                  value={formData.teacher}
                  onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  required
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.role.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    Start Time *
                  </label>
                  <input
                    type="text"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="e.g. 08:00 AM"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    End Time *
                  </label>
                  <input
                    type="text"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="e.g. 08:45 AM"
                    required
                  />
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200/60 p-3 rounded-xl flex gap-2 text-amber-800">
                <Info size={16} className="shrink-0 mt-0.5 text-amber-600" />
                <span className="text-[11px] leading-normal font-medium">
                  The system checks for double-bookings. Assigning a busy teacher or double scheduling a period will trigger a warning.
                </span>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  Save Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetablePage;
