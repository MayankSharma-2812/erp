import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import {
  Building2,
  Users,
  Calendar,
  ClipboardCheck,
  UserPlus,
  DoorOpen,
  Coffee,
  Clock,
  PlusCircle,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  LogOut,
} from 'lucide-react';

export default function HostelPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');

  // Data States
  const [blocks, setBlocks] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [outings, setOutings] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mess Menu State
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const mon = new Date(d.setDate(diff));
    return mon.toISOString().split('T')[0];
  });
  const [messMenu, setMessMenu] = useState({
    Mon: { breakfast: '', lunch: '', eveningSnack: '', dinner: '' },
    Tue: { breakfast: '', lunch: '', eveningSnack: '', dinner: '' },
    Wed: { breakfast: '', lunch: '', eveningSnack: '', dinner: '' },
    Thu: { breakfast: '', lunch: '', eveningSnack: '', dinner: '' },
    Fri: { breakfast: '', lunch: '', eveningSnack: '', dinner: '' },
    Sat: { breakfast: '', lunch: '', eveningSnack: '', dinner: '' },
    Sun: { breakfast: '', lunch: '', eveningSnack: '', dinner: '' },
  });

  // Attendance State
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceSession, setAttendanceSession] = useState('morning');
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  // Form Modals / Expanders
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [showAllocate, setShowAllocate] = useState(false);
  const [showAddOuting, setShowAddOuting] = useState(false);
  const [showAddVisitor, setShowAddVisitor] = useState(false);

  // Form Inputs
  const [newBlock, setNewBlock] = useState({
    name: '',
    gender: 'male',
    floors: 1,
    roomsInput: '101,1,2,double; 102,1,1,single', // roomNumber,floor,capacity,type
  });
  const [newAllocation, setNewAllocation] = useState({
    studentId: '',
    blockId: '',
    roomNumber: '',
    bedNumber: 1,
    session: '2025-26',
  });
  const [newOuting, setNewOuting] = useState({
    studentId: '',
    destination: '',
    purpose: '',
    departDate: '',
    returnDate: '',
    contactDuring: '',
  });
  const [newVisitor, setNewVisitor] = useState({
    visitorName: '',
    visitorId: '',
    idType: 'Aadhaar',
    meetingStudent: '',
    purpose: '',
  });

  useEffect(() => {
    fetchBlocks();
    fetchAllocations();
    fetchStudents();
    fetchOutings();
    fetchVisitors();
    fetchMessMenu();
  }, []);

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendance();
    }
  }, [activeTab, attendanceDate, attendanceSession]);

  const fetchBlocks = async () => {
    try {
      const res = await axios.get('/hostel/blocks');
      if (res.data.success) setBlocks(res.data.data);
    } catch (e) {
      toast.error('Failed to load hostel blocks');
    }
  };

  const fetchAllocations = async () => {
    try {
      const res = await axios.get('/hostel/allocations');
      if (res.data.success) setAllocations(res.data.data);
    } catch (e) {
      toast.error('Failed to load allocations');
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get('/students');
      if (res.data.success) setStudents(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOutings = async () => {
    try {
      const res = await axios.get('/hostel/outings');
      if (res.data.success) setOutings(res.data.data);
    } catch (e) {
      toast.error('Failed to load outing requests');
    }
  };

  const fetchVisitors = async () => {
    try {
      const res = await axios.get('/hostel/visitors');
      if (res.data.success) setVisitors(res.data.data);
    } catch (e) {
      toast.error('Failed to load visitor logs');
    }
  };

  const fetchMessMenu = async () => {
    try {
      const res = await axios.get(`/hostel/mess/menu?weekStartDate=${weekStart}`);
      if (res.data.success && res.data.data && res.data.data.menu.length > 0) {
        const menuObj = {};
        res.data.data.menu.forEach(item => {
          menuObj[item.day] = {
            breakfast: item.breakfast,
            lunch: item.lunch,
            eveningSnack: item.eveningSnack,
            dinner: item.dinner,
          };
        });
        setMessMenu(menuObj);
      } else {
        setMessMenu({
          Mon: { breakfast: '', lunch: '', eveningSnack: '', dinner: '' },
          Tue: { breakfast: '', lunch: '', eveningSnack: '', dinner: '' },
          Wed: { breakfast: '', lunch: '', eveningSnack: '', dinner: '' },
          Thu: { breakfast: '', lunch: '', eveningSnack: '', dinner: '' },
          Fri: { breakfast: '', lunch: '', eveningSnack: '', dinner: '' },
          Sat: { breakfast: '', lunch: '', eveningSnack: '', dinner: '' },
          Sun: { breakfast: '', lunch: '', eveningSnack: '', dinner: '' },
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/hostel/attendance?date=${attendanceDate}&session_type=${attendanceSession}`);
      if (res.data.success) {
        const savedRecords = res.data.data.records || [];
        // Map records or construct list of all allocated students
        const allocatedActive = allocations.filter(a => !a.vacatedDate);
        
        const merged = allocatedActive.map(alloc => {
          const matched = savedRecords.find(r => r.student && r.student._id === alloc.student._id);
          return {
            student: alloc.student,
            status: matched ? matched.status : 'present',
            roomNumber: alloc.roomNumber,
          };
        });
        setAttendanceRecords(merged);
      }
    } catch (e) {
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlock = async (e) => {
    e.preventDefault();
    try {
      // Parse roomsInput e.g. "101,1,2,double; 102,1,1,single"
      const rooms = newBlock.roomsInput.split(';').map(item => {
        const [roomNumber, floor, capacity, type] = item.trim().split(',');
        return {
          roomNumber: roomNumber.trim(),
          floor: parseInt(floor),
          capacity: parseInt(capacity),
          type: type.trim(),
        };
      });

      const res = await axios.post('/hostel/blocks', {
        name: newBlock.name,
        gender: newBlock.gender,
        floors: parseInt(newBlock.floors),
        rooms,
      });

      if (res.data.success) {
        toast.success('Hostel Block created successfully');
        setShowAddBlock(false);
        setNewBlock({ name: '', gender: 'male', floors: 1, roomsInput: '101,1,2,double; 102,1,1,single' });
        fetchBlocks();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create block');
    }
  };

  const handleAllocateRoom = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/hostel/allocations', newAllocation);
      if (res.data.success) {
        toast.success('Room allocated and fee charged to ledger!');
        setShowAllocate(false);
        setNewAllocation({ studentId: '', blockId: '', roomNumber: '', bedNumber: 1, session: '2025-26' });
        fetchAllocations();
        fetchBlocks();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Room allocation failed');
    }
  };

  const handleVacateRoom = async (id) => {
    if (!window.confirm('Are you sure you want to vacate this room allocation?')) return;
    try {
      const res = await axios.post(`/hostel/allocations/${id}/vacate`);
      if (res.data.success) {
        toast.success('Student vacated room successfully');
        fetchAllocations();
        fetchBlocks();
      }
    } catch (err) {
      toast.error('Failed to vacate room');
    }
  };

  const handleAddOutingRequest = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/hostel/outings', newOuting);
      if (res.data.success) {
        toast.success('Outing request submitted successfully');
        setShowAddOuting(false);
        setNewOuting({ studentId: '', destination: '', purpose: '', departDate: '', returnDate: '', contactDuring: '' });
        fetchOutings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit outing request');
    }
  };

  const handleApproveOuting = async (id, status) => {
    try {
      const res = await axios.post(`/hostel/outings/${id}/approve`, { status });
      if (res.data.success) {
        toast.success(`Outing request ${status} successfully.`);
        fetchOutings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process outing approval');
    }
  };

  const handleMarkReturned = async (id) => {
    try {
      const res = await axios.post(`/hostel/outings/${id}/return`);
      if (res.data.success) {
        toast.success('Student marked as returned');
        fetchOutings();
      }
    } catch (err) {
      toast.error('Failed to mark return');
    }
  };

  const handleCreateVisitor = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/hostel/visitors', newVisitor);
      if (res.data.success) {
        toast.success('Visitor logged successfully');
        setShowAddVisitor(false);
        setNewVisitor({ visitorName: '', visitorId: '', idType: 'Aadhaar', meetingStudent: '', purpose: '' });
        fetchVisitors();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log visitor');
    }
  };

  const handleCheckoutVisitor = async (id) => {
    try {
      const res = await axios.post(`/hostel/visitors/${id}/checkout`);
      if (res.data.success) {
        toast.success('Visitor checked out successfully');
        fetchVisitors();
      }
    } catch (err) {
      toast.error('Checkout failed');
    }
  };

  const handleSaveMessMenu = async () => {
    try {
      const formattedMenu = Object.keys(messMenu).map(day => ({
        day,
        breakfast: messMenu[day].breakfast,
        lunch: messMenu[day].lunch,
        eveningSnack: messMenu[day].eveningSnack,
        dinner: messMenu[day].dinner,
      }));

      const res = await axios.post('/hostel/mess/menu', {
        weekStartDate: weekStart,
        menu: formattedMenu,
      });

      if (res.data.success) {
        toast.success('Weekly mess menu saved!');
        fetchMessMenu();
      }
    } catch (err) {
      toast.error('Failed to save mess menu');
    }
  };

  const handleSaveAttendance = async () => {
    try {
      const records = attendanceRecords.map(r => ({
        student: r.student._id,
        status: r.status,
      }));
      const res = await axios.post('/hostel/attendance', {
        date: attendanceDate,
        session_type: attendanceSession,
        records,
      });
      if (res.data.success) {
        toast.success('Hostel attendance saved successfully!');
        fetchAttendance();
      }
    } catch (e) {
      toast.error('Failed to save hostel attendance');
    }
  };

  // Calculations
  const activeAllocations = allocations.filter(a => !a.vacatedDate);
  const totalBeds = blocks.reduce((sum, b) => {
    return sum + b.rooms.reduce((rSum, room) => rSum + room.capacity, 0);
  }, 0);
  const occupiedBeds = activeAllocations.length;
  const vacantBeds = Math.max(0, totalBeds - occupiedBeds);
  const pendingOutings = outings.filter(o => o.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Hostel Management</h1>
          <p className="text-gray-500">Manage blocks, allocate beds, take roll calls, and schedule menus.</p>
        </div>
        
        {/* Quick actions depending on active tab */}
        <div className="flex gap-2">
          {user.role !== 'classteacher' && (
            <>
              <button
                onClick={() => setShowAddBlock(!showAddBlock)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
              >
                <PlusCircle className="w-4 h-4" /> Add Block
              </button>
              <button
                onClick={() => setShowAllocate(!showAllocate)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
              >
                <UserPlus className="w-4 h-4" /> Allocate Room
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6 overflow-x-auto">
        {[
          { key: 'overview', label: 'Overview', icon: Building2 },
          { key: 'blocks', label: 'Blocks & Rooms', icon: DoorOpen },
          { key: 'allocations', label: 'Allocations List', icon: Users },
          { key: 'attendance', label: 'Morning/Night Attendance', icon: ClipboardCheck },
          { key: 'outings', label: 'Outing Registry', icon: Clock },
          { key: 'visitors', label: 'Visitors Log', icon: LogOut },
          { key: 'mess', label: 'Mess Weekly Menu', icon: Coffee },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* MODALS */}
      {showAddBlock && (
        <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Add New Hostel Block</h2>
          <form onSubmit={handleCreateBlock} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Block Name</label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-teal-600"
                placeholder="e.g. Boys Block A"
                value={newBlock.name}
                onChange={e => setNewBlock({ ...newBlock, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Floors</label>
              <input
                type="number"
                min="1"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-teal-600"
                value={newBlock.floors}
                onChange={e => setNewBlock({ ...newBlock, floors: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Gender Restriction</label>
              <select
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-teal-600"
                value={newBlock.gender}
                onChange={e => setNewBlock({ ...newBlock, gender: e.target.value })}
              >
                <option value="male">Male Only</option>
                <option value="female">Female Only</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Rooms Definition (Semicolon separated)</label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-teal-600"
                placeholder="room,floor,capacity,type;..."
                value={newBlock.roomsInput}
                onChange={e => setNewBlock({ ...newBlock, roomsInput: e.target.value })}
              />
              <span className="text-xs text-gray-400">Format: 101,1,2,double; 102,1,1,single</span>
            </div>
            <div className="col-span-1 md:col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddBlock(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition"
              >
                Create Block
              </button>
            </div>
          </form>
        </div>
      )}

      {showAllocate && (
        <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Allocate Student to Hostel Room</h2>
          <form onSubmit={handleAllocateRoom} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Student</label>
              <select
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                value={newAllocation.studentId}
                onChange={e => setNewAllocation({ ...newAllocation, studentId: e.target.value })}
              >
                <option value="">Select Student</option>
                {students.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.admissionNumber})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Hostel Block</label>
              <select
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                value={newAllocation.blockId}
                onChange={e => setNewAllocation({ ...newAllocation, blockId: e.target.value })}
              >
                <option value="">Select Block</option>
                {blocks.map(b => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.gender})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Room Number</label>
              <input
                type="text"
                required
                placeholder="e.g. 101"
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                value={newAllocation.roomNumber}
                onChange={e => setNewAllocation({ ...newAllocation, roomNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Bed Number</label>
              <input
                type="number"
                min="1"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                value={newAllocation.bedNumber}
                onChange={e => setNewAllocation({ ...newAllocation, bedNumber: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Session</label>
              <input
                type="text"
                required
                placeholder="e.g. 2025-26"
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                value={newAllocation.session}
                onChange={e => setNewAllocation({ ...newAllocation, session: e.target.value })}
              />
            </div>
            <div className="col-span-1 md:col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAllocate(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition"
              >
                Allocate Room
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB CONTENTS */}

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase">Total Capacity</span>
                <h3 className="text-2xl font-bold mt-1 text-gray-800">{totalBeds} Beds</h3>
              </div>
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                <Building2 className="w-6 h-6" />
              </div>
            </div>
            <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase">Occupied Beds</span>
                <h3 className="text-2xl font-bold mt-1 text-gray-800">{occupiedBeds} Beds</h3>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase">Vacant Beds</span>
                <h3 className="text-2xl font-bold mt-1 text-gray-800">{vacantBeds} Beds</h3>
              </div>
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
            <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase">Pending Outings</span>
                <h3 className="text-2xl font-bold mt-1 text-gray-800">{pendingOutings} Requests</h3>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-gray-800">Quick Hostel Blocks Status</h3>
              <div className="space-y-3">
                {blocks.map(b => {
                  const bAlloc = allocations.filter(a => !a.vacatedDate && a.block && a.block._id === b._id);
                  const bCap = b.rooms.reduce((sum, r) => sum + r.capacity, 0);
                  return (
                    <div key={b._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <div>
                        <div className="font-semibold text-gray-700">{b.name}</div>
                        <div className="text-xs text-gray-400 uppercase font-bold">{b.gender} Only</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-800">{bAlloc.length} / {bCap} Beds</div>
                        <div className="w-24 bg-gray-200 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-teal-600 h-full"
                            style={{ width: `${Math.min(100, (bAlloc.length / (bCap || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-gray-800">Active Outings</h3>
              <div className="space-y-3">
                {outings.filter(o => o.status === 'approved').slice(0, 3).map(o => (
                  <div key={o._id} className="flex justify-between items-center p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                    <div>
                      <div className="font-semibold text-gray-800">{o.student?.name}</div>
                      <div className="text-xs text-gray-500">Destination: {o.destination}</div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="font-semibold text-indigo-700">Expires: {new Date(o.returnDate).toLocaleDateString()}</div>
                      <div className="text-gray-400 mt-1">Approved by {o.approvedBy?.name}</div>
                    </div>
                  </div>
                ))}
                {outings.filter(o => o.status === 'approved').length === 0 && (
                  <div className="text-sm text-gray-400 text-center py-6">No students are currently out on approved outings.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BLOCKS AND ROOMS */}
      {activeTab === 'blocks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blocks.map(b => (
            <div key={b._id} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{b.name}</h3>
                  <span className={`inline-block px-2.5 py-0.5 mt-1.5 text-xs font-semibold rounded-full uppercase ${
                    b.gender === 'male' ? 'bg-blue-50 text-blue-700' : b.gender === 'female' ? 'bg-pink-50 text-pink-700' : 'bg-gray-50 text-gray-700'
                  }`}>
                    {b.gender} block
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Floors: <span className="font-semibold text-gray-700">{b.floors}</span></div>
                  <div className="text-sm text-gray-400">Rooms: <span className="font-semibold text-gray-700">{b.rooms.length}</span></div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-3">
                <h4 className="font-semibold text-sm text-gray-600">Rooms Inventory</h4>
                <div className="grid grid-cols-1 gap-2">
                  {b.rooms.map(room => {
                    const roomAllocations = allocations.filter(a => !a.vacatedDate && a.block?._id === b._id && a.roomNumber === room.roomNumber);
                    return (
                      <div key={room.roomNumber} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                        <div>
                          <div className="font-semibold text-gray-700 text-sm">Room {room.roomNumber}</div>
                          <div className="text-xs text-gray-400">Type: <span className="capitalize">{room.type}</span> (Floor {room.floor})</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-gray-500">
                            {roomAllocations.length} / {room.capacity} beds filled
                          </span>
                          <span className={`px-2 py-0.5 rounded text-2xs font-extrabold uppercase ${
                            roomAllocations.length >= room.capacity ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                          }`}>
                            {roomAllocations.length >= room.capacity ? 'Full' : 'Available'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ALLOCATIONS LIST */}
      {activeTab === 'allocations' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-bold text-lg text-gray-800">Active Room Check-Ins</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-200">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Block / Room / Bed</th>
                  <th className="px-6 py-4">Allotted Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {allocations.map(alloc => (
                  <tr key={alloc._id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800">{alloc.student?.name}</div>
                      <div className="text-xs text-gray-400">{alloc.student?.admissionNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-700">{alloc.block?.name}</div>
                      <div className="text-xs text-gray-400">Room {alloc.roomNumber} (Bed {alloc.bedNumber})</div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(alloc.allottedDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {alloc.vacatedDate ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-gray-50 text-gray-500">
                          Vacated ({new Date(alloc.vacatedDate).toLocaleDateString()})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-green-50 text-green-700">
                          Active Resident
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!alloc.vacatedDate && user.role !== 'classteacher' && (
                        <button
                          onClick={() => handleVacateRoom(alloc._id)}
                          className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition"
                        >
                          Vacate Bed
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {allocations.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-400">No room allocations recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ATTENDANCE MARKING */}
      {activeTab === 'attendance' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
            <div>
              <h3 className="font-bold text-lg text-gray-800 font-sans">Hostel Attendance Roster</h3>
              <p className="text-sm text-gray-400">Mark morning and evening roll calls for boarding students.</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-teal-600"
                value={attendanceDate}
                onChange={e => setAttendanceDate(e.target.value)}
              />
              <select
                className="border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-teal-600"
                value={attendanceSession}
                onChange={e => setAttendanceSession(e.target.value)}
              >
                <option value="morning">Morning Roll Call</option>
                <option value="night">Night Roll Call</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center text-gray-500 py-12">Loading roster...</div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-200">
                      <th className="px-6 py-3">Student Name</th>
                      <th className="px-6 py-3">Room Number</th>
                      <th className="px-6 py-3">Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {attendanceRecords.map((record, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 font-semibold text-gray-800">{record.student?.name}</td>
                        <td className="px-6 py-4 text-gray-500">Room {record.roomNumber}</td>
                        <td className="px-6 py-4">
                          <select
                            className="border border-gray-300 rounded-xl px-3 py-1.5 text-xs focus:outline-teal-600"
                            value={record.status}
                            onChange={e => {
                              const updated = [...attendanceRecords];
                              updated[index].status = e.target.value;
                              setAttendanceRecords(updated);
                            }}
                          >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="outing">Outing</option>
                            <option value="leave">On Leave</option>
                            <option value="sickbay">Sickbay</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {attendanceRecords.length === 0 && (
                      <tr>
                        <td colSpan="3" className="text-center py-8 text-gray-400">No active students allocated to hostel blocks.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {attendanceRecords.length > 0 && (
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleSaveAttendance}
                    className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition text-sm shadow-sm"
                  >
                    Save Roll Call
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* OUTINGS REGISTRY */}
      {activeTab === 'outings' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-lg text-gray-800">Student Outings</h3>
            <button
              onClick={() => setShowAddOuting(!showAddOuting)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition"
            >
              Request Outing
            </button>
          </div>

          {showAddOuting && (
            <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4">
              <h4 className="font-bold text-gray-800">New Outing Request</h4>
              <form onSubmit={handleAddOutingRequest} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Student</label>
                  <select
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                    value={newOuting.studentId}
                    onChange={e => setNewOuting({ ...newOuting, studentId: e.target.value })}
                  >
                    <option value="">Select Student</option>
                    {students.map(s => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.admissionNumber})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Destination</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                    placeholder="e.g. Parents Residence"
                    value={newOuting.destination}
                    onChange={e => setNewOuting({ ...newOuting, destination: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Purpose</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                    placeholder="e.g. Festival Leave"
                    value={newOuting.purpose}
                    onChange={e => setNewOuting({ ...newOuting, purpose: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Contact Phone During</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                    value={newOuting.contactDuring}
                    onChange={e => setNewOuting({ ...newOuting, contactDuring: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Departure Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                    value={newOuting.departDate}
                    onChange={e => setNewOuting({ ...newOuting, departDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Planned Return Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-indigo-600"
                    value={newOuting.returnDate}
                    onChange={e => setNewOuting({ ...newOuting, returnDate: e.target.value })}
                  />
                </div>
                <div className="col-span-1 md:col-span-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddOuting(false)}
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

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-200">
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Destination & Purpose</th>
                    <th className="px-6 py-4">Departure & Return</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Approval Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {outings.map(outing => {
                    const hours = (new Date(outing.returnDate) - new Date(outing.departDate)) / (1000 * 60 * 60);
                    return (
                      <tr key={outing._id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-800">{outing.student?.name}</div>
                          <div className="text-xs text-gray-400">Duration: {hours.toFixed(1)} hrs</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-700">{outing.destination}</div>
                          <div className="text-xs text-gray-400">{outing.purpose}</div>
                        </td>
                        <td className="px-6 py-4 text-xs space-y-0.5 text-gray-500">
                          <div><span className="font-semibold">Out:</span> {new Date(outing.departDate).toLocaleString()}</div>
                          <div><span className="font-semibold">In:</span> {new Date(outing.returnDate).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                            outing.status === 'pending'
                              ? 'bg-amber-50 text-amber-700'
                              : outing.status === 'approved'
                              ? 'bg-green-50 text-green-700'
                              : outing.status === 'returned'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-red-50 text-red-700'
                          }`}>
                            {outing.status.toUpperCase()}
                          </span>
                          {outing.approvedBy && (
                            <div className="text-2xs text-gray-400 mt-1">Level: {outing.approvalLevel}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            {outing.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveOuting(outing._id, 'approved')}
                                  className="px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-bold transition"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleApproveOuting(outing._id, 'rejected')}
                                  className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {outing.status === 'approved' && (
                              <button
                                onClick={() => handleMarkReturned(outing._id)}
                                className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition"
                              >
                                Mark Returned
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {outings.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-gray-400">No outing requests registered.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VISITORS LOG */}
      {activeTab === 'visitors' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-lg text-gray-800">Hostel Visitors log</h3>
            <button
              onClick={() => setShowAddVisitor(!showAddVisitor)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition"
            >
              Log Visitor Check-In
            </button>
          </div>

          {showAddVisitor && (
            <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4">
              <h4 className="font-bold text-gray-800">Record Visitor Check-In</h4>
              <form onSubmit={handleCreateVisitor} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Visitor Name</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-teal-600"
                    value={newVisitor.visitorName}
                    onChange={e => setNewVisitor({ ...newVisitor, visitorName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">ID Document Type</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-teal-600"
                    placeholder="e.g. Aadhaar / Driver License"
                    value={newVisitor.idType}
                    onChange={e => setNewVisitor({ ...newVisitor, idType: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Visitor ID Number</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-teal-600"
                    value={newVisitor.visitorId}
                    onChange={e => setNewVisitor({ ...newVisitor, visitorId: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Meeting Student</label>
                  <select
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-teal-600"
                    value={newVisitor.meetingStudent}
                    onChange={e => setNewVisitor({ ...newVisitor, meetingStudent: e.target.value })}
                  >
                    <option value="">Select Student</option>
                    {students.map(s => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.admissionNumber})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Purpose of Visit</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-teal-600"
                    value={newVisitor.purpose}
                    onChange={e => setNewVisitor({ ...newVisitor, purpose: e.target.value })}
                  />
                </div>
                <div className="col-span-1 md:col-span-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddVisitor(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition"
                  >
                    Log Check-In
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-200">
                    <th className="px-6 py-4">Visitor</th>
                    <th className="px-6 py-4">Student Meeting</th>
                    <th className="px-6 py-4">In Time / Out Time</th>
                    <th className="px-6 py-4">Purpose</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {visitors.map(log => (
                    <tr key={log._id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800">{log.visitorName}</div>
                        <div className="text-xs text-gray-400">{log.idType}: {log.visitorId}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-700">
                        {log.meetingStudent?.name}
                      </td>
                      <td className="px-6 py-4 text-xs space-y-0.5 text-gray-500">
                        <div><span className="font-semibold">Check-In:</span> {new Date(log.inTime).toLocaleString()}</div>
                        <div>
                          <span className="font-semibold">Check-Out:</span>{' '}
                          {log.outTime ? new Date(log.outTime).toLocaleString() : <span className="text-teal-600 font-bold">In Premise</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {log.purpose}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!log.outTime && (
                          <button
                            onClick={() => handleCheckoutVisitor(log._id)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition"
                          >
                            Check-Out
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {visitors.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-gray-400">No visitors logs recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MESS weekly planner */}
      {activeTab === 'mess' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
            <div>
              <h3 className="font-bold text-lg text-gray-800 font-sans">Mess Weekly Menu Planner</h3>
              <p className="text-sm text-gray-400">Schedule daily breakfasts, lunches, snacks, and dinners.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-500">Week Start (Monday):</span>
              <input
                type="date"
                className="border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-teal-600"
                value={weekStart}
                onChange={e => {
                  setWeekStart(e.target.value);
                  setTimeout(() => fetchMessMenu(), 100);
                }}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold uppercase text-gray-500 border-b border-gray-200">
                  <th className="px-4 py-3 w-28">Day</th>
                  <th className="px-4 py-3">Breakfast</th>
                  <th className="px-4 py-3">Lunch</th>
                  <th className="px-4 py-3">Evening Snack</th>
                  <th className="px-4 py-3">Dinner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {Object.keys(messMenu).map(day => (
                  <tr key={day}>
                    <td className="px-4 py-4 font-bold text-gray-700">{day}</td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-teal-600"
                        value={messMenu[day].breakfast}
                        onChange={e => setMessMenu({
                          ...messMenu,
                          [day]: { ...messMenu[day], breakfast: e.target.value }
                        })}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-teal-600"
                        value={messMenu[day].lunch}
                        onChange={e => setMessMenu({
                          ...messMenu,
                          [day]: { ...messMenu[day], lunch: e.target.value }
                        })}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-teal-600"
                        value={messMenu[day].eveningSnack}
                        onChange={e => setMessMenu({
                          ...messMenu,
                          [day]: { ...messMenu[day], eveningSnack: e.target.value }
                        })}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-teal-600"
                        value={messMenu[day].dinner}
                        onChange={e => setMessMenu({
                          ...messMenu,
                          [day]: { ...messMenu[day], dinner: e.target.value }
                        })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveMessMenu}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition text-sm shadow-sm"
            >
              Save Menu Plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
