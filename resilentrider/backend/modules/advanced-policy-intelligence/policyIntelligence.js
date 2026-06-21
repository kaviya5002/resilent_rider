const { calculatePolicyHealthScore } = require('./policyHealthScore');
const { adjustCoverageBasedOnRisk }  = require('./coverageAdjustment');
const { predictClaimRisk }           = require('./claimPrediction');

async function runAdvancedPolicyIntelligence(userId) {
  const [claimResult, healthResult, coverageResult] = await Promise.all([
    predictClaimRisk(userId),
    calculatePolicyHealthScore(userId),
    adjustCoverageBasedOnRisk(userId),
  ]);

  const alerts = [];
  if (claimResult.alertMessage)  alerts.push(claimResult.alertMessage);
  if (healthResult.policyHealthCategory === 'Critical') alerts.push(`🚨 Policy health is Critical (${healthResult.policyHealthScore}/100). Immediate attention required.`);
  if (healthResult.policyHealthCategory === 'Risky')    alerts.push(`⚠️ Policy health is Risky (${healthResult.policyHealthScore}/100). Review your policy.`);
  if (coverageResult.coverageStatus === 'Temporarily Increased') alerts.push(`📈 Coverage temporarily increased: ${coverageResult.adjustmentReason}`);

  console.log(`[PolicyIntelligence] Advanced policy intelligence executed for user ${userId}`);

  return {
    claimRiskScore:    claimResult.claimRiskScore,
    claimRiskLevel:    claimResult.claimRiskLevel,
    policyHealthScore: healthResult.policyHealthScore,
    policyHealthCategory: healthResult.policyHealthCategory,
    newCoverageAmount: coverageResult.newCoverageAmount,
    coverageStatus:    coverageResult.coverageStatus,
    adjustmentReason:  coverageResult.adjustmentReason,
    alerts,
  };
}

module.exports = { runAdvancedPolicyIntelligence };
