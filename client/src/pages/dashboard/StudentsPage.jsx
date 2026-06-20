import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import {
  Search,
  User,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Building2,
  Bus,
  Library,
  Trash2,
  Edit,
  Eye,
  Download,
  CreditCard,
} from 'lucide-react';

export default function StudentsPage() {
  const { user } = useAuthStore();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [genderFilter, setGenderFilter] = useState('');
  const [boardingFilter, setBoardingFilter] = useState('');

  // Detail Drawer
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [search, classFilter, sectionFilter, statusFilter, genderFilter, boardingFilter]);

  const fetchClasses = async () => {
    try {
      const res = await axios.get('/academics/classes');
      if (res.data.success) {
        setClasses(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load classes');
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/students?classId=${classFilter}&status=${statusFilter}&section=${sectionFilter}&gender=${genderFilter}&isBoarding=${boardingFilter}`);
      if (res.data.success) {
        // Filter client-side by search query if text entered
        let filtered = res.data.data;
        if (search) {
          filtered = filtered.filter(s =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.admissionNumber.toLowerCase().includes(search.toLowerCase())
          );
        }
        setStudents(filtered);
      }
    } catch (e) {
      toast.error('Failed to load student directory');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student record? This cannot be undone.')) return;
    try {
      const res = await axios.delete(`/students/${id}`);
      if (res.data.success) {
        toast.success('Student record deleted successfully');
        setShowDrawer(false);
        setSelectedStudent(null);
        fetchStudents();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete student');
    }
  };

  const handleDownloadICard = (studentId, studentName) => {
    const token = useAuthStore.getState().accessToken;
    window.open(`/api/v1/students/${studentId}/icard?token=${token}`, '_blank');
    toast.success('I-Card opened in new tab!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-sans">Students Directory</h1>
        <p className="text-gray-500">View and manage student profiles, boarding details, and parent contacts.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 border border-gray-200 rounded-2xl shadow-sm">
        <div className="relative max-w-xs w-full flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-indigo-600"
            placeholder="Search name or admission no..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            className="border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
            value={classFilter}
            onChange={e => { setClassFilter(e.target.value); setSectionFilter(''); }}
          >
            <option value="">All Classes</option>
            {classes.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          {classFilter && (() => {
            const cls = classes.find(c => c._id === classFilter);
            return cls && cls.sections && cls.sections.length > 0 ? (
              <select
                className="border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                value={sectionFilter}
                onChange={e => setSectionFilter(e.target.value)}
              >
                <option value="">All Sections</option>
                {cls.sections.map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            ) : null;
          })()}

          <select
            className="border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
            value={genderFilter}
            onChange={e => setGenderFilter(e.target.value)}
          >
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          <select
            className="border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
            value={boardingFilter}
            onChange={e => setBoardingFilter(e.target.value)}
          >
            <option value="">All Students</option>
            <option value="true">Boarders</option>
            <option value="false">Day Scholars</option>
          </select>

          <select
            className="border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="active">Active</option>
            <option value="alumni">Alumni</option>
            <option value="transferred">Transferred</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>

      {/* Students List Grid / Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-300">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading student directory...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-200">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Admission Number</th>
                  <th className="px-6 py-4">Class & Section</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Boarding</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {students.map(student => (
                  <tr key={student._id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-full flex-shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{student.name}</div>
                        <div className="text-xs text-gray-400">Roll: {student.rollNumber || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-500 text-xs">{student.admissionNumber}</td>
                    <td className="px-6 py-4 font-semibold text-gray-700">
                      {student.class ? (student.class.name || student.class) : 'N/A'} - {student.section || 'A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        student.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        student.isBoarding ? 'bg-teal-50 text-teal-700' : 'bg-gray-50 text-gray-500'
                      }`}>
                        {student.isBoarding ? 'Resident' : 'Day Scholar'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => { setSelectedStudent(student); setShowDrawer(true); }}
                          className="p-1.5 hover:bg-gray-100 text-indigo-600 hover:text-indigo-800 rounded-lg transition"
                          title="View Full Profile"
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => handleDownloadICard(student._id, student.name)}
                          className="p-1.5 hover:bg-gray-100 text-emerald-600 hover:text-emerald-800 rounded-lg transition"
                          title="Download I-Card"
                        >
                          <CreditCard className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-400">No student profiles found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL PROFILE DRAWER (SLIDE-OVER) */}
      {showDrawer && selectedStudent && (
        <div className="fixed inset-0 overflow-hidden z-50 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-xs" onClick={() => setShowDrawer(false)} />
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{selectedStudent.name}</h3>
                  <p className="text-xs text-gray-500">Admitted: {selectedStudent.admissionDate ? new Date(selectedStudent.admissionDate).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
              <button onClick={() => setShowDrawer(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold font-sans">&times;</button>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
              
              {/* Profile Meta */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider">Registration Details</h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div>
                    <span className="text-xs text-gray-400 block">Admission Number</span>
                    <span className="font-semibold text-gray-800">{selectedStudent.admissionNumber}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block">Class & Section</span>
                    <span className="font-semibold text-gray-800">{selectedStudent.class?.name || selectedStudent.class} - {selectedStudent.section}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block">Roll Number</span>
                    <span className="font-semibold text-gray-800">{selectedStudent.rollNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block">DOB</span>
                    <span className="font-semibold text-gray-800">{new Date(selectedStudent.dob).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Parents Details */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider">Family Information</h4>
                <div className="space-y-4">
                  {selectedStudent.father?.name && (
                    <div className="border border-gray-100 p-4 rounded-2xl">
                      <div className="font-bold text-gray-700">Father: {selectedStudent.father.name}</div>
                      <div className="text-xs text-gray-500 mt-1 flex flex-col gap-1">
                        <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {selectedStudent.father.phone || 'N/A'}</span>
                        <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {selectedStudent.father.email || 'N/A'}</span>
                      </div>
                    </div>
                  )}
                  {selectedStudent.mother?.name && (
                    <div className="border border-gray-100 p-4 rounded-2xl">
                      <div className="font-bold text-gray-700">Mother: {selectedStudent.mother.name}</div>
                      <div className="text-xs text-gray-500 mt-1 flex flex-col gap-1">
                        <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {selectedStudent.mother.phone || 'N/A'}</span>
                        <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {selectedStudent.mother.email || 'N/A'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              {selectedStudent.address?.line1 && (
                <div className="space-y-3">
                  <h4 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider">Postal Address</h4>
                  <div className="flex gap-2 items-start text-gray-600 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <MapPin className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div>{selectedStudent.address.line1}</div>
                      <div className="text-xs text-gray-400">{selectedStudent.address.city}, {selectedStudent.address.state} - {selectedStudent.address.pincode}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Module Bindings */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider">Facility Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 border border-gray-100 rounded-xl">
                    <span className="flex items-center gap-2 font-semibold text-gray-700"><Building2 className="w-4.5 h-4.5 text-teal-600" /> Boarding Status</span>
                    <span className="text-xs font-bold text-gray-600">{selectedStudent.isBoarding ? 'Resident' : 'Day Scholar'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border border-gray-100 rounded-xl">
                    <span className="flex items-center gap-2 font-semibold text-gray-700"><Bus className="w-4.5 h-4.5 text-cyan-600" /> Transport Route</span>
                    <span className="text-xs font-bold text-gray-600">{selectedStudent.transportRoute ? 'Delhi NCR Route' : 'None'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border border-gray-100 rounded-xl">
                    <span className="flex items-center gap-2 font-semibold text-gray-700"><Library className="w-4.5 h-4.5 text-purple-600" /> Library Card</span>
                    <span className="text-xs font-bold text-gray-600">{selectedStudent.libraryCardNo || 'Not Issued'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            {user.role === 'principal' && (
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-2">
                <button
                  onClick={() => handleDownloadICard(selectedStudent._id, selectedStudent.name)}
                  className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <CreditCard className="w-4 h-4" /> Download I-Card
                </button>
                <button
                  onClick={() => handleDeleteStudent(selectedStudent._id)}
                  className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Trash2 className="w-4 h-4" /> Delete Profile
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
