const ServiceRecord = require('../models/ServiceRecord');
const Vehicle = require('../models/Vehicle');
const { calculatePrediction } = require('../services/predictionService');

// @desc    Get all service records for a vehicle
// @route   GET /api/services/vehicle/:vehicleId
// @access  Private
exports.getVehicleServices = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Verify ownership or admin
    if (vehicle.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view service records for this vehicle' });
    }

    const services = await ServiceRecord.find({ vehicle: req.params.vehicleId }).sort({ serviceDate: -1 });

    res.json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all service records (authenticated user's vehicles)
// @route   GET /api/services
// @access  Private
exports.getServices = async (req, res, next) => {
  try {
    let query;
    if (req.user.role === 'admin') {
      query = ServiceRecord.find().populate({
        path: 'vehicle',
        populate: { path: 'owner', select: 'name email' },
      });
    } else {
      // Find user's vehicles first
      const vehicles = await Vehicle.find({ owner: req.user._id });
      const vehicleIds = vehicles.map(v => v._id);
      query = ServiceRecord.find({ vehicle: { $in: vehicleIds } }).populate('vehicle');
    }

    const services = await query.sort({ serviceDate: -1 });

    res.json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single service record
// @route   GET /api/services/:id
// @access  Private
exports.getService = async (req, res, next) => {
  try {
    const service = await ServiceRecord.findById(req.params.id).populate('vehicle');
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service record not found' });
    }

    // Verify ownership or admin
    if (service.vehicle.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this service record' });
    }

    res.json({
      success: true,
      service,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add service record
// @route   POST /api/services
// @access  Private
exports.addService = async (req, res, next) => {
  try {
    const {
      vehicle: vehicleId,
      serviceDate,
      odometerReading,
      serviceCategory,
      serviceDescription,
      partsReplaced,
      cost,
      serviceCenter,
      notes,
    } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Verify ownership or admin
    if (vehicle.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to modify records for this vehicle' });
    }

    // Odometer shouldn't be less than vehicle's initial value when logged
    if (odometerReading < 0) {
      return res.status(400).json({ success: false, message: 'Service odometer cannot be negative' });
    }

    const service = await ServiceRecord.create({
      vehicle: vehicleId,
      serviceDate,
      odometerReading,
      serviceCategory,
      serviceDescription,
      partsReplaced,
      cost,
      serviceCenter,
      notes,
    });

    // Auto-update vehicle's current odometer if this service record odometer is higher
    if (odometerReading > vehicle.currentOdometer) {
      vehicle.currentOdometer = odometerReading;
      await vehicle.save();
    }

    // Recalculate predictions
    let prediction;
    try {
      prediction = await calculatePrediction(vehicleId);
    } catch (err) {
      console.error(`Failed to calculate prediction: ${err.message}`);
    }

    res.status(201).json({
      success: true,
      service,
      prediction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit service record
// @route   PUT /api/services/:id
// @access  Private
exports.editService = async (req, res, next) => {
  try {
    let service = await ServiceRecord.findById(req.params.id).populate('vehicle');
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service record not found' });
    }

    // Verify ownership or admin
    if (service.vehicle.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this service record' });
    }

    const updates = req.body;
    
    // Block vehicle swap
    delete updates.vehicle;

    Object.keys(updates).forEach((key) => {
      service[key] = updates[key];
    });

    await service.save();

    // Check if odometer is updated and we should update the vehicle's currentOdometer
    const vehicle = await Vehicle.findById(service.vehicle._id);
    if (vehicle && service.odometerReading > vehicle.currentOdometer) {
      vehicle.currentOdometer = service.odometerReading;
      await vehicle.save();
    }

    // Recalculate predictions
    let prediction = null;
    try {
      prediction = await calculatePrediction(service.vehicle._id);
    } catch (err) {
      console.error(`Failed to calculate prediction: ${err.message}`);
    }

    res.json({
      success: true,
      service,
      prediction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete service record
// @route   DELETE /api/services/:id
// @access  Private
exports.deleteService = async (req, res, next) => {
  try {
    const service = await ServiceRecord.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service record not found' });
    }

    const vehicle = await Vehicle.findById(service.vehicle);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Associated vehicle not found' });
    }

    // Verify ownership or admin
    if (vehicle.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this service record' });
    }

    const vehicleId = service.vehicle;
    await ServiceRecord.findByIdAndDelete(service._id);

    // Recalculate predictions
    let prediction = null;
    try {
      prediction = await calculatePrediction(vehicleId);
    } catch (err) {
      console.error(`Failed to calculate prediction: ${err.message}`);
    }

    res.json({
      success: true,
      message: 'Service record deleted successfully',
      prediction,
    });
  } catch (error) {
    next(error);
  }
};
