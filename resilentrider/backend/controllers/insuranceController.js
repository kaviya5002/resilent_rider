const InsurancePlan = require('../models/InsurancePlan');
const Transaction = require('../models/Transaction');

// @desc    Get rider's active insurance plan
// @route   GET /api/insurance/my-plan
// @access  Private (user)
const getMyPlan = async (req, res) => {
  try {
    const plan = await InsurancePlan.findOne({
      rider: req.user.id,
      status: 'active',
    });

    res.status(200).json({ success: true, data: plan || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Subscribe to an insurance plan
// @route   POST /api/insurance/subscribe
// @access  Private (user)
const subscribePlan = async (req, res) => {
  try {
    const { planName } = req.body;

    const planDetails = {
      Basic: {
        coverageAmount: 10000,
        weeklyPremium: 5,
        benefits: { medicalCoverage: 5000, vehicleDamage: 3000, emergencyResponse: false, legalSupport: false },
      },
      Standard: {
        coverageAmount: 25000,
        weeklyPremium: 8.5,
        benefits: { medicalCoverage: 12000, vehicleDamage: 8000, emergencyResponse: true, legalSupport: false },
      },
      'Premium Protection': {
        coverageAmount: 50000,
        weeklyPremium: 12.5,
        benefits: { medicalCoverage: 25000, vehicleDamage: 15000, emergencyResponse: true, legalSupport: true },
      },
    };

    const selected = planDetails[planName];
    if (!selected) {
      return res.status(400).json({ success: false, message: 'Invalid plan name' });
    }

    // Deactivate existing plan
    await InsurancePlan.updateMany({ rider: req.user.id, status: 'active' }, { status: 'inactive' });

    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    const nextPaymentDue = new Date();
    nextPaymentDue.setDate(nextPaymentDue.getDate() + 7);

    const plan = await InsurancePlan.create({
      rider: req.user.id,
      planName,
      ...selected,
      endDate,
      nextPaymentDue,
    });

    // Record premium transaction
    await Transaction.create({
      rider: req.user.id,
      type: 'premium_payment',
      amount: selected.weeklyPremium,
      description: `${planName} plan subscription`,
      status: 'completed',
    });

    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all available plan options
// @route   GET /api/insurance/plans
// @access  Public
const getAvailablePlans = async (req, res) => {
  const plans = [
    {
      name: 'Basic',
      coverageAmount: 10000,
      weeklyPremium: 5,
      benefits: { medicalCoverage: 5000, vehicleDamage: 3000, emergencyResponse: false, legalSupport: false },
    },
    {
      name: 'Standard',
      coverageAmount: 25000,
      weeklyPremium: 8.5,
      benefits: { medicalCoverage: 12000, vehicleDamage: 8000, emergencyResponse: true, legalSupport: false },
    },
    {
      name: 'Premium Protection',
      coverageAmount: 50000,
      weeklyPremium: 12.5,
      benefits: { medicalCoverage: 25000, vehicleDamage: 15000, emergencyResponse: true, legalSupport: true },
    },
  ];

  res.status(200).json({ success: true, data: plans });
};

// @desc    Get dynamic premium calculation based on rider risk score
// @route   GET /api/insurance/premium
// @access  Private
const getDynamicPremium = async (req, res) => {
  try {
    const User = require('../models/User');
    const { buildRiderProfile } = require('../services/learningService');

    const [rider, profile] = await Promise.all([
      User.findById(req.user.id),
      buildRiderProfile(req.user.id),
    ]);

    const riskScore = rider.riskScore || 90;

    // ── Base premium ─────────────────────────────────────────────────────
    const basePremium = 10;

    // ── Risk multiplier: low score = higher risk = higher factor ───────────
    const riskFactor = parseFloat((1 + (100 - riskScore) / 100).toFixed(2));

    // ── Behavior factor from learned profile ───────────────────────────
    // premiumAdjustment: 0.88 (consistent daytime) – 1.18 (erratic night rider)
    const behaviorFactor = profile ? parseFloat(profile.premiumAdjustment.toFixed(3)) : 1.0;

    // ── Final: premium = basePremium * riskFactor * behaviorFactor ────────
    const finalPremium = parseFloat((basePremium * riskFactor * behaviorFactor).toFixed(2));

    // Behavior score: inverse of premiumAdjustment mapped to 0–100
    // 0.88 → 100 (best), 1.18 → 0 (worst), 1.0 → ~73
    const behaviorScore = Math.round(Math.max(0, Math.min(100,
      ((1.20 - behaviorFactor) / (1.20 - 0.85)) * 100
    )));

    res.status(200).json({
      success: true,
      data: {
        basePremium,
        riskScore,
        riskFactor,
        behaviorFactor,
        behaviorScore,
        finalPremium,
        // kept for DynamicPricing.jsx which reads riskFactor + finalPremium
        profile: profile ? {
          earningsTrend:   profile.earningsTrend,
          preferredShifts: profile.preferredShifts,
          topZones:        profile.topZones,
        } : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMyPlan, subscribePlan, getAvailablePlans, getDynamicPremium };
