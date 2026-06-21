const mongoose = require('mongoose');

const locationLogSchema = new mongoose.Schema(
  {
    rider: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Rider ID is required'],
      index:    true,
    },
    latitude: {
      type:     Number,
      required: [true, 'Latitude is required'],
      min:      [-90,  'Latitude must be between -90 and 90'],
      max:      [90,   'Latitude must be between -90 and 90'],
    },
    longitude: {
      type:     Number,
      required: [true, 'Longitude is required'],
      min:      [-180, 'Longitude must be between -180 and 180'],
      max:      [180,  'Longitude must be between -180 and 180'],
    },
    speed: {
      type:    Number,
      default: 0,
      min:     [0, 'Speed cannot be negative'],
    },
    timestamp: {
      type:    Date,
      default: Date.now,
      index:   true,
    },
  },
  { timestamps: false }
);

// Compound index: fast per-rider history queries sorted by latest
locationLogSchema.index({ rider: 1, timestamp: -1 });

module.exports = mongoose.model('LocationLog', locationLogSchema);
