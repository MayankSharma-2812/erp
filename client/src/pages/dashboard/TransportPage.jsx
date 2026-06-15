import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import {
  Bus,
  Search,
  PlusCircle,
  Users,
  MapPin,
  ClipboardList,
  AlertTriangle,
  IndianRupee,
  RefreshCw,
  Plus,
  Trash,
} from 'lucide-react';

export default function TransportPage() {
  const { user } = useAuthStore();
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [students, setStudents] = useState([]);

  const [activeTab, setActiveTab] = useState('routes');
  const [loading, setLoading] = useState(false);

  // Forms
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [newRoute, setNewRoute] = useState({
    name: '',
    feeAmount: '',
    vehicle: '',
    driver: '',
    stops: [{ name: '', time: '', order: 1 }],
  });

  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    regNumber: '',
    type: 'bus',
    capacity: '',
    fitnessCertExpiry: '',
    insuranceExpiry: '',
  });

  const [showAddDriver, setShowAddDriver] = useState(false);
  const [newDriver, setNewDriver] = useState({
    name: '',
    phone: '',
    licenseNumber: '',
    licenseExpiry: '',
    vehicle: '',
  });

  const [showAllocate, setShowAllocate] = useState(false);
  const [newAllocation, setNewAllocation] = useState({
    studentId: '',
    routeId: '',
    stop: '',
    session: '2025-26',
  });

  useEffect(() => {
    fetchRoutes();
    fetchStudents();
  }, []);

  useEffect(() => {
    if (activeTab === 'vehicles') fetchVehicles();
    else if (activeTab === 'drivers') fetchDrivers();
    else if (activeTab === 'allocations') fetchAllocations();
  }, [activeTab]);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/transport/routes');
      if (res.data && res.data.success) {
        setRoutes(res.data.data);
      }
    } catch (e) {
      toast.error('Failed to fetch routes');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/transport/vehicles');
      if (res.data && res.data.success) {
        setVehicles(res.data.data);
      }
    } catch (e) {
      toast.error('Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/transport/drivers');
      if (res.data && res.data.success) {
        setDrivers(res.data.data);
      }
    } catch (e) {
      toast.error('Failed to fetch drivers');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllocations = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/transport/allocations');
      if (res.data && res.data.success) {
        setAllocations(res.data.data);
      }
    } catch (e) {
      toast.error('Failed to fetch allocations');
    } finally {
      setLoading(false);
    }
  };

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

  const handleAddStop = () => {
    setNewRoute(prev => ({
      ...prev,
      stops: [...prev.stops, { name: '', time: '', order: prev.stops.length + 1 }],
    }));
  };

  const handleRemoveStop = (index) => {
    setNewRoute(prev => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })),
    }));
  };

  const handleStopChange = (index, field, value) => {
    const updated = [...newRoute.stops];
    updated[index][field] = value;
    setNewRoute(prev => ({ ...prev, stops: updated }));
  };

  const submitRoute = async (e) => {
    e.preventDefault();
    try {
      const formatted = {
        ...newRoute,
        feeAmount: parseFloat(newRoute.feeAmount),
        vehicle: newRoute.vehicle || undefined,
        driver: newRoute.driver || undefined,
      };
      const res = await axios.post('/transport/routes', formatted);
      if (res.data && res.data.success) {
        toast.success('Route setup created successfully');
        setShowAddRoute(false);
        setNewRoute({
          name: '',
          feeAmount: '',
          vehicle: '',
          driver: '',
          stops: [{ name: '', time: '', order: 1 }],
        });
        fetchRoutes();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to setup route');
    }
  };

  const submitVehicle = async (e) => {
    e.preventDefault();
    try {
      const formatted = {
        ...newVehicle,
        capacity: parseInt(newVehicle.capacity),
      };
      const res = await axios.post('/transport/vehicles', formatted);
      if (res.data && res.data.success) {
        toast.success('Vehicle registered successfully');
        setShowAddVehicle(false);
        setNewVehicle({ regNumber: '', type: 'bus', capacity: '', fitnessCertExpiry: '', insuranceExpiry: '' });
        fetchVehicles();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register vehicle');
    }
  };

  const submitDriver = async (e) => {
    e.preventDefault();
    try {
      const formatted = {
        ...newDriver,
        vehicle: newDriver.vehicle || undefined,
      };
      const res = await axios.post('/transport/drivers', formatted);
      if (res.data && res.data.success) {
        toast.success('Driver registered successfully');
        setShowAddDriver(false);
        setNewDriver({ name: '', phone: '', licenseNumber: '', licenseExpiry: '', vehicle: '' });
        fetchDrivers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add driver');
    }
  };

  const submitAllocation = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/transport/allocations', newAllocation);
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Student allocated route and fee charged');
        setShowAllocate(false);
        setNewAllocation({ studentId: '', routeId: '', stop: '', session: '2025-26' });
        fetchAllocations();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to allocate route');
    }
  };

  const isTransportManager = user && (user.role === 'transport_manager' || user.role === 'principal');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Transport Operations</h1>
          <p className="text-gray-500 mt-1">Configure bus routes, log driver/fitness documentation, and assign student pick-ups.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveTab('routes')}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 outline-none ${
            activeTab === 'routes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Routes & Stops
        </button>
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 outline-none ${
            activeTab === 'vehicles' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Vehicles Fleet
        </button>
        <button
          onClick={() => setActiveTab('drivers')}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 outline-none ${
            activeTab === 'drivers' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Drivers Register
        </button>
        <button
          onClick={() => setActiveTab('allocations')}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 outline-none ${
            activeTab === 'allocations' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Student Allocations
        </button>
      </div>

      {/* Main Tab area */}
      {activeTab === 'routes' && (
        <div className="space-y-6">
          <div className="flex justify-end gap-2">
            {isTransportManager && (
              <>
                <button
                  onClick={() => {
                    fetchVehicles();
                    fetchDrivers();
                    setShowAddRoute(true);
                  }}
                  className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-1.5 text-sm shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" /> Setup Route
                </button>
                <button
                  onClick={() => {
                    fetchRoutes();
                    setShowAllocate(true);
                  }}
                  className="bg-indigo-50 text-indigo-750 font-semibold py-2 px-4 rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-1.5 text-sm"
                >
                  <Users className="w-4 h-4" /> Assign Route
                </button>
              </>
            )}
          </div>

          {showAddRoute && (
            <form onSubmit={submitRoute} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Create New Transport Route</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Route Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Route 3 - Vaishali Nagar"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={newRoute.name}
                    onChange={e => setNewRoute(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Annual Fee (INR)</label>
                  <input
                    type="number"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={newRoute.feeAmount}
                    onChange={e => setNewRoute(prev => ({ ...prev, feeAmount: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Assign Vehicle</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    value={newRoute.vehicle}
                    onChange={e => setNewRoute(prev => ({ ...prev, vehicle: e.target.value }))}
                  >
                    <option value="">No Vehicle</option>
                    {vehicles.map(v => (
                      <option key={v._id} value={v._id}>{v.regNumber} ({v.type})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Assign Driver</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    value={newRoute.driver}
                    onChange={e => setNewRoute(prev => ({ ...prev, driver: e.target.value }))}
                  >
                    <option value="">No Driver</option>
                    {drivers.map(d => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Stops Timeline</span>
                  <button
                    type="button"
                    onClick={handleAddStop}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    + Add Stop
                  </button>
                </div>

                {newRoute.stops.map((stop, idx) => (
                  <div key={idx} className="flex gap-4 items-center bg-gray-50/50 p-3 rounded-lg border border-gray-150">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Stop Name (e.g. Sector 5 Crossing)"
                        required
                        className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                        value={stop.name}
                        onChange={e => handleStopChange(idx, 'name', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Pickup Time (e.g. 07:30 AM)"
                        required
                        className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                        value={stop.time}
                        onChange={e => handleStopChange(idx, 'time', e.target.value)}
                      />
                    </div>
                    {newRoute.stops.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStop(idx)}
                        className="text-red-650 hover:text-red-800"
                      >
                        <Trash className="w-4.5 h-4.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setShowAddRoute(false)}
                  className="border border-gray-300 px-3.5 py-1.5 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-3.5 py-1.5 rounded-xl hover:bg-indigo-700"
                >
                  Create Route
                </button>
              </div>
            </form>
          )}

          {showAllocate && (
            <form onSubmit={submitAllocation} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Allocate Transport Route to Student</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Select Student</label>
                  <select
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    value={newAllocation.studentId}
                    onChange={e => setNewAllocation(prev => ({ ...prev, studentId: e.target.value }))}
                  >
                    <option value="">Select Student</option>
                    {students.map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.admissionNumber})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Select Route</label>
                  <select
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    value={newAllocation.routeId}
                    onChange={e => {
                      const routeId = e.target.value;
                      setNewAllocation(prev => ({ ...prev, routeId, stop: '' }));
                    }}
                  >
                    <option value="">Select Route</option>
                    {routes.map(r => (
                      <option key={r._id} value={r._id}>{r.name} (Fee: ₹{r.feeAmount})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Select Stop</label>
                  <select
                    required
                    disabled={!newAllocation.routeId}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-white disabled:opacity-50"
                    value={newAllocation.stop}
                    onChange={e => setNewAllocation(prev => ({ ...prev, stop: e.target.value }))}
                  >
                    <option value="">Select Stop</option>
                    {routes.find(r => r._id === newAllocation.routeId)?.stops.map(st => (
                      <option key={st._id} value={st.name}>{st.name} (at {st.time})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setShowAllocate(false)}
                  className="border border-gray-300 px-3.5 py-1.5 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-3.5 py-1.5 rounded-xl hover:bg-indigo-700"
                >
                  Assign Route & Charge Fee
                </button>
              </div>
            </form>
          )}

          {/* Routes List */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500 flex justify-center items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" /> Loading Routes...
              </div>
            ) : routes.length > 0 ? (
              <div className="divide-y divide-gray-155">
                {routes.map(route => (
                  <div key={route._id} className="p-6 hover:bg-gray-50/50 flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{route.name}</h3>
                          <p className="text-sm text-gray-500 mt-0.5">
                            Vehicle: <span className="font-semibold text-gray-700">{route.vehicle?.regNumber || 'Not assigned'}</span> | Driver: <span className="font-semibold text-gray-700">{route.driver?.name || 'Not assigned'}</span>
                          </p>
                        </div>
                        <div className="text-indigo-650 font-bold bg-indigo-50 px-3 py-1 rounded-full text-sm flex items-center">
                          <IndianRupee className="w-3.5 h-3.5 mr-0.5" />
                          {route.feeAmount} / session
                        </div>
                      </div>

                      {/* Stops list timeline */}
                      <div className="pt-2">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Stops & Timetable</div>
                        <div className="flex flex-wrap gap-2">
                          {route.stops.map((stop, sidx) => (
                            <div key={stop._id} className="text-xs bg-gray-50 border border-gray-150 px-2.5 py-1 rounded-lg flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-indigo-500" />
                              <span className="font-medium text-gray-800">{stop.name}</span>
                              <span className="text-gray-400">({stop.time})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">No transport routes created yet.</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'vehicles' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            {isTransportManager && (
              <button
                onClick={() => setShowAddVehicle(true)}
                className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-1.5 text-sm shadow-sm"
              >
                <PlusCircle className="w-4 h-4" /> Register Vehicle
              </button>
            )}
          </div>

          {showAddVehicle && (
            <form onSubmit={submitVehicle} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Register Vehicle</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Registration Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DL-1CA-1234"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={newVehicle.regNumber}
                    onChange={e => setNewVehicle(prev => ({ ...prev, regNumber: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Type</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    value={newVehicle.type}
                    onChange={e => setNewVehicle(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="bus">Bus</option>
                    <option value="van">Van</option>
                    <option value="mini-bus">Mini-Bus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Capacity</label>
                  <input
                    type="number"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={newVehicle.capacity}
                    onChange={e => setNewVehicle(prev => ({ ...prev, capacity: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Fitness Certificate Expiry</label>
                  <input
                    type="date"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={newVehicle.fitnessCertExpiry}
                    onChange={e => setNewVehicle(prev => ({ ...prev, fitnessCertExpiry: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Insurance Expiry</label>
                  <input
                    type="date"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={newVehicle.insuranceExpiry}
                    onChange={e => setNewVehicle(prev => ({ ...prev, insuranceExpiry: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setShowAddVehicle(false)}
                  className="border border-gray-300 px-3.5 py-1.5 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-3.5 py-1.5 rounded-xl hover:bg-indigo-700"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          )}

          {/* Vehicle List */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500 flex justify-center items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" /> Loading Fleet...
              </div>
            ) : vehicles.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                      <th className="px-6 py-4">Reg Number</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Capacity</th>
                      <th className="px-6 py-4">Fitness Expiry</th>
                      <th className="px-6 py-4">Status Warning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {vehicles.map(v => {
                      const isExpired = new Date(v.fitnessCertExpiry) < new Date();
                      return (
                        <tr key={v._id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 font-semibold text-gray-900">{v.regNumber}</td>
                          <td className="px-6 py-4 uppercase text-xs font-medium text-gray-600">{v.type}</td>
                          <td className="px-6 py-4 text-gray-650">{v.capacity} seats</td>
                          <td className="px-6 py-4 text-gray-500">
                            {new Date(v.fitnessCertExpiry).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            {isExpired ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100 px-2.5 py-1 rounded-full animate-pulse">
                                <AlertTriangle className="w-3.5 h-3.5" /> Certificate Expired
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
                                Active / Compliant
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">No vehicles registered.</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'drivers' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            {isTransportManager && (
              <button
                onClick={() => {
                  fetchVehicles();
                  setShowAddDriver(true);
                }}
                className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-1.5 text-sm shadow-sm"
              >
                <PlusCircle className="w-4 h-4" /> Add Driver
              </button>
            )}
          </div>

          {showAddDriver && (
            <form onSubmit={submitDriver} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Register Driver</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Driver Name</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={newDriver.name}
                    onChange={e => setNewDriver(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={newDriver.phone}
                    onChange={e => setNewDriver(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Assign Vehicle</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    value={newDriver.vehicle}
                    onChange={e => setNewDriver(prev => ({ ...prev, vehicle: e.target.value }))}
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map(v => (
                      <option key={v._id} value={v._id}>{v.regNumber}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">License Number</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={newDriver.licenseNumber}
                    onChange={e => setNewDriver(prev => ({ ...prev, licenseNumber: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">License Expiry Date</label>
                  <input
                    type="date"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                    value={newDriver.licenseExpiry}
                    onChange={e => setNewDriver(prev => ({ ...prev, licenseExpiry: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setShowAddDriver(false)}
                  className="border border-gray-300 px-3.5 py-1.5 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-3.5 py-1.5 rounded-xl hover:bg-indigo-700"
                >
                  Save Driver
                </button>
              </div>
            </form>
          )}

          {/* Drivers List */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500 flex justify-center items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" /> Loading Drivers...
              </div>
            ) : drivers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                      <th className="px-6 py-4">Driver Name</th>
                      <th className="px-6 py-4">Phone</th>
                      <th className="px-6 py-4">License Number</th>
                      <th className="px-6 py-4">License Expiry</th>
                      <th className="px-6 py-4">Assigned Vehicle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {drivers.map(d => (
                      <tr key={d._id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-semibold text-gray-900">{d.name}</td>
                        <td className="px-6 py-4 text-gray-650">{d.phone}</td>
                        <td className="px-6 py-4 text-gray-550">{d.licenseNumber}</td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(d.licenseExpiry).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {d.vehicle ? d.vehicle.regNumber : 'None'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">No drivers added yet.</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'allocations' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 font-bold text-gray-900">Student Allocations list</div>

          {loading ? (
            <div className="p-8 text-center text-gray-500 flex justify-center items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" /> Loading Allocations...
            </div>
          ) : allocations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Route Assigned</th>
                    <th className="px-6 py-4">Stop / pickup Stop</th>
                    <th className="px-6 py-4">Session</th>
                    <th className="px-6 py-4">Allocation Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {allocations.map(al => (
                    <tr key={al._id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{al.student?.name}</div>
                        <div className="text-xs text-gray-400">Adm ID: {al.student?.admissionNumber}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-700">{al.route?.name}</td>
                      <td className="px-6 py-4 text-gray-650">{al.stop}</td>
                      <td className="px-6 py-4 text-gray-500">{al.session}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(al.allottedDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">No students allocated routes.</div>
          )}
        </div>
      )}
    </div>
  );
}
