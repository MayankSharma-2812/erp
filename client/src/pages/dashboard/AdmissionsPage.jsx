import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'sonner';
import {
  Search,
  UserPlus,
  ArrowRight,
  TrendingUp,
  FileCheck,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const AdmissionsPage = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [classes, setClasses] = useState([]); // Loaded from academics
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');

  // Modals state
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Form states
  const [enquiryForm, setEnquiryForm] = useState({
    studentName: '',
    dob: '',
    gender: 'male',
    classAppliedFor: '',
    fatherName: '',
    motherName: '',
    contactPhone: '',
    contactEmail: '',
    currentSchool: '',
    enquirySource: 'walk-in',
  });

  const [testForm, setTestForm] = useState({
    testDate: '',
    testScore: 0,
    testRemarks: '',
  });

  const [allocateForm, setAllocateForm] = useState({
    seatAllocated: '',
    decisionNote: '',
    stage: 'offer_sent', // offer_sent, waitlisted, rejected
  });

  const [confirmForm, setConfirmForm] = useState({
    classId: '',
    section: 'A',
    session: '2025-26',
  });

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admissions/enquiries', {
        params: {
          stage: stageFilter || undefined,
          classAppliedFor: classFilter || undefined,
          studentName: search || undefined,
        },
      });
      setEnquiries(response.data.data);
    } catch (error) {
      toast.error('Failed to load enquiries');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await api.get('/academics/classes');
      setClasses(response.data.data);
      if (response.data.data.length > 0) {
        setConfirmForm((prev) => ({ ...prev, classId: response.data.data[0]._id }));
      }
    } catch (error) {
      console.error('Failed to load classes', error);
    }
  };

  useEffect(() => {
    fetchEnquiries();
    fetchClasses();
  }, [stageFilter, classFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEnquiries();
  };

  const handleCreateEnquiry = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admissions/enquiries', enquiryForm);
      toast.success('Enquiry registered successfully');
      setIsEnquiryModalOpen(false);
      setEnquiryForm({
        studentName: '',
        dob: '',
        gender: 'male',
        classAppliedFor: '',
        fatherName: '',
        motherName: '',
        contactPhone: '',
        contactEmail: '',
        currentSchool: '',
        enquirySource: 'walk-in',
      });
      fetchEnquiries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create enquiry');
    }
  };

  const handleApply = async (id) => {
    try {
      const response = await api.post(`/admissions/enquiries/${id}/apply`);
      toast.success(response.data.message);
      setSelectedEnquiry(response.data.data);
      fetchEnquiries();
    } catch (error) {
      toast.error('Failed to progress stage to applied');
    }
  };

  const handleTestScore = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(
        `/admissions/enquiries/${selectedEnquiry._id}/test`,
        testForm
      );
      toast.success(response.data.message);
      setSelectedEnquiry(response.data.data);
      setIsTestModalOpen(false);
      fetchEnquiries();
    } catch (error) {
      toast.error('Failed to submit test scores');
    }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(
        `/admissions/enquiries/${selectedEnquiry._id}/allocate`,
        allocateForm
      );
      toast.success(response.data.message);
      setSelectedEnquiry(response.data.data);
      setIsAllocateModalOpen(false);
      fetchEnquiries();
    } catch (error) {
      toast.error('Failed to allocate seat');
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(
        `/admissions/enquiries/${selectedEnquiry._id}/confirm`,
        confirmForm
      );
      toast.success(response.data.message);
      setSelectedEnquiry(response.data.data.admission);
      setIsConfirmModalOpen(false);
      fetchEnquiries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to confirm admission');
    }
  };

  const getStageBadge = (stage) => {
    const styles = {
      enquiry: 'bg-blue-50 text-blue-700 border-blue-200',
      applied: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      test_scheduled: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      test_appeared: 'bg-purple-50 text-purple-700 border-purple-200',
      offer_pending: 'bg-orange-50 text-orange-700 border-orange-200',
      offer_sent: 'bg-pink-50 text-pink-700 border-pink-200',
      confirmed: 'bg-green-50 text-green-700 border-green-200',
      rejected: 'bg-red-50 text-red-700 border-red-200',
      waitlisted: 'bg-slate-100 text-slate-700 border-slate-300',
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border capitalize ${styles[stage] || 'bg-gray-50'}`}>
        {stage?.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Admissions Dashboard</h1>
          <p className="text-sm text-gray-500 font-medium">Manage student enquiries, tests, offers, and enrollments.</p>
        </div>
        <button
          onClick={() => setIsEnquiryModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors self-start md:self-auto shadow-sm"
        >
          <UserPlus className="h-4 w-4" />
          <span>New Enquiry</span>
        </button>
      </div>

      {/* Filter and Search Row */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by student name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
          />
          <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-gray-400" />
        </form>

        <div className="flex items-center gap-3">
          {/* Stage Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="border border-gray-200 rounded-lg text-xs font-semibold p-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="">All Stages</option>
              <option value="enquiry">Enquiry</option>
              <option value="applied">Applied</option>
              <option value="test_appeared">Test Appeared</option>
              <option value="offer_sent">Offer Sent</option>
              <option value="confirmed">Confirmed</option>
              <option value="waitlisted">Waitlisted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Class Filter */}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="border border-gray-200 rounded-lg text-xs font-semibold p-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="">All Classes</option>
            <option value="1">Class 1</option>
            <option value="5">Class 5</option>
            <option value="9">Class 9</option>
            <option value="10">Class 10</option>
            <option value="11">Class 11</option>
            <option value="12">Class 12</option>
          </select>
        </div>
      </div>

      {/* Main Grid: List left, detail right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Enquiries List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden lg:col-span-2">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
            </div>
          ) : enquiries.length === 0 ? (
            <div className="p-12 text-center text-gray-500 font-medium">
              No admission enquiries found matching the filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Class</th>
                    <th className="px-6 py-4">Stage</th>
                    <th className="px-6 py-4">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm font-medium text-gray-700">
                  {enquiries.map((enq) => (
                    <tr
                      key={enq._id}
                      onClick={() => {
                        setSelectedEnquiry(enq);
                        setTestForm({ testDate: enq.testDate ? enq.testDate.split('T')[0] : '', testScore: enq.testScore || 0, testRemarks: enq.testRemarks || '' });
                        setAllocateForm({ seatAllocated: enq.seatAllocated || '', decisionNote: enq.decisionNote || '', stage: enq.stage === 'test_appeared' ? 'offer_sent' : enq.stage });
                      }}
                      className={`hover:bg-gray-50/80 cursor-pointer transition-colors ${
                        selectedEnquiry?._id === enq._id ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-bold text-gray-900">{enq.enquiryId}</td>
                      <td className="px-6 py-4">{enq.studentName}</td>
                      <td className="px-6 py-4">Class {enq.classAppliedFor}</td>
                      <td className="px-6 py-4">{getStageBadge(enq.stage)}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-500">{enq.contactPhone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected enquiry detail file */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6 sticky top-24">
          {selectedEnquiry ? (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400">Application File</span>
                  {getStageBadge(selectedEnquiry.stage)}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mt-2">{selectedEnquiry.studentName}</h3>
                <p className="text-xs text-gray-500 font-semibold mt-1">Class applied: Class {selectedEnquiry.classAppliedFor}</p>
              </div>

              {/* Contact/Parent details */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Father's Name</span>
                  <span className="font-bold text-gray-800">{selectedEnquiry.fatherName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Mother's Name</span>
                  <span className="font-bold text-gray-800">{selectedEnquiry.motherName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Contact Phone</span>
                  <span className="font-bold text-gray-800">{selectedEnquiry.contactPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Source</span>
                  <span className="font-bold text-gray-800 capitalize">{selectedEnquiry.enquirySource}</span>
                </div>
              </div>

              {/* Entrance Test Scores */}
              {selectedEnquiry.stage !== 'enquiry' && selectedEnquiry.stage !== 'applied' && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2 text-xs">
                  <span className="font-bold text-gray-800 uppercase tracking-wide text-[10px]">Entrance Test Results</span>
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-500 font-medium">Score</span>
                    <span className="font-bold text-gray-800">{selectedEnquiry.testScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Remarks</span>
                    <span className="font-bold text-gray-800 text-right max-w-[150px] truncate" title={selectedEnquiry.testRemarks}>
                      {selectedEnquiry.testRemarks || 'N/A'}
                    </span>
                  </div>
                </div>
              )}

              {/* Seat Details */}
              {selectedEnquiry.seatAllocated && (
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50 space-y-2 text-xs">
                  <span className="font-bold text-indigo-800 uppercase tracking-wide text-[10px]">Seat Offer Details</span>
                  <div className="flex justify-between mt-1">
                    <span className="text-indigo-600 font-medium">Allocated Class</span>
                    <span className="font-bold text-indigo-950">{selectedEnquiry.seatAllocated}</span>
                  </div>
                </div>
              )}

              {/* Document details (auto created Student link) */}
              {selectedEnquiry.studentId && (
                <div className="bg-green-50 p-4 rounded-xl border border-green-100 space-y-2 text-xs">
                  <div className="flex items-center space-x-2 text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-bold text-[10px] uppercase tracking-wide">Student Account Created</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-green-600 font-medium">Admission Number</span>
                    <span className="font-bold text-green-900">{selectedEnquiry.studentId.admissionNumber || 'Created'}</span>
                  </div>
                </div>
              )}

              {/* Stage Progress Actions */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                {selectedEnquiry.stage === 'enquiry' && (
                  <button
                    onClick={() => handleApply(selectedEnquiry._id)}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                  >
                    <span>Convert to Active Application</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}

                {selectedEnquiry.stage === 'applied' && (
                  <button
                    onClick={() => setIsTestModalOpen(true)}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Enter Test Score</span>
                  </button>
                )}

                {selectedEnquiry.stage === 'test_appeared' && (
                  <button
                    onClick={() => setIsAllocateModalOpen(true)}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>Seat Allocation Decision</span>
                  </button>
                )}

                {selectedEnquiry.stage === 'offer_sent' && (
                  <button
                    onClick={() => setIsConfirmModalOpen(true)}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Confirm Admission</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 text-sm font-medium">
              Select an applicant file to see options.
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Create Enquiry */}
      {isEnquiryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-lg text-gray-900">Register New Enquiry</h3>
              <button onClick={() => setIsEnquiryModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateEnquiry} className="space-y-4 text-xs font-semibold text-gray-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Student Name *</label>
                  <input
                    type="text"
                    required
                    value={enquiryForm.studentName}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, studentName: e.target.value })}
                    className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label>Class Applied For *</label>
                  <select
                    required
                    value={enquiryForm.classAppliedFor}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, classAppliedFor: e.target.value })}
                    className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                  >
                    <option value="">Select Class</option>
                    <option value="1">Class 1</option>
                    <option value="5">Class 5</option>
                    <option value="9">Class 9</option>
                    <option value="10">Class 10</option>
                    <option value="11">Class 11</option>
                    <option value="12">Class 12</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={enquiryForm.dob}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, dob: e.target.value })}
                    className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label>Gender *</label>
                  <select
                    value={enquiryForm.gender}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, gender: e.target.value })}
                    className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Father's Name *</label>
                  <input
                    type="text"
                    required
                    value={enquiryForm.fatherName}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, fatherName: e.target.value })}
                    className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label>Mother's Name *</label>
                  <input
                    type="text"
                    required
                    value={enquiryForm.motherName}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, motherName: e.target.value })}
                    className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Contact Phone *</label>
                  <input
                    type="text"
                    required
                    value={enquiryForm.contactPhone}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, contactPhone: e.target.value })}
                    className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div>
                  <label>Contact Email</label>
                  <input
                    type="email"
                    value={enquiryForm.contactEmail}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, contactEmail: e.target.value })}
                    className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>
              <div>
                <label>Current/Previous School</label>
                <input
                  type="text"
                  value={enquiryForm.currentSchool}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, currentSchool: e.target.value })}
                  className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all shadow-sm"
              >
                Register Enquiry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Enter Test Score */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wide">Entrance Exam Results</h3>
              <button onClick={() => setIsTestModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleTestScore} className="space-y-4 text-xs font-semibold text-gray-700">
              <div>
                <label>Test Date *</label>
                <input
                  type="date"
                  required
                  value={testForm.testDate}
                  onChange={(e) => setTestForm({ ...testForm, testDate: e.target.value })}
                  className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label>Test Score (Percentage %) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={testForm.testScore}
                  onChange={(e) => setTestForm({ ...testForm, testScore: parseInt(e.target.value) })}
                  className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label>Remarks</label>
                <textarea
                  value={testForm.testRemarks}
                  onChange={(e) => setTestForm({ ...testForm, testRemarks: e.target.value })}
                  className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  rows="3"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all"
              >
                Submit Scores
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Seat Allocation */}
      {isAllocateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wide">Seat Allocation Offer</h3>
              <button onClick={() => setIsAllocateModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleAllocate} className="space-y-4 text-xs font-semibold text-gray-700">
              <div>
                <label>Seat Allocated (e.g. Class XII - A) *</label>
                <input
                  type="text"
                  required
                  value={allocateForm.seatAllocated}
                  onChange={(e) => setAllocateForm({ ...allocateForm, seatAllocated: e.target.value })}
                  className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="e.g. Class XII - A"
                />
              </div>
              <div>
                <label>Offer Type / Stage *</label>
                <select
                  value={allocateForm.stage}
                  onChange={(e) => setAllocateForm({ ...allocateForm, stage: e.target.value })}
                  className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                >
                  <option value="offer_sent">Send Seat Offer</option>
                  <option value="waitlisted">Waitlist Applicant</option>
                  <option value="rejected">Reject Application</option>
                </select>
              </div>
              <div>
                <label>Decision Remarks</label>
                <textarea
                  value={allocateForm.decisionNote}
                  onChange={(e) => setAllocateForm({ ...allocateForm, decisionNote: e.target.value })}
                  className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  rows="3"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all"
              >
                Submit Decision
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Confirm Admission */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wide">Confirm Admission</h3>
              <button onClick={() => setIsConfirmModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleConfirm} className="space-y-4 text-xs font-semibold text-gray-700">
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-start space-x-2 text-amber-800">
                <AlertCircle className="h-4.5 w-4.5 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] leading-relaxed">
                  Confirming admission will instantly generate a new student record and allocate a unique admission number. Outbound notifications are disabled.
                </p>
              </div>
              <div>
                <label>Class Link *</label>
                <select
                  required
                  value={confirmForm.classId}
                  onChange={(e) => setConfirmForm({ ...confirmForm, classId: e.target.value })}
                  className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                >
                  <option value="">Select Class Link</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name} ({cls.session})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Section *</label>
                <input
                  type="text"
                  required
                  value={confirmForm.section}
                  onChange={(e) => setConfirmForm({ ...confirmForm, section: e.target.value })}
                  className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="e.g. A"
                />
              </div>
              <div>
                <label>Session *</label>
                <input
                  type="text"
                  required
                  value={confirmForm.session}
                  onChange={(e) => setConfirmForm({ ...confirmForm, session: e.target.value })}
                  className="w-full mt-1.5 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="e.g. 2025-26"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all"
              >
                Confirm Enrollment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdmissionsPage;
