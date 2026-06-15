import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import {
  FileSpreadsheet,
  Save,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Download,
  Search,
  UserCheck,
  RotateCcw
} from 'lucide-react';

const MarksEntryPage = () => {
  const { user: currentUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Lists
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [resultsMap, setResultsMap] = useState({}); // studentId -> { theoryMarks, practicalMarks, status, resultId, approvedBy }

  // Selections
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // Lock status
  const [examStatus, setExamStatus] = useState('draft');

  // Load initial options
  useEffect(() => {
    fetchInitData();
  }, []);

  // Fetch subjects when class changes
  useEffect(() => {
    if (selectedClass) {
      fetchSubjects();
    }
  }, [selectedClass]);

  // Trigger search when exam, class, section, or subject changes
  useEffect(() => {
    if (selectedExam && selectedClass && selectedSection && selectedSubject) {
      handleSearch();
    } else {
      setStudents([]);
      setResultsMap({});
    }
  }, [selectedExam, selectedClass, selectedSection, selectedSubject]);

  const fetchInitData = async () => {
    try {
      setLoading(true);
      const [examRes, classRes] = await Promise.all([
        api.get('/exams'),
        api.get('/academics/classes'),
      ]);

      setExams(examRes.data.data);
      setClasses(classRes.data.data);

      if (examRes.data.data.length > 0) {
        setSelectedExam(examRes.data.data[0]._id);
        setExamStatus(examRes.data.data[0].status);
      }
      if (classRes.data.data.length > 0) {
        setSelectedClass(classRes.data.data[0]._id);
        const sections = classRes.data.data[0].sections;
        if (sections && sections.length > 0) {
          setSelectedSection(sections[0]);
        }
      }
    } catch (err) {
      toast.error('Failed to load classes or exams');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const params = { classId: selectedClass };
      // Restrict subject list if subject teacher
      if (currentUser.role === 'subject_teacher') {
        params.teacherId = currentUser.id;
      }
      const res = await api.get('/academics/subjects', { params });
      setSubjects(res.data.data);
      if (res.data.data.length > 0) {
        setSelectedSubject(res.data.data[0]._id);
      } else {
        setSelectedSubject('');
      }
    } catch (err) {
      toast.error('Failed to load subjects');
    }
  };

  const handleExamChange = (e) => {
    const examId = e.target.value;
    setSelectedExam(examId);
    const ex = exams.find((x) => x._id === examId);
    if (ex) setExamStatus(ex.status);
  };

  const handleClassChange = (e) => {
    const classId = e.target.value;
    setSelectedClass(classId);
    const found = classes.find((c) => c._id === classId);
    if (found && found.sections && found.sections.length > 0) {
      setSelectedSection(found.sections[0]);
    } else {
      setSelectedSection('');
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      // Fetch roster of students in the class/section
      const studentRes = await api.get('/students', {
        params: { classId: selectedClass, section: selectedSection, status: 'active' },
      });
      const roster = studentRes.data.data;
      setStudents(roster);

      // Fetch existing results for this subject/exam
      const resultsRes = await api.get(`/exams/${selectedExam}/results`, {
        params: { classId: selectedClass, section: selectedSection, subjectId: selectedSubject },
      });
      const existingResults = resultsRes.data.data || [];

      // Map existing results
      const resMap = {};
      roster.forEach((s) => {
        const found = existingResults.find((r) => r.student?._id === s._id || r.student === s._id);
        resMap[s._id] = {
          theoryMarks: found ? found.theoryMarks ?? '' : '',
          practicalMarks: found ? found.practicalMarks ?? '' : '',
          status: found ? found.status : 'pass',
          resultId: found ? found._id : null,
          approvedBy: found ? found.approvedBy : null,
          reEvalRequested: found ? found.reEvalRequested : false,
        };
      });
      setResultsMap(resMap);
    } catch (err) {
      toast.error('Failed to search student results roster');
    } finally {
      setLoading(false);
    }
  };

  const handleMarksChange = (studentId, field, val) => {
    const num = val === '' ? '' : Math.max(0, Number(val));
    setResultsMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: num,
      },
    }));
  };

  const handleStatusChange = (studentId, statusVal) => {
    setResultsMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: statusVal,
      },
    }));
  };

  const handleSaveMarks = async () => {
    try {
      setLoading(true);
      const resultsPayload = Object.keys(resultsMap).map((sid) => ({
        studentId: sid,
        theoryMarks: resultsMap[sid].theoryMarks === '' ? 0 : Number(resultsMap[sid].theoryMarks),
        practicalMarks: resultsMap[sid].practicalMarks === '' ? 0 : Number(resultsMap[sid].practicalMarks),
        status: resultsMap[sid].status,
        maxMarks: 100,
      }));

      const res = await api.post(`/exams/${selectedExam}/results`, {
        classId: selectedClass,
        section: selectedSection,
        subjectId: selectedSubject,
        results: resultsPayload,
      });

      toast.success(res.data.message || 'Marks saved successfully.');
      handleSearch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save marks');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveBatch = async () => {
    if (!window.confirm('Approve all marks for this class section and subject? This sets them as reviewed.')) return;
    try {
      setLoading(true);
      const res = await api.post(`/exams/${selectedExam}/results/approve`, {
        classId: selectedClass,
        section: selectedSection,
        subjectId: selectedSubject,
      });
      toast.success(res.data.message || 'Batch approved');
      handleSearch();
    } catch (err) {
      toast.error('Failed to approve batch');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReEval = async (resultId) => {
    if (!window.confirm('Unlock this result for re-evaluation?')) return;
    try {
      setLoading(true);
      const res = await api.post(`/exams/${selectedExam}/results/${resultId}/reeval`);
      toast.success(res.data.message || 'Re-evaluation requested and unlocked');
      handleSearch();
    } catch (err) {
      toast.error('Failed to unlock result');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReportCard = (studentId) => {
    const url = `/api/v1/exams/${selectedExam}/report-card/${studentId}`;
    window.open(url, '_blank');
  };

  const isLocked = (studentId) => {
    // Principal can edit anything
    if (currentUser.role === 'principal') return false;

    // Locked if exam is published
    if (examStatus === 'published') return true;

    // Locked if approved by controller, unless reEvalRequested is true
    const record = resultsMap[studentId];
    if (record && record.approvedBy && !record.reEvalRequested) return true;

    return false;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Marks Entry & Review</h1>
          <p className="text-gray-500 mt-1">Record marks, review grades, approve batch entries, and print report cards.</p>
        </div>

        {/* Filters Panel */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm">
          {/* Exam Select */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Exam</span>
            <select
              value={selectedExam}
              onChange={handleExamChange}
              className="text-xs font-semibold text-gray-800 bg-transparent border-none focus:outline-none"
            >
              {exams.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>

          <div className="h-6 w-px bg-gray-200" />

          {/* Class Select */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Class</span>
            <select
              value={selectedClass}
              onChange={handleClassChange}
              className="text-xs font-semibold text-gray-800 bg-transparent border-none focus:outline-none"
            >
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="h-6 w-px bg-gray-200" />

          {/* Section Select */}
          {selectedClass && (
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Section</span>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="text-xs font-semibold text-gray-800 bg-transparent border-none focus:outline-none"
              >
                {classes
                  .find((c) => c._id === selectedClass)
                  ?.sections?.map((sec) => (
                    <option key={sec} value={sec}>
                      Section {sec}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="h-6 w-px bg-gray-200" />

          {/* Subject Select */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Subject</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="text-xs font-semibold text-gray-800 bg-transparent border-none focus:outline-none min-w-[100px]"
            >
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Roster & Controls Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6">
        {loading && students.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="animate-spin text-indigo-600 mb-2" size={32} />
            <span>Loading marks sheet...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="text-gray-400" size={20} />
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Marks Roster Sheet</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Exam Status: <span className="font-bold text-indigo-600 uppercase">{examStatus}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {/* Save Draft */}
                {students.length > 0 && examStatus !== 'published' && (
                  <button
                    onClick={handleSaveMarks}
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1"
                  >
                    <Save size={14} />
                    Save Marks Entries
                  </button>
                )}

                {/* Approve Marks */}
                {students.length > 0 &&
                  (currentUser.role === 'principal' || currentUser.role === 'exam_controller') && (
                    <button
                      onClick={handleApproveBatch}
                      className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1"
                    >
                      <CheckCircle2 size={14} />
                      Approve Batch Marks
                    </button>
                  )}
              </div>
            </div>

            {/* Warning alerts */}
            {examStatus === 'published' && (
              <div className="bg-amber-50 border border-amber-250 p-4 rounded-xl flex gap-2.5 text-amber-800">
                <AlertTriangle className="shrink-0 mt-0.5 text-amber-600" size={18} />
                <div>
                  <h5 className="font-bold text-xs">Marks sheet locked (Published)</h5>
                  <p className="text-[11px] mt-0.5">
                    This exam is published. Edits are disabled unless unlocked individually for re-evaluation by the Principal.
                  </p>
                </div>
              </div>
            )}

            {students.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                No active students or records found. Ensure filters are configured properly.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="p-3">Adm No.</th>
                      <th className="p-3">Roll No.</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3 w-28">Theory Marks</th>
                      <th className="p-3 w-28">Practical Marks</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-center">Approved</th>
                      <th className="p-3 text-right">Action / Report Card</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map((student) => {
                      const rec = resultsMap[student._id] || {};
                      const editLocked = isLocked(student._id);

                      return (
                        <tr key={student._id} className="hover:bg-gray-50/50">
                          <td className="p-3 font-mono text-gray-500">{student.admissionNumber}</td>
                          <td className="p-3 text-gray-600">{student.rollNumber || '--'}</td>
                          <td className="p-3 font-bold text-gray-800">{student.name}</td>
                          <td className="p-3">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              disabled={editLocked}
                              value={rec.theoryMarks ?? ''}
                              onChange={(e) => handleMarksChange(student._id, 'theoryMarks', e.target.value)}
                              className="w-20 px-2 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                              placeholder="Max 80"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              disabled={editLocked}
                              value={rec.practicalMarks ?? ''}
                              onChange={(e) => handleMarksChange(student._id, 'practicalMarks', e.target.value)}
                              className="w-20 px-2 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                              placeholder="Max 20"
                            />
                          </td>
                          <td className="p-3">
                            <select
                              disabled={editLocked}
                              value={rec.status || 'pass'}
                              onChange={(e) => handleStatusChange(student._id, e.target.value)}
                              className="px-2 py-1 bg-white border border-gray-300 rounded-lg text-[11px] font-semibold focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
                            >
                              <option value="pass">Present</option>
                              <option value="absent">Absent</option>
                              <option value="withheld">Withheld</option>
                            </select>
                          </td>
                          <td className="p-3 text-center">
                            {rec.approvedBy ? (
                              <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-150 text-[10px]">
                                <UserCheck size={11} /> Approved
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full font-bold border border-gray-200 text-[10px]">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right space-x-2">
                            {/* Unlock re-eval */}
                            {rec.approvedBy && currentUser.role === 'principal' && !rec.reEvalRequested && (
                              <button
                                onClick={() => handleRequestReEval(rec.resultId)}
                                className="text-amber-600 hover:text-amber-800 text-xs font-semibold inline-flex items-center gap-0.5"
                                title="Unlock marks editing for re-evaluation"
                              >
                                <RotateCcw size={12} /> Unlock
                              </button>
                            )}

                            {/* Report card download */}
                            {rec.resultId && (
                              <button
                                onClick={() => handleDownloadReportCard(student._id)}
                                className="text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-0.5"
                                title="Print report card"
                              >
                                <Download size={12} /> Report Card
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarksEntryPage;
