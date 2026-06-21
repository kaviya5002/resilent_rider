const mongoose = require('mongoose');

// One document per rider — upserted by learningService on every AI call.
const riderProfileSchema = new mongoose.Schema(
  {
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // hourCounts[h] = number of earning transactions at hour h (0–23)
    hourCounts: { type: [Number], default: () => Array(24).fill(0) },

    // Top-2 preferred shift buckets: 'morning' | 'afternoon' | 'evening' | 'night'
    preferredShifts: { type: [String], default: [] },

    // { 'Downtown District': 14, 'Airport Zone': 9, … }
    zoneCounts: { type: Map, of: Number, default: {} },

    // Top-3 zone names by visit frequency
    topZones: { type: [String], default: [] },

    avgDailyEarnings:  { type: Number, default: 0 },
    avgWeeklyEarnings: { type: Number, default: 0 },
    earningsTrend:     { type: String, enum: ['rising', 'stable', 'falling'], default: 'stable' },
    earningsCV:        { type: Number, default: 0.3 },  // coefficient of variation

    // Applied to overallRisk in getRiskScore  (-8 to +15)
    riskAdjustment:    { type: Number, default: 0 },

    // Multiplied into finalPremium in getDynamicPremium  (0.85–1.20)
    premiumAdjustment: { type: Number, default: 1.0 },

    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

module.exports = mongoose.model('RiderProfile', riderProfileSchema);
