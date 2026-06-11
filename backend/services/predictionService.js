const Vehicle = require('../models/Vehicle');
const ServiceRecord = require('../models/ServiceRecord');
const MaintenancePrediction = require('../models/MaintenancePrediction');
const Notification = require('../models/Notification');

// Define the rule-based thresholds for each category
const MAINTENANCE_INTERVALS = {
  'Engine Oil': { distance: 10000, days: 180 },       // 10,000 km or 6 months
  'Brake System': { distance: 30000, days: 365 },     // 30,000 km or 1 year
  'Battery': { distance: 50000, days: 730 },          // 50,000 km or 2 years
  'Coolant': { distance: 40000, days: 730 },          // 40,000 km or 2 years
  'Air Filter': { distance: 15000, days: 365 },       // 15,000 km or 1 year
  'Tires': { distance: 60000, days: 1095 },           // 60,000 km or 3 years
};

/**
 * Calculates predictions for all components and the overall health score of a vehicle.
 * @param {string} vehicleId - The MongoDB ID of the vehicle.
 * @returns {Promise<Object>} - The updated or created MaintenancePrediction document.
 */
const calculatePrediction = async (vehicleId) => {
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    throw new Error('Vehicle not found');
  }

  const serviceRecords = await ServiceRecord.find({ vehicle: vehicleId }).sort({ serviceDate: -1 });

  const categories = Object.keys(MAINTENANCE_INTERVALS);
  const predictions = [];
  const currentDate = new Date();

  let dueSoonCount = 0;
  let overdueCount = 0;

  for (const category of categories) {
    // Find the latest service record matching this category
    // Note: serviceCategory matches the prediction category, except for generic ones like 'General Maintenance' or 'Other'
    // which can also reset general items, but for now we look for exact matches or we can look for recent service of that specific type.
    const lastService = serviceRecords.find(r => r.serviceCategory === category);

    let lastServiceDate = vehicle.purchaseDate;
    let lastServiceOdometer = 0;

    if (lastService) {
      lastServiceDate = lastService.serviceDate;
      lastServiceOdometer = lastService.odometerReading;
    }

    const interval = MAINTENANCE_INTERVALS[category];
    const distanceTravelled = vehicle.currentOdometer - lastServiceOdometer;
    const timeElapsedMs = currentDate - new Date(lastServiceDate);
    const daysElapsed = Math.floor(timeElapsedMs / (1000 * 60 * 60 * 24));

    const remainingDistance = interval.distance - distanceTravelled;
    const remainingDays = interval.days - daysElapsed;

    // Determine Status
    let status = 'Healthy';
    if (remainingDistance <= 0 || remainingDays <= 0) {
      status = 'Overdue';
      overdueCount++;
    } else if (remainingDistance <= 0.15 * interval.distance || remainingDays <= 30) {
      status = 'Due Soon';
      dueSoonCount++;
    }

    // Determine Priority Score (0-100)
    // 100 means critical (overdue). Otherwise, we scale based on how close it is to the limit.
    let priorityScore = 0;
    if (status === 'Overdue') {
      priorityScore = 100;
    } else {
      const distanceRatio = Math.max(0, distanceTravelled / interval.distance);
      const daysRatio = Math.max(0, daysElapsed / interval.days);
      const maxRatio = Math.max(distanceRatio, daysRatio);
      priorityScore = Math.min(99, Math.round(maxRatio * 100));
    }

    predictions.push({
      category,
      status,
      lastServiceDate,
      lastServiceOdometer,
      remainingDistance,
      remainingDays,
      priorityScore,
    });
  }

  // Calculate Overall Health Score (0-100)
  // Deduct for:
  // - Age: 2 points per year (max 20 points)
  // - Mileage: 1 point per 20,000 km (max 15 points)
  // - Component health: 25 points per Overdue component, 10 points per Due Soon component
  let healthScore = 100;

  const vehicleAgeYears = currentDate.getFullYear() - vehicle.year;
  const ageDeduction = Math.min(20, Math.max(0, vehicleAgeYears * 2));
  healthScore -= ageDeduction;

  const mileageDeduction = Math.min(15, Math.floor(vehicle.currentOdometer / 20000));
  healthScore -= mileageDeduction;

  const componentDeduction = (overdueCount * 25) + (dueSoonCount * 10);
  healthScore -= componentDeduction;

  // Clamp health score between 0 and 100
  healthScore = Math.max(0, Math.min(100, healthScore));

  // Upsert prediction document in database
  let predictionRecord = await MaintenancePrediction.findOne({ vehicle: vehicleId });
  if (predictionRecord) {
    predictionRecord.predictions = predictions;
    predictionRecord.healthScore = healthScore;
    await predictionRecord.save();
  } else {
    predictionRecord = await MaintenancePrediction.create({
      vehicle: vehicleId,
      predictions,
      healthScore,
    });
  }

  // Trigger Notifications for due soon / overdue components
  await checkAndCreateNotifications(vehicle, predictions);

  return predictionRecord;
};

/**
 * Checks predictions and generates Notification alerts for due/overdue items.
 * Avoids creating duplicate notifications if they haven't been resolved yet.
 */
const checkAndCreateNotifications = async (vehicle, predictions) => {
  for (const pred of predictions) {
    if (pred.status === 'Healthy') continue;

    const notifType = pred.status === 'Overdue' ? 'Maintenance Overdue' : 'Maintenance Due';
    const notifTitle = `${pred.status === 'Overdue' ? 'CRITICAL' : 'Alert'}: ${pred.category} is ${pred.status.toLowerCase()}`;
    const notifMessage = `${vehicle.manufacturer} ${vehicle.model} (${vehicle.registrationNumber}) needs its ${pred.category} serviced. ` +
      (pred.remainingDistance <= 0
        ? `Odometer is over limit by ${Math.abs(pred.remainingDistance)} km.`
        : `${pred.remainingDistance} km remaining. `) +
      (pred.remainingDays <= 0
        ? `Time has exceeded by ${Math.abs(pred.remainingDays)} days.`
        : `${pred.remainingDays} days remaining.`);

    // Check if an unread notification of the same type and category already exists for this vehicle
    const existingNotif = await Notification.findOne({
      user: vehicle.owner,
      vehicle: vehicle._id,
      type: notifType,
      title: notifTitle,
      isRead: false,
    });

    if (!existingNotif) {
      await Notification.create({
        user: vehicle.owner,
        vehicle: vehicle._id,
        type: notifType,
        title: notifTitle,
        message: notifMessage,
      });
    }
  }
};

module.exports = {
  calculatePrediction,
  MAINTENANCE_INTERVALS,
};
