const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['rider', 'admin'],
      default: 'rider',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    vehicleType: {
      type: String,
      trim: true,
      default: '',
    },
    // ── Registration Intelligence fields ──────────────────────────
    riskScore: {
      type: Number,
      default: null,
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
    // ── Identity Verification fields ──────────────────────────────
    emailVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    kycStatus: {
      type: String,
      enum: ['Pending', 'Verified', 'Rejected'],
      default: 'Pending',
    },
    // ── Profile & Settings fields ──────────────────────────────────
    address: {
      type: String,
      trim: true,
      default: '',
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    notifications: {
      email:           { type: Boolean, default: true  },
      sms:             { type: Boolean, default: false },
      claimAlerts:     { type: Boolean, default: true  },
      premiumReminder: { type: Boolean, default: true  },
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'light',
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    // ── Admin system settings ──────────────────────────────────────
    adminSettings: {
      maintenanceMode:    { type: Boolean, default: false },
      autoClaimApproval:  { type: Boolean, default: false },
      fraudAlertsEnabled: { type: Boolean, default: true  },
      newClaimNotifs:     { type: Boolean, default: true  },
      fraudDetectionAlerts: { type: Boolean, default: true },
      systemErrorAlerts:  { type: Boolean, default: true  },
    },
    // ── Advanced Policy Intelligence fields ───────────────────────
    policyHealthScore:    { type: Number, default: null },
    policyHealthCategory: { type: String, enum: ['Healthy', 'Stable', 'Risky', 'Critical', null], default: null },
    lastHealthCheckDate:  { type: Date,   default: null },
    claimRiskScore:       { type: Number, default: null },
    claimRiskLevel:       { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', null], default: null },
    predictionTimestamp:  { type: Date,   default: null },
    alertGenerated:       { type: Boolean, default: false },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
