/**
 * Claims Intelligence — Fraud Scorer
 * ------------------------------------
 * Pure function. No DB, no Express.
 *
 * Scoring rules:
 *   +30  amount > 50,000
 *   +25  more than 3 claims in last 30 days
 *   +15  claim time between 12 AM and 5 AM
 *   +20  location is in a high-risk zone
 *
 * Status thresholds:
 *   0–40  → approved
 *   41–70 → under_review
 *   71+   → fraud_suspected
 */

const HIGH_RISK_ZONES = [
  'downtown',
  'industrial area',
  'industrial zone',
  'highway',
  'night market',
  'port area',
  'warehouse district',
];

/**
 * calculateFraudScore
 * @param {object} params
 * @param {number}   params.amount          — claim amount
 * @param {number}   params.recentClaimCount — claims filed by this rider in last 30 days
 * @param {Date}     params.claimTime        — when the claim was submitted
 * @param {string}   params.location         — incident location string
 * @returns {{ fraudScore, breakdown }}
 */
function calculateFraudScore({ amount, recentClaimCount, claimTime, location }) {
  let fraudScore = 0;
  const breakdown = {};

  // Rule 1 — high amount
  if (amount > 50000) {
    fraudScore += 30;
    breakdown.highAmount = 30;
  }

  // Rule 2 — rapid repeat claims (> 3 in last 30 days)
  if (recentClaimCount > 3) {
    fraudScore += 25;
    breakdown.rapidRepeat = 25;
  }

  // Rule 3 — unusual hours (12 AM – 5 AM)
  const hour = new Date(claimTime).getHours();
  if (hour >= 0 && hour < 5) {
    fraudScore += 15;
    breakdown.unusualHours = 15;
  }

  // Rule 4 — high-risk zone
  const loc = (location || '').toLowerCase();
  const isHighRisk = HIGH_RISK_ZONES.some((z) => loc.includes(z));
  if (isHighRisk) {
    fraudScore += 20;
    breakdown.highRiskZone = 20;
  }

  // Cap at 100
  fraudScore = Math.min(100, fraudScore);

  return { fraudScore, breakdown };
}

/**
 * resolveClaimStatus
 * Maps fraudScore to the existing Claim model's status enum
 */
function resolveClaimStatus(fraudScore) {
  if (fraudScore <= 40) return 'approved';
  if (fraudScore <= 70) return 'under_review';
  return 'fraud_suspected';
}

module.exports = { calculateFraudScore, resolveClaimStatus };
