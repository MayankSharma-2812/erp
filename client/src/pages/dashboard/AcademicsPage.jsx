import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'sonner';
import {
  FolderPlus,
  BookOpen,
  Calendar,
  FileText,
  Bookmark,
  Loader2,
  Trash2,
  Upload,
  CheckCircle,
  Clock,
  Play
} from 'lucide-react';

const AcademicsPage = () => {
  const [activeTab, setActiveTab] = useState('classes');
  const [loading, setLoading] = useState(false);

  // Data lists
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [events, setEvents] = useState([]);
  const [plans, setPlans] = useState([]);
  const [topics, setTopics] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // Selections for sub-tabs
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // Form states
  const [classForm, setClassForm] = useState({ name: '', sections: '', session: '2025-26' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', class: '', theoryMax: 80, practicalMax: 20, teacher: '', session: '2025-26' });
  const [eventForm, setEventForm] = useState({ date: '', title: '', type: 'holiday', appliesto: 'all', note: '' });
  const [planFile, setPlanFile] = useState(null);
  const [planTitle, setPlanTitle] = useState('');
  const [topicForm, setTopicForm] = useState({ topic: '', order: 1, session: '2025-26' });

  const fetchClasses = async () => {
    try {
      const response = await api.get('/academics/classes');
      setClasses(response.data.data);
      if (response.data.data.length > 0 && !selectedClass) {
        setSelectedClass(response.data.data[0]._id);
      }
    } catch (e) {
      toast.error('Failed to load classes');
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/academics/subjects', {
        params: { classId: selectedClass || undefined },
      });
      setSubjects(response.data.data);
      if (response.data.data.length > 0) {
        setSelectedSubject(response.data.data[0]._id);
      } else {
        setSelectedSubject('');
      }
    } catch (e) {
      toast.error('Failed to load subjects');
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await api.get('/academics/calendar');
      setEvents(response.data.data);
    } catch (e) {
      toast.error('Failed to load calendar events');
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await api.get('/academics/lesson-plans', {
        params: { classId: selectedClass || undefined, subjectId: selectedSubject || undefined },
      });
      setPlans(response.data.data);
    } catch (e) {
      toast.error('Failed to load lesson plans');
    }
  };

  const fetchTopics = async () => {
    if (!selectedClass || !selectedSubject) {
      setTopics([]);
      return;
    }
    try {
      const response = await api.get('/academics/syllabus', {
        params: { classId: selectedClass, subjectId: selectedSubject },
      });
      setTopics(response.data.data);
    } catch (e) {
      toast.error('Failed to load syllabus progression');
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await api.get('/users');
      // Filter out only teachers (class_teacher, subject_teacher)
      const filtered = response.data.data.filter((u) => u.role.includes('teacher'));
      setTeachers(filtered);
    } catch (e) {
      console.error('Failed to load teachers list', e);
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchClasses();
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchSubjects();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedSubject) {
      fetchPlans();
      fetchTopics();
    }
  }, [selectedClass, selectedSubject]);

  // --- SUBMISSIONS ---

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      const sectionsArray = classForm.sections.split(',').map((s) => s.trim().toUpperCase());
      await api.post('/academics/classes', { ...classForm, sections: sectionsArray });
      toast.success('Class created successfully');
      setClassForm({ name: '', sections: '', session: '2025-26' });
      fetchClasses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create class');
    }
  };

  const handleDeleteClass = async (id) => {
    try {
      await api.delete(`/academics/classes/${id}`);
      toast.success('Class deleted');
      fetchClasses();
    } catch (err) {
      toast.error('Failed to delete class');
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/academics/subjects', subjectForm);
      toast.success('Subject configured successfully');
      setSubjectForm({ name: '', code: '', class: '', theoryMax: 80, practicalMax: 20, teacher: '', session: '2025-26' });
      fetchSubjects();
    } catch (err) {
      toast.error('Failed to create subject');
    }
  };

  const handleDeleteSubject = async (id) => {
    try {
      await api.delete(`/academics/subjects/${id}`);
      toast.success('Subject deleted');
      fetchSubjects();
    } catch (err) {
      toast.error('Failed to delete subject');
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/academics/calendar', eventForm);
      toast.success('Event added to calendar');
      setEventForm({ date: '', title: '', type: 'holiday', appliesto: 'all', note: '' });
      fetchEvents();
    } catch (err) {
      toast.error('Failed to add calendar event');
    }
  };

  const handleDeleteEvent = async (id) => {
    try {
      await api.delete(`/academics/calendar/${id}`);
      toast.success('Calendar event deleted');
      fetchEvents();
    } catch (err) {
      toast.error('Failed to delete event');
    }
  };

  const handleUploadPlan = async (e) => {
    e.preventDefault();
    if (!planFile) {
      toast.error('Please select a file');
      return;
    }
    const formData = new FormData();
    formData.append('title', planTitle);
    formData.append('class', selectedClass);
    formData.append('subject', selectedSubject);
    formData.append('session', '2025-26');
    formData.append('file', planFile);

    try {
      await api.post('/academics/lesson-plans', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Lesson plan uploaded successfully');
      setPlanTitle('');
      setPlanFile(null);
      fetchPlans();
    } catch (err) {
      toast.error('Failed to upload lesson plan');
    }
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    try {
      await api.post('/academics/syllabus', {
        ...topicForm,
        class: selectedClass,
        subject: selectedSubject,
      });
      toast.success('Syllabus topic created');
      setTopicForm({ topic: '', order: topics.length + 2, session: '2025-26' });
      fetchTopics();
    } catch (err) {
      toast.error('Failed to add topic');
    }
  };

  const handleUpdateTopicStatus = async (id, status) => {
    try {
      await api.put(`/academics/syllabus/${id}/status`, { status });
      toast.success('Syllabus progress updated');
      fetchTopics();
    } catch (err) {
      toast.error('Failed to update syllabus progress');
    }
  };

  const getSyllabusStatusIcon = (status, id) => {
    if (status === 'completed') {
      return (
        <button
          onClick={() => handleUpdateTopicStatus(id, 'not_started')}
          className="p-1 rounded bg-green-50 text-green-600 border border-green-200"
          title="Mark incomplete"
        >
          <CheckCircle className="h-4.5 w-4.5" />
        </button>
      );
    }
    if (status === 'in_progress') {
      return (
        <button
          onClick={() => handleUpdateTopicStatus(id, 'completed')}
          className="p-1 rounded bg-indigo-50 text-indigo-600 border border-indigo-200"
          title="Mark complete"
        >
          <Play className="h-4.5 w-4.5 animate-pulse" />
        </button>
      );
    }
    return (
      <button
        onClick={() => handleUpdateTopicStatus(id, 'in_progress')}
        className="p-1 rounded bg-slate-50 text-slate-400 border border-slate-200 hover:text-slate-600"
        title="Start topic"
      >
        <Clock className="h-4.5 w-4.5" />
      </button>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Academics Operations</h1>
        <p className="text-sm text-gray-500 font-medium">Configure classes, assign subjects, upload syllabus files, and track calendar milestones.</p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-gray-200 space-x-6 overflow-x-auto pb-px">
        {[
          { id: 'classes', label: 'Classes & Sections', icon: FolderPlus },
          { id: 'subjects', label: 'Subjects & Teachers', icon: BookOpen },
          { id: 'calendar', label: 'Academic Calendar', icon: Calendar },
          { id: 'lessons', label: 'Lesson Plans', icon: FileText },
          { id: 'syllabus', label: 'Syllabus Tracker', icon: Bookmark },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 pb-3 text-xs font-bold whitespace-nowrap tracking-wide border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="mt-4">
        {/* TAB 1: Classes & Sections */}
        {activeTab === 'classes' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Create Class Form */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-gray-900 uppercase">Create New Class</h3>
              <form onSubmit={handleCreateClass} className="space-y-4 text-xs font-semibold text-gray-700">
                <div>
                  <label>Class Name *</label>
                  <input
                    type="text"
                    required
                    value={classForm.name}
                    onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                    className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    placeholder="e.g. Class XII"
                  />
                </div>
                <div>
                  <label>Sections (Comma separated) *</label>
                  <input
                    type="text"
                    required
                    value={classForm.sections}
                    onChange={(e) => setClassForm({ ...classForm, sections: e.target.value })}
                    className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    placeholder="e.g. A, B, C"
                  />
                </div>
                <div>
                  <label>Session *</label>
                  <input
                    type="text"
                    required
                    value={classForm.session}
                    onChange={(e) => setClassForm({ ...classForm, session: e.target.value })}
                    className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">
                  Save Class
                </button>
              </form>
            </div>

            {/* Classes List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm md:col-span-2 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-sm text-gray-900">Configured Classes</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {classes.map((cls) => (
                  <div key={cls._id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{cls.name}</h4>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                        Sections: {cls.sections.join(', ')} | Session: {cls.session}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteClass(cls._id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Subjects & Teachers */}
        {activeTab === 'subjects' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Subject configuration form */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-gray-900 uppercase">Configure Subject</h3>
              <form onSubmit={handleCreateSubject} className="space-y-4 text-xs font-semibold text-gray-700">
                <div>
                  <label>Subject Name *</label>
                  <input
                    type="text"
                    required
                    value={subjectForm.name}
                    onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                    className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none"
                    placeholder="e.g. Mathematics"
                  />
                </div>
                <div>
                  <label>Subject Code *</label>
                  <input
                    type="text"
                    required
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                    className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none"
                    placeholder="e.g. MATH"
                  />
                </div>
                <div>
                  <label>Class Association *</label>
                  <select
                    required
                    value={subjectForm.class}
                    onChange={(e) => setSubjectForm({ ...subjectForm, class: e.target.value })}
                    className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none bg-white"
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label>Theory Max *</label>
                    <input
                      type="number"
                      required
                      value={subjectForm.theoryMax}
                      onChange={(e) => setSubjectForm({ ...subjectForm, theoryMax: parseInt(e.target.value) })}
                      className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label>Practical Max *</label>
                    <input
                      type="number"
                      required
                      value={subjectForm.practicalMax}
                      onChange={(e) => setSubjectForm({ ...subjectForm, practicalMax: parseInt(e.target.value) })}
                      className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label>Assigned Teacher *</label>
                  <select
                    required
                    value={subjectForm.teacher}
                    onChange={(e) => setSubjectForm({ ...subjectForm, teacher: e.target.value })}
                    className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none bg-white"
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} ({t.role.replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">
                  Save Subject
                </button>
              </form>
            </div>

            {/* Subjects List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm md:col-span-2 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-900">Assigned Subjects</h3>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-gray-400 font-medium">Filter by Class:</span>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="border border-gray-200 rounded p-1 bg-white focus:outline-none"
                  >
                    <option value="">All Classes</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {subjects.map((sub) => (
                  <div key={sub._id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{sub.name} ({sub.code})</h4>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                        Class: {sub.class?.name} | Teacher: {sub.teacher?.name || 'Unassigned'} | Marks: {sub.theoryMax}T / {sub.practicalMax}P
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteSubject(sub._id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Academic Calendar */}
        {activeTab === 'calendar' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Event Form */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-gray-900 uppercase">Add Calendar Event</h3>
              <form onSubmit={handleCreateEvent} className="space-y-4 text-xs font-semibold text-gray-700">
                <div>
                  <label>Event Title *</label>
                  <input
                    type="text"
                    required
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label>Date *</label>
                  <input
                    type="date"
                    required
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label>Event Type *</label>
                    <select
                      value={eventForm.type}
                      onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                      className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none bg-white"
                    >
                      <option value="holiday">Holiday</option>
                      <option value="exam">Exam</option>
                      <option value="event">Event</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label>Applies To *</label>
                    <input
                      type="text"
                      required
                      value={eventForm.appliesto}
                      onChange={(e) => setEventForm({ ...eventForm, appliesto: e.target.value })}
                      className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none"
                      placeholder="e.g. all, Class XII"
                    />
                  </div>
                </div>
                <div>
                  <label>Event Note</label>
                  <textarea
                    value={eventForm.note}
                    onChange={(e) => setEventForm({ ...eventForm, note: e.target.value })}
                    className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none"
                    rows="3"
                  />
                </div>
                <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">
                  Add Event
                </button>
              </form>
            </div>

            {/* Events List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm md:col-span-2 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-sm text-gray-900">Academic Schedule</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {events.map((ev) => (
                  <div key={ev._id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{ev.title}</h4>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                        Date: {new Date(ev.date).toLocaleDateString()} | Type: <span className="capitalize">{ev.type}</span> | Scope: {ev.appliesto}
                      </p>
                      {ev.note && <p className="text-xs text-gray-400 italic mt-1">{ev.note}</p>}
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(ev._id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Lesson Plans */}
        {activeTab === 'lessons' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Upload form */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-gray-900 uppercase">Upload Lesson Plan</h3>
              <form onSubmit={handleUploadPlan} className="space-y-4 text-xs font-semibold text-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label>Select Class *</label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg bg-white"
                    >
                      {classes.map((cls) => (
                        <option key={cls._id} value={cls._id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Select Subject *</label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg bg-white"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((sub) => (
                        <option key={sub._id} value={sub._id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label>Plan Title *</label>
                  <input
                    type="text"
                    required
                    value={planTitle}
                    onChange={(e) => setPlanTitle(e.target.value)}
                    className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none"
                    placeholder="e.g. Algebra Basics"
                  />
                </div>
                <div>
                  <label>Document (PDF/DOC) *</label>
                  <input
                    type="file"
                    required
                    onChange={(e) => setPlanFile(e.target.files[0])}
                    className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none"
                  />
                </div>
                <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center justify-center space-x-2">
                  <Upload className="h-4.5 w-4.5" />
                  <span>Upload Document</span>
                </button>
              </form>
            </div>

            {/* Plans list */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm md:col-span-2 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-sm text-gray-900">Lesson Plans Directory</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {plans.map((pl) => (
                  <div key={pl._id} className="p-4 flex items-center justify-between hover:bg-gray-50/50">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{pl.title}</h4>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                        Class: {pl.class?.name} | Subject: {pl.subject?.name} | Uploaded by: {pl.teacher?.name}
                      </p>
                    </div>
                    <a
                      href={`http://localhost:5000${pl.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Syllabus Progress Tracker */}
        {activeTab === 'syllabus' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Create Topic Form */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-gray-900 uppercase">Add Syllabus Topic</h3>
              <form onSubmit={handleCreateTopic} className="space-y-4 text-xs font-semibold text-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label>Select Class</label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg bg-white"
                    >
                      {classes.map((cls) => (
                        <option key={cls._id} value={cls._id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Select Subject</label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg bg-white"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((sub) => (
                        <option key={sub._id} value={sub._id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label>Topic Description *</label>
                  <input
                    type="text"
                    required
                    value={topicForm.topic}
                    onChange={(e) => setTopicForm({ ...topicForm, topic: e.target.value })}
                    className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none"
                    placeholder="e.g. Chapter 4: Matrix Multiplication"
                  />
                </div>
                <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">
                  Add Topic
                </button>
              </form>
            </div>

            {/* Checklist */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm md:col-span-2 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-900">Syllabus progression checklist</h3>
              </div>
              <div className="p-4 space-y-4">
                {topics.length === 0 ? (
                  <p className="text-gray-400 text-xs font-semibold py-4 text-center">No topics entered for this subject.</p>
                ) : (
                  <div className="space-y-3">
                    {topics.map((item) => (
                      <div key={item._id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50/50">
                        <span className={`text-xs font-bold ${item.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {item.topic}
                        </span>
                        <div className="flex items-center space-x-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                            item.status === 'completed' ? 'bg-green-50 text-green-700' :
                            item.status === 'in_progress' ? 'bg-indigo-50 text-indigo-700 animate-pulse' : 'bg-slate-50 text-slate-400'
                          }`}>
                            {item.status.replace('_', ' ')}
                          </span>
                          {getSyllabusStatusIcon(item.status, item._id)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicsPage;
