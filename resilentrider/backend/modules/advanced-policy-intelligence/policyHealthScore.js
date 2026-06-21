const User          = require('../../models/User');
const Claim         = require('../../models/Claim');
const InsurancePlan = require('../../models/InsurancePlan');

async function calculatePolicyHealthScore(userId) {
  const now       = new Date();
  const thirtyDaysAgo  = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);

  const [user, plan, recentClaims] = await Promise.all([
    User.findById(userId),
    InsurancePlan.findOne({ rider: userId, status: 'active' }),
    Claim.find({ rider: userId, createdAt: { $gte: thirtyDaysAgo } }),
  ]);

  let healthScore = 100;

  // Claims in last 30 days
  if (recentClaims.length > 2) healthScore -= 20;

  // Payment regularity — check if nextPaymentDue is overdue
  if (plan && plan.nextPaymentDue && plan.nextPaymentDue < now) healthScore -= 15;

  // Risk level
  if (user.riskLevel === 'HIGH') healthScore -= 20;

  // No activity in last 14 days
  if (!user.lastLogin || user.lastLogin < fourteenDaysAgo) healthScore -= 10;

  // Recent accident claim
  const hasAccident = recentClaims.some(c => c.claimType === 'accident');
  if (hasAccident) healthScore -= 25;

  // Clamp between 0 and 100
  healthScore = Math.min(100, Math.max(0, healthScore));

  // Category
  let policyHealthCategory;
  if      (healthScore >= 80) policyHealthCategory = 'Healthy';
  else if (healthScore >= 60) policyHealthCategory = 'Stable';
  else if (healthScore >= 40) policyHealthCategory = 'Risky';
  else                        policyHealthCategory = 'Critical';

  // Persist to user
  await User.findByIdAndUpdate(userId, {
    policyHealthScore:    healthScore,
    policyHealthCategory,
    lastHealthCheckDate:  now,
  });

  console.log(`[PolicyHealth] Policy health score calculated for user ${userId}: ${healthScore} (${policyHealthCategory})`);

  return { policyHealthScore: healthScore, policyHealthCategory };
}

module.exports = { calculatePolicyHealthScore };
