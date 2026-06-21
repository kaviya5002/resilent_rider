const mongoose = require('mongoose');

const insurancePolicySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
    },
    policyType: {
      type: String,
      required: true,
      trim: true,
    },
    coverageAmount: {
      type: Number,
      required: true,
    },
    premiumAmount: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Created', 'Active', 'Under Review', 'Renewed', 'Expired', 'Cancelled'],
      default: 'Created',
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', null],
      default: null,
    },
    recommendedPlan: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }   // provides createdAt + updatedAt automatically
);

module.exports = mongoose.model('InsurancePolicy', insurancePolicySchema);
