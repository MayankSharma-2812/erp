import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import {
  Calendar,
  Plus,
  Trash2,
  Loader2,
  FileText,
  UserCheck,
  CheckCircle,
  Download,
  Users,
  Building,
  Settings,
  AlertOctagon,
  ArrowRight,
  Printer
} from 'lucide-react';

const ExamsPage = () => {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('setup');
  const [loading, setLoading] = useState(false);

  // States
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [schedules, setSchedules] = useState([]);

  // Form states - Exam CRUD
  const [showExamModal, setShowExamModal] = useState(false);
  const [examForm, setExamForm] = useState({
    name: '',
    type: 'unit_test',
    classes: [],
    session: '2025-26',
    startDate: '',
    endDate: '',
  });

  // Form states - Schedule Builder
  const [schedForm, setSchedForm] = useState({
    class: '',
    section: '',
    subject: '',
    date: '',
    startTime: '',
    endTime: '',
    venue: '',
    invigilators: [],
  });

  // Seating Arrangement capacities
  const [venues, setVenues] = useState([
    { name: 'Exam Hall A', capacity: '30' },
    { name: 'Room 101', capacity: '20' },
    { name: 'Room 102', capacity: '20' },
  ]);

  // Hall tickets list
  const [hallTickets, setHallTickets] = useState([]);

  // Load initial data
  useEffect(() => {
    fetchInitData();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      fetchSchedules();
      fetchHallTickets();
    }
  }, [selectedExam]);

  const fetchInitData = async () => {
    try {
      setLoading(true);
      const [examRes, classRes, staffRes] = await Promise.all([
        api.get('/exams'),
        api.get('/academics/classes'),
        api.get('/users'),
      ]);

      const examsList = examRes.data.data;
      setExams(examsList);
      setClasses(classRes.data.data);
      setStaffList(staffRes.data.data);

      if (examsList.length > 0) {
        setSelectedExam(examsList[0]);
      }
    } catch (err) {
      toast.error('Failed to initialize exams module');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    if (!selectedExam) return;
    try {
      const res = await api.get(`/exams/${selectedExam._id}/schedules`);
      setSchedules(res.data.data);
    } catch (err) {
      toast.error('Failed to load schedules');
    }
  };

  const fetchHallTickets = async () => {
    if (!selectedExam) return;
    try {
      const res = await api.get(`/exams/${selectedExam._id}/hall-tickets`);
      setHallTickets(res.data.data);
    } catch (err) {
      console.warn('Failed to load hall tickets');
    }
  };

  const loadSubjectsForClass = async (classId) => {
    try {
      const res = await api.get('/academics/subjects', { params: { classId } });
      setSubjects(res.data.data);
    } catch (err) {
      toast.error('Failed to load subjects');
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (examForm.classes.length === 0) {
      toast.error('Select at least one class');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/exams', examForm);
      toast.success(res.data.message || 'Exam created');
      setShowExamModal(false);
      setExamForm({ name: '', type: 'unit_test', classes: [], session: '2025-26', startDate: '', endDate: '' });
      fetchInitData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating exam');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusTransition = async (examId, newStatus) => {
    if (newStatus === 'published' && currentUser.role !== 'principal') {
      toast.error('Only the school Principal can publish results.');
      return;
    }

    if (newStatus === 'published') {
      if (!window.confirm('WARNING: Publishing results is irreversible and locks marks editing. Are you sure?')) {
        return;
      }
      try {
        setLoading(true);
        const res = await api.post(`/exams/${examId}/results/publish`);
        toast.success(res.data.message || 'Results published and edits locked!');
        fetchInitData();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to publish');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      await api.put(`/exams/${examId}`, { status: newStatus });
      toast.success(`Exam status updated to ${newStatus}`);
      fetchInitData();
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (id) => {
    if (!window.confirm('Delete this exam? This will erase all schedules and results!')) return;
    try {
      setLoading(true);
      await api.delete(`/exams/${id}`);
      toast.success('Exam deleted');
      fetchInitData();
    } catch (err) {
      toast.error('Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (!selectedExam) return;

    try {
      setLoading(true);
      const res = await api.post(`/exams/${selectedExam._id}/schedules`, schedForm);
      toast.success(res.data.message || 'Schedule added');
      setSchedForm({
        class: '',
        section: '',
        subject: '',
        date: '',
        startTime: '',
        endTime: '',
        venue: '',
        invigilators: [],
      });
      fetchSchedules();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('Delete this schedule?')) return;
    try {
      setLoading(true);
      await api.delete(`/exams/${selectedExam._id}/schedules/${scheduleId}`);
      toast.success('Schedule deleted');
      fetchSchedules();
    } catch (err) {
      toast.error('Failed to delete schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSeating = async () => {
    if (!selectedExam) return;
    try {
      setLoading(true);
      // Clean venues list
      const cleanVenues = venues.map((v) => ({
        name: v.name,
        capacity: Number(v.capacity),
      }));

      const res = await api.post(`/exams/${selectedExam._id}/seating`, { venues: cleanVenues });
      toast.success(res.data.message || 'Seating generated successfully');
      fetchHallTickets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Seating generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateHallTicketsMeta = async () => {
    if (!selectedExam) return;
    try {
      setLoading(true);
      const res = await api.post(`/exams/${selectedExam._id}/hall-tickets/generate`);
      toast.success(res.data.message || 'Hall tickets generated');
      fetchHallTickets();
    } catch (err) {
      toast.error('Failed to generate tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBulk = () => {
    if (!selectedExam) return;
    const url = `/api/v1/exams/${selectedExam._id}/hall-tickets/download`;
    // open in new window
    window.open(url, '_blank');
  };

  const handleDownloadSingle = (ticketId) => {
    if (!selectedExam) return;
    const url = `/api/v1/exams/${selectedExam._id}/hall-tickets/${ticketId}/download`;
    window.open(url, '_blank');
  };

  const toggleClassSelection = (classId) => {
    const isSelected = examForm.classes.includes(classId);
    const updated = isSelected
      ? examForm.classes.filter((c) => c !== classId)
      : [...examForm.classes, classId];
    setExamForm({ ...examForm, classes: updated });
  };

  const handleAddVenueRow = () => {
    setVenues([...venues, { name: '', capacity: '' }]);
  };

  const handleRemoveVenueRow = (index) => {
    setVenues(venues.filter((_, i) => i !== index));
  };

  const handleVenueChange = (index, field, val) => {
    const updated = [...venues];
    updated[index][field] = val;
    setVenues(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Examinations setup</h1>
          <p className="text-gray-500 mt-1">Manage exam setup, scheduling, seating, and hall tickets generation.</p>
        </div>
        <div className="flex items-center gap-3">
          {exams.length > 0 && (
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-sm font-medium text-gray-500">Active Exam:</span>
              <select
                value={selectedExam?._id || ''}
                onChange={(e) => setSelectedExam(exams.find((x) => x._id === e.target.value))}
                className="text-sm font-semibold text-gray-800 bg-transparent border-none focus:outline-none"
              >
                {exams.map((ex) => (
                  <option key={ex._id} value={ex._id}>
                    {ex.name} ({ex.status.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          )}
          {(currentUser.role === 'principal' || currentUser.role === 'exam_controller') && (
            <button
              onClick={() => setShowExamModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus size={16} />
              Create Exam
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-2">
        <button
          onClick={() => setActiveTab('setup')}
          className={`py-3 px-4 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'setup'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
          }`}
        >
          Exam Setup
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`py-3 px-4 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'schedule'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
          }`}
        >
          Schedule Builder
        </button>
        <button
          onClick={() => setActiveTab('seating')}
          className={`py-3 px-4 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'seating'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
          }`}
        >
          Seating & Hall Tickets
        </button>
      </div>

      {/* Content Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6">
        {loading && exams.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="animate-spin text-indigo-600 mb-2" size={32} />
            <span>Loading exam modules...</span>
          </div>
        ) : (
          <>
            {/* Setup Tab */}
            {activeTab === 'setup' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-800">Available School Examinations</h3>
                {exams.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">No exams configured yet. Click 'Create Exam' to start.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exams.map((ex) => (
                      <div
                        key={ex._id}
                        className={`border rounded-2xl p-5 space-y-4 shadow-xs relative transition-all hover:shadow-sm ${
                          selectedExam?._id === ex._id
                            ? 'border-indigo-500 bg-indigo-50/10'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                              ex.status === 'published'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : ex.status === 'scheduled'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-gray-50 text-gray-600 border-gray-200'
                            }`}>
                              {ex.status}
                            </span>
                            <h4 className="font-bold text-gray-950 text-base mt-2">{ex.name}</h4>
                            <span className="text-xs font-mono text-gray-400 block mt-0.5">{ex.session}</span>
                          </div>
                          {(currentUser.role === 'principal' || currentUser.role === 'exam_controller') && (
                            <button
                              onClick={() => handleDeleteExam(ex._id)}
                              className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg transition-colors"
                              title="Delete Exam"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>

                        <div className="space-y-1.5 text-xs text-gray-600">
                          <div className="flex justify-between">
                            <span className="font-semibold">Type:</span>
                            <span className="capitalize">{ex.type.replace('_', ' ')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold">Start:</span>
                            <span>{new Date(ex.startDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold">End:</span>
                            <span>{new Date(ex.endDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold">Classes:</span>
                            <span>{ex.classes?.map((c) => c.name).join(', ')}</span>
                          </div>
                        </div>

                        {/* Transitions */}
                        {(currentUser.role === 'principal' || currentUser.role === 'exam_controller') && (
                          <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                            {ex.status === 'draft' && (
                              <button
                                onClick={() => handleStatusTransition(ex._id, 'scheduled')}
                                className="px-2.5 py-1.5 text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-all"
                              >
                                Mark Scheduled
                              </button>
                            )}
                            {ex.status === 'scheduled' && (
                              <button
                                onClick={() => handleStatusTransition(ex._id, 'ongoing')}
                                className="px-2.5 py-1.5 text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-all"
                              >
                                Mark Ongoing
                              </button>
                            )}
                            {ex.status === 'ongoing' && (
                              <button
                                onClick={() => handleStatusTransition(ex._id, 'completed')}
                                className="px-2.5 py-1.5 text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all"
                              >
                                Mark Completed
                              </button>
                            )}
                            {ex.status === 'completed' && currentUser.role === 'principal' && (
                              <button
                                onClick={() => handleStatusTransition(ex._id, 'published')}
                                className="px-2.5 py-1.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all"
                              >
                                Publish Results
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Schedule Builder Tab */}
            {activeTab === 'schedule' && (
              <div className="space-y-6">
                {!selectedExam ? (
                  <div className="py-12 text-center text-gray-400">Please select or configure an exam first.</div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Add Schedule Form */}
                    {(currentUser.role === 'principal' || currentUser.role === 'exam_controller') && (
                      <div className="lg:col-span-1 border border-gray-200 rounded-2xl p-5 space-y-4">
                        <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                          <Settings size={18} className="text-indigo-500" />
                          Add Exam Schedule
                        </h4>
                        <form onSubmit={handleCreateSchedule} className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                              Class *
                            </label>
                            <select
                              value={schedForm.class}
                              onChange={(e) => {
                                setSchedForm({ ...schedForm, class: e.target.value });
                                loadSubjectsForClass(e.target.value);
                              }}
                              className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                              required
                            >
                              <option value="">Select Class</option>
                              {selectedExam.classes?.map((c) => (
                                <option key={c._id} value={c._id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                Section *
                              </label>
                              <select
                                value={schedForm.section}
                                onChange={(e) => setSchedForm({ ...schedForm, section: e.target.value })}
                                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                                required
                              >
                                <option value="">Select</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                Subject *
                              </label>
                              <select
                                value={schedForm.subject}
                                onChange={(e) => setSchedForm({ ...schedForm, subject: e.target.value })}
                                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                                required
                              >
                                <option value="">Select</option>
                                {subjects.map((sub) => (
                                  <option key={sub._id} value={sub._id}>
                                    {sub.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                              Exam Date *
                            </label>
                            <input
                              type="date"
                              value={schedForm.date}
                              onChange={(e) => setSchedForm({ ...schedForm, date: e.target.value })}
                              className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                Start Time *
                              </label>
                              <input
                                type="text"
                                placeholder="09:00 AM"
                                value={schedForm.startTime}
                                onChange={(e) => setSchedForm({ ...schedForm, startTime: e.target.value })}
                                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                End Time *
                              </label>
                              <input
                                type="text"
                                placeholder="12:00 PM"
                                value={schedForm.endTime}
                                onChange={(e) => setSchedForm({ ...schedForm, endTime: e.target.value })}
                                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                              Exam Venue *
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Exam Hall 1"
                              value={schedForm.venue}
                              onChange={(e) => setSchedForm({ ...schedForm, venue: e.target.value })}
                              className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                              Invigilator *
                            </label>
                            <select
                              value={schedForm.invigilators[0] || ''}
                              onChange={(e) => setSchedForm({ ...schedForm, invigilators: e.target.value ? [e.target.value] : [] })}
                              className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                            >
                              <option value="">Select Invigilator</option>
                              {staffList.filter(u => u.role !== 'receptionist').map((s) => (
                                <option key={s._id} value={s._id}>
                                  {s.name} ({s.role.replace('_', ' ')})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="pt-2">
                            <button
                              type="submit"
                              disabled={loading}
                              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                            >
                              Add Schedule Slot
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Schedules List Grid */}
                    <div className="lg:col-span-2 space-y-4">
                      <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                        <Calendar size={18} className="text-indigo-500" />
                        Schedules: {selectedExam.name}
                      </h4>
                      {schedules.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                          No schedules configured for this exam yet.
                        </div>
                      ) : (
                        <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                          <table className="w-full border-collapse text-left text-xs">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200 font-semibold text-gray-600">
                                <th className="p-3">Class/Sec</th>
                                <th className="p-3">Subject</th>
                                <th className="p-3">Date</th>
                                <th className="p-3 font-mono">Time</th>
                                <th className="p-3">Venue</th>
                                <th className="p-3">Invigilator</th>
                                {(currentUser.role === 'principal' || currentUser.role === 'exam_controller') && (
                                  <th className="p-3 text-right">Action</th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {schedules.map((sc) => (
                                <tr key={sc._id} className="hover:bg-gray-50/50">
                                  <td className="p-3 font-semibold text-gray-800">
                                    {sc.class?.name} - {sc.section}
                                  </td>
                                  <td className="p-3">
                                    <span className="font-semibold text-gray-900">{sc.subject?.name}</span>
                                    <span className="text-[10px] text-gray-400 block font-mono mt-0.5">{sc.subject?.code}</span>
                                  </td>
                                  <td className="p-3 text-gray-700 font-medium">
                                    {new Date(sc.date).toLocaleDateString()}
                                  </td>
                                  <td className="p-3 font-mono text-gray-600">
                                    {sc.startTime} - {sc.endTime}
                                  </td>
                                  <td className="p-3 text-gray-700 font-semibold">{sc.venue}</td>
                                  <td className="p-3 text-gray-600">
                                    {sc.invigilators?.map(i => i.name).join(', ') || 'Unassigned'}
                                  </td>
                                  {(currentUser.role === 'principal' || currentUser.role === 'exam_controller') && (
                                    <td className="p-3 text-right">
                                      <button
                                        onClick={() => handleDeleteSchedule(sc._id)}
                                        className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Seating Arrangement & Hall Tickets Tab */}
            {activeTab === 'seating' && (
              <div className="space-y-6">
                {!selectedExam ? (
                  <div className="py-12 text-center text-gray-400">Please select an exam.</div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Setup seating row */}
                    {(currentUser.role === 'principal' || currentUser.role === 'exam_controller') && (
                      <div className="lg:col-span-1 border border-gray-200 rounded-2xl p-5 space-y-4">
                        <h4 className="font-bold text-gray-950 flex items-center gap-1.5">
                          <Building size={18} className="text-indigo-500" />
                          Auto Seating Arrangement
                        </h4>
                        <p className="text-xs text-gray-500 leading-normal">
                          Provide exam venues and their seating capacity. The system will mix and distribute students alphabetically across venues.
                        </p>
                        
                        <div className="space-y-2">
                          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            Venues & Capacities
                          </label>
                          {venues.map((venue, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <input
                                type="text"
                                placeholder="e.g. Hall A"
                                value={venue.name}
                                onChange={(e) => handleVenueChange(idx, 'name', e.target.value)}
                                className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                                required
                              />
                              <input
                                type="number"
                                placeholder="Cap"
                                value={venue.capacity}
                                onChange={(e) => handleVenueChange(idx, 'capacity', e.target.value)}
                                className="w-16 px-2 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold"
                                required
                              />
                              {venues.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVenueRow(idx)}
                                  className="text-red-500 hover:text-red-700 text-xs font-semibold px-1"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={handleAddVenueRow}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-1"
                          >
                            + Add Venue Row
                          </button>
                        </div>

                        <div className="pt-3 flex gap-2">
                          <button
                            onClick={handleGenerateSeating}
                            disabled={loading}
                            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all text-center"
                          >
                            Run Auto Seat Allocator
                          </button>
                        </div>
                        
                        <div className="pt-2 border-t border-gray-100">
                          <button
                            onClick={handleGenerateHallTicketsMeta}
                            disabled={loading}
                            className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-all text-center"
                          >
                            Init Hall Ticket Records
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Hall tickets & seating display */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                          <Users size={18} className="text-indigo-500" />
                          Generated Seating: {hallTickets.length} Student Hall Tickets
                        </h4>
                        {hallTickets.length > 0 && (
                          <button
                            onClick={handleDownloadBulk}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                          >
                            <Printer size={14} />
                            Download Bulk PDFs
                          </button>
                        )}
                      </div>

                      {hallTickets.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                          No seating arrangement generated yet. Specify venues and click 'Run Auto Seat Allocator'.
                        </div>
                      ) : (
                        <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                          <table className="w-full border-collapse text-left text-xs">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200 font-semibold text-gray-600">
                                <th className="p-3">Adm No.</th>
                                <th className="p-3">Roll No.</th>
                                <th className="p-3">Student Name</th>
                                <th className="p-3">Class/Sec</th>
                                <th className="p-3">Assigned Seat</th>
                                <th className="p-3 text-right">Ticket</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {hallTickets.map((ht) => {
                                // Find seatNo from first subject if seating is run
                                const seat = ht.subjects?.[0]?.seatNo || '--';
                                return (
                                  <tr key={ht._id} className="hover:bg-gray-50/50">
                                    <td className="p-3 text-gray-500 font-mono">{ht.student?.admissionNumber}</td>
                                    <td className="p-3 text-gray-700">{ht.rollNumber || '--'}</td>
                                    <td className="p-3 font-semibold text-gray-800">{ht.student?.name}</td>
                                    <td className="p-3">
                                      {ht.student?.class?.name || 'UnknownClass'} - {ht.student?.section || 'A'}
                                    </td>
                                    <td className="p-3">
                                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                        seat !== '--'
                                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                          : 'bg-amber-50 text-amber-700 border-amber-200'
                                      }`}>
                                        {seat}
                                      </span>
                                    </td>
                                    <td className="p-3 text-right">
                                      <button
                                        onClick={() => handleDownloadSingle(ht._id)}
                                        className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center justify-end gap-0.5 ml-auto"
                                        title="Print individual hall ticket"
                                      >
                                        <Download size={13} />
                                        PDF
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Exam Modal */}
      {showExamModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all animate-in fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-lg w-full overflow-hidden animate-in slide-in-from-bottom-4">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Setup New Examination</h3>
                <p className="text-xs text-gray-500 mt-0.5">Configure exam schedule ranges and eligible classes.</p>
              </div>
              <button
                onClick={() => setShowExamModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-semibold bg-gray-100 hover:bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Exam Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Half Yearly 2025"
                  value={examForm.name}
                  onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    Exam Type *
                  </label>
                  <select
                    value={examForm.type}
                    onChange={(e) => setExamForm({ ...examForm, type: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    required
                  >
                    <option value="unit_test">Unit Test</option>
                    <option value="half_yearly">Half Yearly</option>
                    <option value="annual">Annual Exam</option>
                    <option value="board">Board Exam</option>
                    <option value="mock">Mock Exam</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    Academic Session *
                  </label>
                  <input
                    type="text"
                    value={examForm.session}
                    onChange={(e) => setExamForm({ ...examForm, session: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={examForm.startDate}
                    onChange={(e) => setExamForm({ ...examForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={examForm.endDate}
                    onChange={(e) => setExamForm({ ...examForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Assigned Classes *
                </label>
                <div className="grid grid-cols-3 gap-2 border border-gray-250 p-3 rounded-xl max-h-36 overflow-y-auto">
                  {classes.map((c) => (
                    <label key={c._id} className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={examForm.classes.includes(c._id)}
                        onChange={() => toggleClassSelection(c._id)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowExamModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
                >
                  Save Exam Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamsPage;
