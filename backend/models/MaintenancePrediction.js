const mongoose = require('mongoose');

const PredictionCategorySchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['Engine Oil', 'Brake System', 'Battery', 'Coolant', 'Air Filter', 'Tires'],
    required: true,
  },
  status: {
    type: String,
    enum: ['Healthy', 'Due Soon', 'Overdue'],
    required: true,
    default: 'Healthy',
  },
  lastServiceDate: {
    type: Date,
  },
  lastServiceOdometer: {
    type: Number,
  },
  remainingDistance: {
    type: Number,
    required: true,
  },
  remainingDays: {
    type: Number,
    required: true,
  },
  priorityScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
  },
});

const MaintenancePredictionSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      unique: true, // One prediction record per vehicle
    },
    predictions: [PredictionCategorySchema],
    healthScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 100,
    },
  },
  {
    timestamps: true,
  }
);

MaintenancePredictionSchema.index({ vehicle: 1 });

module.exports = mongoose.model('MaintenancePrediction', MaintenancePredictionSchema);
