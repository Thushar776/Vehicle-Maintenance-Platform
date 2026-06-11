const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const ServiceRecord = require('../models/ServiceRecord');
const Appointment = require('../models/Appointment');
const MaintenancePrediction = require('../models/MaintenancePrediction');

// @desc    Get all users (Admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role (Admin only)
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Prevent admin from changing their own role
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: 'User role updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user and cascade delete all their data (Admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete yourself' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Find all vehicles owned by user
    const vehicles = await Vehicle.find({ owner: user._id });
    const vehicleIds = vehicles.map(v => v._id);

    // Cascade delete everything related to the user's vehicles
    await ServiceRecord.deleteMany({ vehicle: { $in: vehicleIds } });
    await MaintenancePrediction.deleteMany({ vehicle: { $in: vehicleIds } });
    await Appointment.deleteMany({ vehicle: { $in: vehicleIds } });

    // Delete user's vehicles
    await Vehicle.deleteMany({ owner: user._id });

    // Delete user's direct records (appointments, etc. booked directly)
    await Appointment.deleteMany({ user: user._id });

    // Delete user
    await User.findByIdAndDelete(user._id);

    res.json({
      success: true,
      message: 'User and all associated vehicles and records deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get global platform stats (Admin only)
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getPlatformStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalVehicles = await Vehicle.countDocuments({});
    const totalServices = await ServiceRecord.countDocuments({});
    const totalAppointments = await Appointment.countDocuments({});

    // Calculate database distributions
    const vehicles = await Vehicle.find({});
    const fuelDist = { Petrol: 0, Diesel: 0, Electric: 0, Hybrid: 0, CNG: 0 };
    vehicles.forEach(v => {
      if (fuelDist[v.fuelType] !== undefined) {
        fuelDist[v.fuelType]++;
      }
    });

    const appointments = await Appointment.find({});
    const appointStatusDist = { Pending: 0, Confirmed: 0, Completed: 0, Cancelled: 0 };
    appointments.forEach(a => {
      if (appointStatusDist[a.status] !== undefined) {
        appointStatusDist[a.status]++;
      }
    });

    // Health summary
    const predictions = await MaintenancePrediction.find({});
    let totalScore = 0;
    predictions.forEach(p => {
      totalScore += p.healthScore;
    });
    const avgHealthScore = predictions.length > 0 ? Math.round(totalScore / predictions.length) : 100;

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalVehicles,
        totalServices,
        totalAppointments,
        avgHealthScore,
        fuelDistribution: fuelDist,
        appointmentDistribution: appointStatusDist,
      },
    });
  } catch (error) {
    next(error);
  }
};
