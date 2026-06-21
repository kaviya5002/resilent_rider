/**
 * Pricing Engine — Dynamic Premium Calculator
 * ---------------------------------------------
 * Formula:
 *   finalPremium = basePremium × riskFactor × behaviorFactor
 *                × environmentFactor × stabilityFactor
 *
 * All factors are derived from live User + RiderProfile data.
 */

const User        = require('../../models/User');
const RiderProfile = require('../../models/RiderProfile');
const { buildRiderProfile } = require('../../services/learningService');

// ── Factor tables ─────────────────────────────────────────────────────────────

const BASE_PREMIUM = { LOW: 300, MEDIUM: 600, HIGH: 1200 };
const RISK_FACTOR  = { LOW: 0.9, MEDIUM: 1.0, HIGH: 1.2  };

// Behavior factor — derived from earningsTrend
function getBehaviorFactor(earningsTrend) {
  if (earningsTrend === 'rising')  return 0.9;
  if (earningsTrend === 'falling') return 1.1;
  return 1.0; // stable
}

// Environment factor — simulated weather risk seeded from time-of-day
// Cycles: Normal (1.0) most of the time, Rainy (1.1) occasionally, Storm (1.2) rarely
function getEnvironmentFactor() {
  const hour = new Date().getHours();
  // Simulate weather pattern: storms more likely late night, rain in afternoon
  if (hour >= 0 && hour < 4)   return { factor: 1.2, condition: 'Storm'  };
  if (hour >= 13 && hour < 17) return { factor: 1.1, condition: 'Rainy'  };
  return                               { factor: 1.0, condition: 'Normal' };
}

// Stability factor — derived from earningsCV (coefficient of variation)
// CV < 0.2 → high consistency, CV 0.2–0.4 → medium, CV > 0.4 → low
function getStabilityFactor(earningsCV) {
  if (earningsCV < 0.2)  return { factor: 0.9, label: 'High Consistency'   };
  if (earningsCV <= 0.4) return { factor: 1.0, label: 'Medium Consistency' };
  return                        { factor: 1.1, label: 'Low Consistency'    };
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * calculateDynamicPremium
 * @param {string} userId — MongoDB ObjectId string
 * @returns {object} full pricing breakdown
 */
async function calculateDynamicPremium(userId) {
  // 1. Fetch user record
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  // 2. Fetch / build rider profile (upserts latest behavioural data)
  const profile = await buildRiderProfile(userId);

  // 3. Resolve riskLevel — use stored value from registration intelligence,
  //    fall back to deriving from riskScore, then default to MEDIUM
  const riskLevel = user.riskLevel
    || (user.riskScore <= 40 ? 'LOW' : user.riskScore <= 70 ? 'MEDIUM' : 'HIGH')
    || 'MEDIUM';

  // 4. Base premium & risk factor
  const basePremium = BASE_PREMIUM[riskLevel] ?? 600;
  const riskFactor  = RISK_FACTOR[riskLevel]  ?? 1.0;

  // 5. Behavior factor from earnings trend
  const earningsTrend  = profile?.earningsTrend ?? 'stable';
  const behaviorFactor = getBehaviorFactor(earningsTrend);

  // 6. Environment factor (simulated weather)
  const { factor: environmentFactor, condition: weatherCondition } = getEnvironmentFactor();

  // 7. Stability factor from income consistency (earningsCV)
  const earningsCV = profile?.earningsCV ?? 0.3;
  const { factor: stabilityFactor, label: stabilityLabel } = getStabilityFactor(earningsCV);

  // 8. Final premium
  const finalPremium = Math.round(
    basePremium * riskFactor * behaviorFactor * environmentFactor * stabilityFactor
  );

  return {
    userId,
    riskLevel,
    basePremium,
    riskFactor,
    behaviorFactor,
    environmentFactor,
    stabilityFactor,
    finalPremium,
    // ── Context labels for transparency ──────────────────────────────────
    breakdown: {
      riskLevel,
      earningsTrend,
      weatherCondition,
      stabilityLabel,
      earningsCV:        parseFloat(earningsCV.toFixed(3)),
      avgDailyEarnings:  profile?.avgDailyEarnings  ?? 0,
      avgWeeklyEarnings: profile?.avgWeeklyEarnings ?? 0,
      preferredShifts:   profile?.preferredShifts   ?? [],
      topZones:          profile?.topZones           ?? [],
    },
  };
}

module.exports = { calculateDynamicPremium };
