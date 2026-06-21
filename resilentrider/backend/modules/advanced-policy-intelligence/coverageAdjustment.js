const InsurancePlan  = require('../../models/InsurancePlan');
const RiderProfile   = require('../../models/RiderProfile');
const Claim          = require('../../models/Claim');

const HIGH_RISK_WEATHER = ['Heavy Rain', 'Storm', 'Flood', 'Extreme Heat'];

async function adjustCoverageBasedOnRisk(userId) {
  const now = new Date();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [plan, profile, recentClaims] = await Promise.all([
    InsurancePlan.findOne({ rider: userId, status: 'active' }),
    RiderProfile.findOne({ rider: userId }),
    Claim.find({ rider: userId, createdAt: { $gte: sevenDaysAgo } }),
  ]);

  if (!plan) {
    return { newCoverageAmount: null, coverageStatus: 'No active plan', adjustmentReason: 'No active insurance plan found' };
  }

  // Store original if not already stored
  if (!plan.originalCoverageAmount) {
    plan.originalCoverageAmount = plan.coverageAmount;
  }

  const baseCoverage = plan.originalCoverageAmount || plan.coverageAmount;
  let newCoverageAmount    = baseCoverage;
  let coverageStatus       = 'Standard';
  let adjustmentReason     = 'No adjustment needed';
  let adjustmentPercentage = 0;

  // Check weather risk signal from rider profile zone
  const topZone        = profile?.topZones?.[0] || '';
  const weatherRisk    = HIGH_RISK_WEATHER.some(w => topZone.toLowerCase().includes(w.toLowerCase()));

  // Accident trend: more than 1 claim in last 7 days
  const accidentTrend  = recentClaims.filter(c => c.claimType === 'accident').length > 1;

  // Night-time activity
  const nightShift     = profile?.preferredShifts?.includes('night') || false;

  if (weatherRisk) {
    newCoverageAmount    = Math.round(baseCoverage * 1.10);
    coverageStatus       = 'Temporarily Increased';
    adjustmentReason     = 'Heavy Rain / Storm detected in operating zone';
    adjustmentPercentage = 10;
  } else if (accidentTrend) {
    newCoverageAmount    = Math.round(baseCoverage * 1.15);
    coverageStatus       = 'Temporarily Increased';
    adjustmentReason     = 'Rising accident trend detected';
    adjustmentPercentage = 15;
  } else if (nightShift) {
    newCoverageAmount    = Math.round(baseCoverage * 1.05);
    coverageStatus       = 'Temporarily Increased';
    adjustmentReason     = 'Night-time activity detected — higher risk window';
    adjustmentPercentage = 5;
  } else {
    // Restore original
    newCoverageAmount    = baseCoverage;
    coverageStatus       = 'Standard';
    adjustmentReason     = 'Risk level LOW — original coverage restored';
    adjustmentPercentage = 0;
  }

  // Persist adjustments to plan
  await InsurancePlan.findByIdAndUpdate(plan._id, {
    coverageAmount:           newCoverageAmount,
    coverageAdjustmentPercentage: adjustmentPercentage,
    coverageStatus,
    adjustmentReason,
    adjustmentTimestamp:      now,
    originalCoverageAmount:   baseCoverage,
  });

  console.log(`[CoverageAdjust] Coverage adjusted for user ${userId}: $${newCoverageAmount} — ${adjustmentReason}`);

  return { newCoverageAmount, coverageStatus, adjustmentReason };
}

module.exports = { adjustCoverageBasedOnRisk };
