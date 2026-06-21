const mongoose = require('mongoose');

const insurancePlanSchema = new mongoose.Schema(
  {
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    planName: {
      type: String,
      enum: ['Basic', 'Standard', 'Premium Protection'],
      default: 'Basic',
    },
    coverageAmount: {
      type: Number,
      required: true,
    },
    weeklyPremium: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'expired', 'suspended'],
      default: 'active',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    benefits: {
      medicalCoverage: { type: Number, default: 0 },
      vehicleDamage: { type: Number, default: 0 },
      emergencyResponse: { type: Boolean, default: false },
      legalSupport: { type: Boolean, default: false },
    },
    nextPaymentDue: {
      type: Date,
    },
    totalPremiumPaid: {
      type: Number,
      default: 0,
    },
    // ── Advanced Policy Intelligence fields ───────────────────────
    originalCoverageAmount:       { type: Number, default: null },
    coverageAdjustmentPercentage: { type: Number, default: 0 },
    coverageStatus:               { type: String, default: 'Standard' },
    adjustmentReason:             { type: String, default: null },
    adjustmentTimestamp:          { type: Date,   default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InsurancePlan', insurancePlanSchema);
