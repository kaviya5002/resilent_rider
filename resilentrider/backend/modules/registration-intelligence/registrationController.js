const { calculateRiskProfile } = require('./riskEngine');
const User = require('../../models/User');

/**
 * @desc  Calculate and return risk profile for a given user or input payload
 * @route POST /api/registration/risk-profile
 * @access Public (can be called pre-signup) or Private (re-calculate for existing user)
 */
const getRiskProfile = async (req, res) => {
  try {
    const {
      userId,           // optional — if provided, persist result to user record
      age,
      vehicleType,
      city,
      dailyHours,
      accidentHistory,
    } = req.body;

    if (!vehicleType || !city) {
      return res.status(400).json({
        success: false,
        message: 'vehicleType and city are required',
      });
    }

    const profile = calculateRiskProfile({ age, vehicleType, city, dailyHours, accidentHistory });

    // ── Persist to user record if userId supplied ─────────────────────────
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        riskScore:       profile.riskScore,
        riskLevel:       profile.riskLevel,
        recommendedPlan: profile.recommendedPlan,
      });
    }

    // ── Console log for testing ───────────────────────────────────────────
    console.log('\n📊 [RegistrationIntelligence] Risk Profile Calculated');
    console.log('─────────────────────────────────────────────────────');
    console.log(`  User ID      : ${userId || 'N/A (pre-signup call)'}`);
    console.log(`  Vehicle Type : ${vehicleType}`);
    console.log(`  City         : ${city}`);
    console.log(`  Age          : ${age ?? 'not provided'}`);
    console.log(`  Daily Hours  : ${dailyHours ?? 0}`);
    console.log(`  Accidents    : ${accidentHistory ?? 0}`);
    console.log('  ── Breakdown ──────────────────────────────────────');
    console.log(`  Age Risk      : ${profile.breakdown.ageRisk}`);
    console.log(`  Vehicle Risk  : ${profile.breakdown.vehicleRisk}`);
    console.log(`  City Risk     : ${profile.breakdown.cityRisk}`);
    console.log(`  Hours Risk    : ${profile.breakdown.hoursRisk}`);
    console.log(`  Accident Risk : ${profile.breakdown.accidentRisk}`);
    console.log('  ── Result ─────────────────────────────────────────');
    console.log(`  Risk Score    : ${profile.riskScore}`);
    console.log(`  Risk Level    : ${profile.riskLevel}`);
    console.log(`  Recommended   : ${profile.recommendedPlan}`);
    console.log('─────────────────────────────────────────────────────\n');

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error('[RegistrationIntelligence] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getRiskProfile };
