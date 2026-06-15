import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import {
  HeartPulse,
  PlusCircle,
  Search,
  ClipboardList,
  AlertTriangle,
  UserCheck,
  RefreshCw,
  Eye,
  Info,
} from 'lucide-react';

export default function HealthPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('visits');
  const [students, setStudents] = useState([]);
  const [visits, setVisits] = useState([]);
  const [activeSickbay, setActiveSickbay] = useState([]);

  const [loading, setLoading] = useState(false);

  // Forms
  const [showAddVisit, setShowAddVisit] = useState(false);
  const [newVisit, setNewVisit] = useState({
    student: '',
    complaint: '',
    examination: '',
    diagnosis: '',
    treatment: '',
    medications: [{ medication: '', dosage: '', quantity: 1 }],
  });

  const [showProfile, setShowProfile] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState({
    studentId: '',
    bloodGroup: '',
    allergies: '',
    chronicConditions: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
  });

  const [showAdmit, setShowAdmit] = useState(false);
  const [newAdmit, setNewAdmit] = useState({
    student: '',
    admitDate: new Date().toISOString().split('T')[0],
    admitTime: '10:00 AM',
    condition: '',
    bed: '',
  });

  const [progressNotes, setProgressNotes] = useState({});

  useEffect(() => {
    fetchStudents();
    fetchVisits();
  }, []);

  useEffect(() => {
    if (activeTab === 'sickbay') fetchSickbay();
  }, [activeTab]);

  const fetchStudents = async () => {
    try {
      const res = await axios.get('/students');
      if (res.data && res.data.success) {
        setStudents(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/health/visits');
      if (res.data && res.data.success) {
        setVisits(res.data.data);
      }
    } catch (e) {
      toast.error('Failed to load clinic visits');
    } finally {
      setLoading(false);
    }
  };

  const fetchSickbay = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/health/sickbay/active');
      if (res.data && res.data.success) {
        setActiveSickbay(res.data.data);
      }
    } catch (e) {
      toast.error('Failed to load active sickbay list');
    } finally {
      setLoading(false);
    }
  };

  const loadHealthProfile = async (studentId) => {
    try {
      const res = await axios.get(`/health/profile/${studentId}`);
      if (res.data && res.data.success) {
        const p = res.data.data;
        setSelectedProfile(p);
        setEditingProfile({
          studentId: p.student?._id || studentId,
          bloodGroup: p.bloodGroup || '',
          allergies: p.allergies?.join(', ') || '',
          chronicConditions: p.chronicConditions?.join(', ') || '',
          emergencyContactName: p.emergencyContact?.name || '',
          emergencyContactPhone: p.emergencyContact?.phone || '',
          emergencyContactRelation: p.emergencyContact?.relation || '',
        });
      } else {
        setSelectedProfile(null);
        setEditingProfile({
          studentId,
          bloodGroup: '',
          allergies: '',
          chronicConditions: '',
          emergencyContactName: '',
          emergencyContactPhone: '',
          emergencyContactRelation: '',
        });
      }
      setShowProfile(true);
    } catch (e) {
      // If profile not found, init empty
      setSelectedProfile(null);
      setEditingProfile({
        studentId,
        bloodGroup: '',
        allergies: '',
        chronicConditions: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelation: '',
      });
      setShowProfile(true);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const formatted = {
        studentId: editingProfile.studentId,
        bloodGroup: editingProfile.bloodGroup,
        allergies: editingProfile.allergies.split(',').map(a => a.trim()).filter(Boolean),
        chronicConditions: editingProfile.chronicConditions.split(',').map(a => a.trim()).filter(Boolean),
        emergencyContact: {
          name: editingProfile.emergencyContactName,
          phone: editingProfile.emergencyContactPhone,
          relation: editingProfile.emergencyContactRelation,
        },
      };
      const res = await axios.post('/health/profile', formatted);
      if (res.data && res.data.success) {
        toast.success('Health profile saved successfully');
        setShowProfile(false);
      }
    } catch (err) {
      toast.error('Failed to update health profile');
    }
  };

  const submitVisit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/health/visits', newVisit);
      if (res.data && res.data.success) {
        toast.success('Clinic visit logged successfully');
        setShowAddVisit(false);
        setNewVisit({
          student: '',
          complaint: '',
          examination: '',
          diagnosis: '',
          treatment: '',
          medications: [{ medication: '', dosage: '', quantity: 1 }],
        });
        fetchVisits();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log clinic visit');
    }
  };

  const submitSickbayAdmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/health/sickbay', newAdmit);
      if (res.data && res.data.success) {
        toast.success('Student admitted to sickbay');
        setShowAdmit(false);
        setNewAdmit({
          student: '',
          admitDate: new Date().toISOString().split('T')[0],
          admitTime: '10:00 AM',
          condition: '',
          bed: '',
        });
        fetchSickbay();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to admit student');
    }
  };

  const handleAddMedication = () => {
    setNewVisit(prev => ({
      ...prev,
      medications: [...prev.medications, { medication: '', dosage: '', quantity: 1 }],
    }));
  };

  const handleRemoveMedication = (index) => {
    setNewVisit(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }));
  };

  const handleMedicationChange = (index, field, value) => {
    const updated = [...newVisit.medications];
    updated[index][field] = value;
    setNewVisit(prev => ({ ...prev, medications: updated }));
  };

  const handleDischarge = async (sickbayId) => {
    try {
      const res = await axios.put(`/health/sickbay/${sickbayId}/discharge`, {
        dischargeDate: new Date(),
        dischargeTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        followUp: 'Discharged in stable condition. Rest advised.',
      });
      if (res.data && res.data.success) {
        toast.success('Discharged student from sickbay');
        fetchSickbay();
      }
    } catch (e) {
      toast.error('Failed to process discharge');
    }
  };

  const handleAddProgressNote = async (sickbayId) => {
    const note = progressNotes[sickbayId];
    if (!note) {
      toast.warning('Please enter progress note text');
      return;
    }
    try {
      const res = await axios.put(`/health/sickbay/${sickbayId}/progress`, { note });
      if (res.data && res.data.success) {
        toast.success('Progress note recorded');
        setProgressNotes(prev => ({ ...prev, [sickbayId]: '' }));
        fetchSickbay();
      }
    } catch (e) {
      toast.error('Failed to add progress note');
    }
  };

  const isMedical = user && (user.role === 'medical_officer' || user.role === 'principal');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Clinic & Medical Log</h1>
          <p className="text-gray-500 mt-1">Record student clinic visits, hospital/sickbay bed check-ins, and health profiles.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveTab('visits')}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 outline-none ${
            activeTab === 'visits' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Clinic Visit Logs
        </button>
        <button
          onClick={() => setActiveTab('sickbay')}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 outline-none ${
            activeTab === 'sickbay' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Sickbay Admissions
        </button>
        <button
          onClick={() => setActiveTab('profiles')}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 outline-none ${
            activeTab === 'profiles' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Student Health Cards
        </button>
      </div>

      {/* Visits Tab */}
      {activeTab === 'visits' && (
        <div className="space-y-6">
          <div className="flex justify-end gap-2">
            {isMedical && (
              <button
                onClick={() => setShowAddVisit(true)}
                className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-1.5 text-sm shadow-sm"
              >
                <PlusCircle className="w-4 h-4" /> Log Clinic Visit
              </button>
            )}
          </div>

          {showAddVisit && (
            <form onSubmit={submitVisit} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Record Clinic Visit</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Select Student</label>
                  <select
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    value={newVisit.student}
                    onChange={e => setNewVisit(prev => ({ ...prev, student: e.target.value }))}
                  >
                    <option value="">Select Student</option>
                    {students.map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.admissionNumber})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Chief Complaint</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mild headache, feverish"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={newVisit.complaint}
                    onChange={e => setNewVisit(prev => ({ ...prev, complaint: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Examination / Vitals (Restricted)</label>
                  <input
                    type="text"
                    placeholder="Temp: 99.8F, BP: normal"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={newVisit.examination}
                    onChange={e => setNewVisit(prev => ({ ...prev, examination: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Diagnosis (Restricted)</label>
                  <input
                    type="text"
                    placeholder="Mild viral fever"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={newVisit.diagnosis}
                    onChange={e => setNewVisit(prev => ({ ...prev, diagnosis: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Treatment / Notes</label>
                  <input
                    type="text"
                    placeholder="Paracetamol administered. Rest advised."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={newVisit.treatment}
                    onChange={e => setNewVisit(prev => ({ ...prev, treatment: e.target.value }))}
                  />
                </div>
              </div>

              {/* Medication dispenser */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                  <span className="text-xs font-bold text-gray-650">Dispense Medications</span>
                  <button
                    type="button"
                    onClick={handleAddMedication}
                    className="text-xs font-semibold text-indigo-650 hover:text-indigo-850"
                  >
                    + Add Meds
                  </button>
                </div>

                {newVisit.medications.map((m, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-3 items-end bg-gray-50/50 p-3 rounded-lg border border-gray-200">
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-0.5">Medicine Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Paracetamol 500mg"
                        className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                        value={m.medication}
                        onChange={e => handleMedicationChange(idx, 'medication', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-0.5">Dosage / Frequency</label>
                      <input
                        type="text"
                        required
                        placeholder="1 tablet after food"
                        className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                        value={m.dosage}
                        onChange={e => handleMedicationChange(idx, 'dosage', e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <label className="block text-[10px] text-gray-500 mb-0.5">Quantity</label>
                        <input
                          type="number"
                          required
                          className="w-full border border-gray-300 rounded px-2.5 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                          value={m.quantity}
                          onChange={e => handleMedicationChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      {newVisit.medications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(idx)}
                          className="text-rose-600 hover:text-rose-800 text-xs font-bold pt-4"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setShowAddVisit(false)}
                  className="border border-gray-300 px-3.5 py-1.5 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-3.5 py-1.5 rounded-xl hover:bg-indigo-700"
                >
                  Log Visit
                </button>
              </div>
            </form>
          )}

          {/* Visits List */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500 flex justify-center items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" /> Loading Visit records...
              </div>
            ) : visits.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Complaint</th>
                      <th className="px-6 py-4">Diagnosis (Restricted)</th>
                      <th className="px-6 py-4">Treatment</th>
                      <th className="px-6 py-4">Attended By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {visits.map(v => (
                      <tr key={v._id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 text-gray-650">
                          {new Date(v.visitDate).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{v.student?.name}</div>
                          <div className="text-xs text-gray-400">Adm No: {v.student?.admissionNumber}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-750 font-medium">{v.complaint}</td>
                        <td className="px-6 py-4 text-gray-500">
                          <span className={v.diagnosis?.includes('RESTRICTED') ? 'text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-xs font-semibold' : 'font-semibold text-gray-800'}>
                            {v.diagnosis}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-650">{v.treatment}</td>
                        <td className="px-6 py-4 text-xs text-gray-400">{v.attendedBy?.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">No clinic visit records found.</div>
            )}
          </div>
        </div>
      )}

      {/* Sickbay Tab */}
      {activeTab === 'sickbay' && (
        <div className="space-y-6">
          <div className="flex justify-end gap-2">
            {isMedical && (
              <button
                onClick={() => setShowAdmit(true)}
                className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-1.5 text-sm shadow-sm"
              >
                <PlusCircle className="w-4 h-4" /> Admit to Sickbay
              </button>
            )}
          </div>

          {showAdmit && (
            <form onSubmit={submitSickbayAdmit} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Admit Student to Sickbay Bed</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Select Student</label>
                  <select
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    value={newAdmit.student}
                    onChange={e => setNewAdmit(prev => ({ ...prev, student: e.target.value }))}
                  >
                    <option value="">Select Student</option>
                    {students.map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.admissionNumber})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Admit Date</label>
                  <input
                    type="date"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={newAdmit.admitDate}
                    onChange={e => setNewAdmit(prev => ({ ...prev, admitDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Condition / Reason</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. High fever, observation"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={newAdmit.condition}
                    onChange={e => setNewAdmit(prev => ({ ...prev, condition: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Bed Number / Room</label>
                  <input
                    type="text"
                    placeholder="e.g. Bed B"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={newAdmit.bed}
                    onChange={e => setNewAdmit(prev => ({ ...prev, bed: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setShowAdmit(false)}
                  className="border border-gray-300 px-3.5 py-1.5 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-3.5 py-1.5 rounded-xl hover:bg-indigo-700"
                >
                  Confirm Admission
                </button>
              </div>
            </form>
          )}

          {/* Active Sickbay Grid */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 font-bold text-gray-900">Current Occupants</div>

            {loading ? (
              <div className="p-8 text-center text-gray-500 flex justify-center items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" /> Loading sickbay register...
              </div>
            ) : activeSickbay.length > 0 ? (
              <div className="divide-y divide-gray-150">
                {activeSickbay.map(item => (
                  <div key={item._id} className="p-6 hover:bg-gray-50/50 flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{item.student?.name}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Admitted: {new Date(item.admitDate).toLocaleDateString()} {item.admitTime || ''} | Bed: {item.bed || 'Unassigned'}
                          </p>
                        </div>
                        <span className="inline-flex text-xs font-semibold bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full border border-rose-100">
                          Condition: {item.condition}
                        </span>
                      </div>

                      {/* Progress notes log */}
                      <div className="bg-gray-50 p-4 rounded-xl space-y-2 border border-gray-150">
                        <div className="text-xs font-bold text-gray-450 uppercase tracking-wider">Progress Notes</div>
                        {item.progressNotes?.length > 0 ? (
                          <div className="space-y-1.5">
                            {item.progressNotes.map((note, nidx) => (
                              <div key={nidx} className="text-xs text-gray-650">
                                • <span className={note.note?.includes('RESTRICTED') ? 'text-amber-600 bg-amber-50 px-1 py-0.2 rounded text-[10px] font-semibold' : 'font-medium text-gray-800'}>{note.note}</span> ({new Date(note.date).toLocaleDateString()})
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 italic">No notes logged yet.</div>
                        )}

                        {isMedical && (
                          <div className="flex gap-2 pt-2 border-t border-gray-200 mt-2">
                            <input
                              type="text"
                              placeholder="Type note to add..."
                              className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1 text-xs outline-none bg-white focus:ring-1 focus:ring-indigo-500"
                              value={progressNotes[item._id] || ''}
                              onChange={e => setProgressNotes(prev => ({ ...prev, [item._id]: e.target.value }))}
                            />
                            <button
                              onClick={() => handleAddProgressNote(item._id)}
                              className="bg-indigo-600 text-white font-semibold px-3 py-1 rounded-lg text-xs hover:bg-indigo-700"
                            >
                              Add Note
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {isMedical && (
                      <div className="flex items-center justify-end md:w-32">
                        <button
                          onClick={() => handleDischarge(item._id)}
                          className="bg-emerald-50 text-emerald-700 font-semibold px-3.5 py-2 rounded-xl text-xs hover:bg-emerald-100 active:bg-emerald-200 transition-colors w-full text-center"
                        >
                          Discharge / Check-out
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">No active students admitted to sickbay.</div>
            )}
          </div>
        </div>
      )}

      {/* Profiles Tab */}
      {activeTab === 'profiles' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">Search Student Health Profile Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-650 mb-1">Select Student</label>
                <select
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  value={editingProfile.studentId}
                  onChange={e => loadHealthProfile(e.target.value)}
                >
                  <option value="">Select Student</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.admissionNumber})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {showProfile && (
            <form onSubmit={saveProfile} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Edit Medical Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Blood Group</label>
                  <input
                    type="text"
                    placeholder="e.g. O+ve"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={editingProfile.bloodGroup}
                    onChange={e => setEditingProfile(prev => ({ ...prev, bloodGroup: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Allergies (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Peanuts, Dust"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={editingProfile.allergies}
                    onChange={e => setEditingProfile(prev => ({ ...prev, allergies: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Chronic Conditions (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Asthma"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={editingProfile.chronicConditions}
                    onChange={e => setEditingProfile(prev => ({ ...prev, chronicConditions: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-100 pt-4">
                <div className="md:col-span-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Emergency Medical Contact
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Contact Name</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={editingProfile.emergencyContactName}
                    onChange={e => setEditingProfile(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Phone Number</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={editingProfile.emergencyContactPhone}
                    onChange={e => setEditingProfile(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Relation</label>
                  <input
                    type="text"
                    placeholder="e.g. Father, Mother"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={editingProfile.emergencyContactRelation}
                    onChange={e => setEditingProfile(prev => ({ ...prev, emergencyContactRelation: e.target.value }))}
                  />
                </div>
              </div>

              {isMedical && (
                <div className="flex justify-end gap-2 text-sm font-semibold pt-2">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700"
                  >
                    Save Health Card
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
}
