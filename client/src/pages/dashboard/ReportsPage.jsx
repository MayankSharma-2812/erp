import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  BarChart3,
  IndianRupee,
  Users,
  Building2,
  FileText,
  Download,
  Filter,
  RefreshCw,
  Info,
} from 'lucide-react';

export default function ReportsPage() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState(null);
  const [detailedType, setDetailedType] = useState('attendance');
  const [detailedData, setDetailedData] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingDetailed, setLoadingDetailed] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchDetailedReport();
  }, [detailedType]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/reports/summary');
      if (res.data && res.data.success) {
        setSummary(res.data.data);
      }
    } catch (e) {
      toast.error('Failed to load dashboard report summary');
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedReport = async () => {
    setLoadingDetailed(true);
    try {
      const res = await axios.get(`/reports/detailed?type=${detailedType}`);
      if (res.data && res.data.success) {
        setDetailedData(res.data.data);
      }
    } catch (e) {
      toast.error('Failed to load detailed report logs');
    } finally {
      setLoadingDetailed(false);
    }
  };

  // Convert detailedData array to CSV download
  const handleExportCSV = () => {
    if (!detailedData || !detailedData.length) {
      toast.warning('No report data available to export');
      return;
    }

    const headers = Object.keys(detailedData[0]);
    const csvRows = [
      headers.join(','), // header row
      ...detailedData.map(row =>
        headers
          .map(fieldName => {
            const val = row[fieldName] || '';
            // Escape quotes and commas
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VidyaERP_${detailedType}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${detailedType.toUpperCase()} report CSV downloaded successfully`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Aggregated statistics, monthly collection charts, and detailed CBSE operational exports.</p>
        </div>
      </div>

      {/* Stats Summary cards */}
      {loading ? (
        <div className="p-8 text-center text-gray-500 flex justify-center items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" /> Loading Aggregations...
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-500">School Attendance Rate</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{summary.attendanceRate}%</div>
              <div className="text-[10px] text-gray-400 mt-1">Consolidated overall average</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Fees Collected</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">₹{summary.finance?.totalPaid}</div>
              <div className="text-[10px] text-emerald-650 font-semibold mt-1">
                {summary.finance?.collectionPercentage}% of demanded
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Hostel Occupancy</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{summary.hostelOccupancy?.percentage}%</div>
              <div className="text-[10px] text-gray-400 mt-1">
                {summary.hostelOccupancy?.filled} / {summary.hostelOccupancy?.total} beds filled
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Defaulters Count</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{summary.defaultersCount}</div>
              <div className="text-[10px] text-rose-650 font-semibold mt-1">Pending fee balances</div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Recharts Grid */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-650" /> Fee Collections (Monthly aggregate)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.collectionsTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={val => `₹${val}`} />
                  <Bar dataKey="amount" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-650" /> Academic Performance
            </h3>
            <div className="space-y-4 pt-4">
              <div className="bg-gray-50 p-4 rounded-xl text-center space-y-1">
                <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Class Term Averages</div>
                <div className="text-3xl font-extrabold text-indigo-650">{summary.averageScore}%</div>
                <div className="text-[10px] text-gray-400">Equivalent Grade: B1</div>
              </div>
              <div className="text-xs text-gray-500 bg-indigo-50/50 p-3 rounded-lg flex items-start gap-2">
                <Info className="w-4 h-4 text-indigo-500 mt-0.5" />
                Aggregated values are derived from all published unit tests, half-yearly and board CBSE marks.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Reports Grid */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
          <div className="flex gap-4 items-center">
            <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
              <Filter className="w-4.5 h-4.5 text-indigo-600" /> Export Detailed Logs
            </h3>
            <select
              value={detailedType}
              onChange={e => setDetailedType(e.target.value)}
              className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs outline-none bg-white font-semibold text-gray-750"
            >
              <option value="attendance">Daily Attendance Log</option>
              <option value="finance">Fee Ledgers summary</option>
              <option value="exams">Exam Results Marks breakout</option>
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="border border-indigo-600 text-indigo-700 bg-white font-semibold py-1.5 px-3 rounded-lg text-xs hover:bg-indigo-50 transition-colors flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>

        {loadingDetailed ? (
          <div className="p-8 text-center text-gray-500 flex justify-center items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" /> Fetching Log rows...
          </div>
        ) : detailedData.length > 0 ? (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-wider border-b border-gray-200">
                  {Object.keys(detailedData[0]).map(k => (
                    <th key={k} className="px-6 py-3">{k.replace(/([A-Z])/g, ' $1').trim()}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-750">
                {detailedData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    {Object.values(row).map((val, vidx) => (
                      <td key={vidx} className="px-6 py-3 font-medium">
                        {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500 text-sm">No report rows matches criteria.</div>
        )}
      </div>
    </div>
  );
}
