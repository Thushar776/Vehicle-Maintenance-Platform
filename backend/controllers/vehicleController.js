const Vehicle = require('../models/Vehicle');
const ServiceRecord = require('../models/ServiceRecord');
const MaintenancePrediction = require('../models/MaintenancePrediction');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const { calculatePrediction } = require('../services/predictionService');

// @desc    Get all vehicles (authenticated user)
// @route   GET /api/vehicles
// @access  Private
exports.getVehicles = async (req, res, next) => {
  try {
    let query;
    if (req.user.role === 'admin') {
      query = Vehicle.find().populate('owner', 'name email');
    } else {
      query = Vehicle.find({ owner: req.user._id });
    }

    const vehicles = await query.sort({ createdAt: -1 });

    // Attach predictions to list of vehicles for convenience
    const vehiclesWithPredictions = await Promise.all(
      vehicles.map(async (vehicle) => {
        let prediction = await MaintenancePrediction.findOne({ vehicle: vehicle._id });
        if (!prediction) {
          // Calculate if missing
          try {
            prediction = await calculatePrediction(vehicle._id);
          } catch (err) {
            console.error(`Failed to calculate prediction for ${vehicle._id}: ${err.message}`);
          }
        }
        return {
          ...vehicle.toObject(),
          prediction: prediction ? { healthScore: prediction.healthScore, predictions: prediction.predictions } : null,
        };
      })
    );

    res.json({
      success: true,
      count: vehiclesWithPredictions.length,
      vehicles: vehiclesWithPredictions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single vehicle details
// @route   GET /api/vehicles/:id
// @access  Private
exports.getVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Verify ownership or admin role
    if (vehicle.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this vehicle' });
    }

    // Get prediction and recent service records
    let prediction = await MaintenancePrediction.findOne({ vehicle: vehicle._id });
    if (!prediction) {
      prediction = await calculatePrediction(vehicle._id);
    }

    const services = await ServiceRecord.find({ vehicle: vehicle._id }).sort({ serviceDate: -1 });

    res.json({
      success: true,
      vehicle,
      prediction,
      services,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add new vehicle
// @route   POST /api/vehicles
// @access  Private
exports.addVehicle = async (req, res, next) => {
  try {
    const {
      registrationNumber,
      manufacturer,
      model,
      variant,
      year,
      fuelType,
      purchaseDate,
      currentOdometer,
      vehicleType,
    } = req.body;

    const registrationExists = await Vehicle.findOne({ registrationNumber });
    if (registrationExists) {
      return res.status(400).json({ success: false, message: 'Vehicle with this registration number already exists' });
    }

    const vehicle = await Vehicle.create({
      owner: req.user._id,
      registrationNumber,
      manufacturer,
      model,
      variant,
      year,
      fuelType,
      purchaseDate,
      currentOdometer,
      vehicleType,
    });

    // Run initial prediction calculation
    let prediction;
    try {
      prediction = await calculatePrediction(vehicle._id);
    } catch (err) {
      console.error(`Initial prediction calculation failed: ${err.message}`);
    }

    res.status(201).json({
      success: true,
      vehicle,
      prediction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update vehicle
// @route   PUT /api/vehicles/:id
// @access  Private
exports.updateVehicle = async (req, res, next) => {
  try {
    let vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Verify ownership or admin role
    if (vehicle.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this vehicle' });
    }

    const { currentOdometer, registrationNumber, ...otherFields } = req.body;

    // Validate registration number unique constraint if modified
    if (registrationNumber && registrationNumber !== vehicle.registrationNumber) {
      const regExists = await Vehicle.findOne({ registrationNumber });
      if (regExists) {
        return res.status(400).json({ success: false, message: 'Vehicle with this registration number already exists' });
      }
      vehicle.registrationNumber = registrationNumber;
    }

    // Prevent odometer from decreasing
    let odoUpdated = false;
    if (currentOdometer !== undefined) {
      if (currentOdometer < vehicle.currentOdometer) {
        return res.status(400).json({ success: false, message: 'Odometer reading cannot be decreased' });
      }
      if (currentOdometer !== vehicle.currentOdometer) {
        vehicle.currentOdometer = currentOdometer;
        odoUpdated = true;
      }
    }

    // Apply other updates
    Object.keys(otherFields).forEach((key) => {
      vehicle[key] = otherFields[key];
    });

    await vehicle.save();

    // Recalculate predictions if odometer or purchase/year was changed
    let prediction = null;
    if (odoUpdated || req.body.purchaseDate || req.body.year) {
      prediction = await calculatePrediction(vehicle._id);
    } else {
      prediction = await MaintenancePrediction.findOne({ vehicle: vehicle._id });
    }

    res.json({
      success: true,
      vehicle,
      prediction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private
exports.deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Verify ownership or admin role
    if (vehicle.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this vehicle' });
    }

    // Cascade delete associated documents
    await ServiceRecord.deleteMany({ vehicle: vehicle._id });
    await MaintenancePrediction.deleteMany({ vehicle: vehicle._id });
    await Appointment.deleteMany({ vehicle: vehicle._id });
    await Notification.deleteMany({ vehicle: vehicle._id });

    await Vehicle.findByIdAndDelete(vehicle._id);

    res.json({
      success: true,
      message: 'Vehicle and all associated records deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
