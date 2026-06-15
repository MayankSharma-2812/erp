const Route = require('../models/Route');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const TransportAllocation = require('../models/TransportAllocation');
const FeeLedger = require('../models/FeeLedger');
const Student = require('../models/Student');

// --- ROUTE CRUD ---
const createRoute = async (req, res, next) => {
  try {
    const route = await Route.create(req.body);
    res.status(201).json({
      success: true,
      data: route,
      message: 'Transport route created successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getRoutes = async (req, res, next) => {
  try {
    const routes = await Route.find({}).populate('vehicle').populate('driver').sort({ name: 1 });
    res.status(200).json({
      success: true,
      data: routes,
    });
  } catch (error) {
    next(error);
  }
};

const updateRoute = async (req, res, next) => {
  try {
    const route = await Route.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }
    res.status(200).json({
      success: true,
      data: route,
      message: 'Route details updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

const deleteRoute = async (req, res, next) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.id);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Route deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// --- VEHICLE CRUD ---
const createVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json({
      success: true,
      data: vehicle,
      message: 'Vehicle registered successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({}).sort({ regNumber: 1 });
    res.status(200).json({
      success: true,
      data: vehicles,
    });
  } catch (error) {
    next(error);
  }
};

const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    res.status(200).json({
      success: true,
      data: vehicle,
      message: 'Vehicle updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// --- DRIVER CRUD ---
const createDriver = async (req, res, next) => {
  try {
    const driver = await Driver.create(req.body);
    // Link driver to vehicle if selected
    if (req.body.vehicle) {
      await Vehicle.findByIdAndUpdate(req.body.vehicle, { driver: driver._id });
    }
    res.status(201).json({
      success: true,
      data: driver,
      message: 'Driver profile created successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getDrivers = async (req, res, next) => {
  try {
    const drivers = await Driver.find({}).populate('vehicle').sort({ name: 1 });
    res.status(200).json({
      success: true,
      data: drivers,
    });
  } catch (error) {
    next(error);
  }
};

const updateDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }
    res.status(200).json({
      success: true,
      data: driver,
      message: 'Driver details updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

const deleteDriver = async (req, res, next) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Driver deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// --- STUDENT ROUTE ALLOCATION ---
const allocateTransport = async (req, res, next) => {
  try {
    const { studentId, routeId, stop, session } = req.body;
    if (!studentId || !routeId || !stop || !session) {
      return res.status(400).json({
        success: false,
        message: 'Missing studentId, routeId, stop, or session',
      });
    }

    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Upsert allocation
    const allocation = await TransportAllocation.findOneAndUpdate(
      { student: studentId, session },
      { route: routeId, stop, allottedDate: new Date() },
      { new: true, upsert: true }
    );

    // Update student model reference
    student.transportRoute = routeId;
    await student.save();

    // FINANCE LINKAGE: Append fee head to active student ledger
    const ledger = await FeeLedger.findOne({ student: studentId, session });
    if (ledger) {
      // Check if Transport Route Fee head already exists in ledger entries to prevent duplicates
      const hasFee = ledger.entries.some(e => e.head === 'Transport Route Fee');
      if (!hasFee) {
        ledger.entries.push({
          head: 'Transport Route Fee',
          amount: route.feeAmount,
          dueDate: new Date(),
          status: 'pending',
          paidAmount: 0,
          waivedAmount: 0,
        });

        ledger.totalDue = ledger.entries.reduce((sum, e) => sum + e.amount, 0);
        const totalPaid = ledger.entries.reduce((sum, e) => sum + e.paidAmount, 0);
        const totalWaived = ledger.entries.reduce((sum, e) => sum + e.waivedAmount, 0);
        ledger.balance = ledger.totalDue - totalPaid - totalWaived;
        await ledger.save();
      }
    }

    res.status(200).json({
      success: true,
      data: allocation,
      message: 'Student allocated to route and stop successfully. Fee applied to ledger.',
    });
  } catch (error) {
    next(error);
  }
};

const getAllocations = async (req, res, next) => {
  try {
    const { studentId, routeId } = req.query;
    const query = {};
    if (studentId) query.student = studentId;
    if (routeId) query.route = routeId;

    const allocations = await TransportAllocation.find(query)
      .populate('student')
      .populate('route')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: allocations,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRoute,
  getRoutes,
  updateRoute,
  deleteRoute,
  createVehicle,
  getVehicles,
  updateVehicle,
  deleteVehicle,
  createDriver,
  getDrivers,
  updateDriver,
  deleteDriver,
  allocateTransport,
  getAllocations,
};
