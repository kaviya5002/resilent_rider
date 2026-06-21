/**
 * Policy Engine — Recommendation Logic
 * --------------------------------------
 * Pure function. No DB, no Express.
 * Maps a riskScore (0–100) to a policy tier.
 *
 * Tiers:
 *   0–40  → Basic Protection    | coverage ₹50,000  | premium ₹300/mo
 *   41–70 → Standard Protection | coverage ₹100,000 | premium ₹600/mo
 *   71+   → Premium Protection  | coverage ₹200,000 | premium ₹1,200/mo
 */

const POLICY_TIERS = {
  LOW: {
    policyType:     'Basic Protection',
    coverageAmount: 50000,
    premiumAmount:  300,
  },
  MEDIUM: {
    policyType:     'Standard Protection',
    coverageAmount: 100000,
    premiumAmount:  600,
  },
  HIGH: {
    policyType:     'Premium Protection',
    coverageAmount: 200000,
    premiumAmount:  1200,
  },
};

/**
 * recommendPolicy
 * @param {number} riskScore — 0 to 100
 * @returns {{ policyType, coverageAmount, premiumAmount, riskLevel }}
 */
function recommendPolicy(riskScore) {
  const score = Number(riskScore) || 50;

  let riskLevel;
  if (score <= 40)      riskLevel = 'LOW';
  else if (score <= 70) riskLevel = 'MEDIUM';
  else                  riskLevel = 'HIGH';

  return { ...POLICY_TIERS[riskLevel], riskLevel };
}

module.exports = { recommendPolicy };
