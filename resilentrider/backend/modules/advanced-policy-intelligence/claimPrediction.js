const User         = require('../../models/User');
const Claim        = require('../../models/Claim');
const RiderProfile = require('../../models/RiderProfile');

async function predictClaimRisk(userId) {
  const now          = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [user, profile, recentClaims] = await Promise.all([
    User.findById(userId),
    RiderProfile.findOne({ rider: userId }),
    Claim.find({ rider: userId, createdAt: { $gte: thirtyDaysAgo } }),
  ]);

  let claimRiskScore = 0;

  // Accident history
  const hasAccidentHistory = recentClaims.some(c => c.claimType === 'accident');
  if (hasAccidentHistory) claimRiskScore += 25;

  // Night shift activity
  const worksNightShift = profile?.preferredShifts?.includes('night') || false;
  if (worksNightShift) claimRiskScore += 15;

  // High-risk zone (top zone contains risk keywords)
  const topZone       = profile?.topZones?.[0] || '';
  const highRiskZone  = ['highway', 'industrial', 'port', 'airport'].some(k => topZone.toLowerCase().includes(k));
  if (highRiskZone) claimRiskScore += 20;

  // Weather risk from user's risk level
  const weatherRiskHigh = user.riskLevel === 'HIGH';
  if (weatherRiskHigh) claimRiskScore += 20;

  // Recent claims exist
  if (recentClaims.length > 0) claimRiskScore += 20;

  // Clamp to 100
  claimRiskScore = Math.min(100, claimRiskScore);

  // Risk level
  let claimRiskLevel;
  if      (claimRiskScore <= 40) claimRiskLevel = 'LOW';
  else if (claimRiskScore <= 70) claimRiskLevel = 'MEDIUM';
  else                           claimRiskLevel = 'HIGH';

  // Alert message
  let alertMessage  = null;
  let alertGenerated = false;

  if (claimRiskLevel === 'HIGH') {
    alertGenerated = true;
    alertMessage   = `⚠️ High claim risk detected (score: ${claimRiskScore}/100). Factors: ${[
      hasAccidentHistory && 'accident history',
      worksNightShift    && 'night shifts',
      highRiskZone       && 'high-risk zone',
      weatherRiskHigh    && 'high weather risk',
      recentClaims.length > 0 && 'recent claims',
    ].filter(Boolean).join(', ')}.`;
  } else if (claimRiskLevel === 'MEDIUM') {
    alertMessage = `📋 Moderate claim risk (score: ${claimRiskScore}/100). Monitor your riding conditions.`;
  } else {
    alertMessage = `✅ Low claim risk (score: ${claimRiskScore}/100). Keep up the safe riding!`;
  }

  // Persist to user
  await User.findByIdAndUpdate(userId, {
    claimRiskScore,
    claimRiskLevel,
    predictionTimestamp: now,
    alertGenerated,
  });

  console.log(`[ClaimPredict] Claim risk prediction completed for user ${userId}: ${claimRiskLevel} (${claimRiskScore})`);

  return { claimRiskScore, claimRiskLevel, alertMessage };
}

module.exports = { predictClaimRisk };
