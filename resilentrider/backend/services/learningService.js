const Transaction  = require('../models/Transaction');
const RiderProfile = require('../models/RiderProfile');

const ZONE_NAMES = [
  'Downtown District',
  'Business Park',
  'Shopping Mall',
  'Airport Zone',
  'University Area',
];

/**
 * buildRiderProfile
 * Analyses last 60 days of earning transactions, derives behavioural
 * signals, upserts RiderProfile, and returns the document so callers
 * can use it immediately without a second DB round-trip.
 */
async function buildRiderProfile(riderId) {
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000);

  const transactions = await Transaction.find({
    rider: riderId,
    type:  'earning',
    date:  { $gte: sixtyDaysAgo },
  }).sort({ date: 1 });

  // ── Working hours ───────────────────────────────────────────────────────
  const hourCounts = Array(24).fill(0);
  transactions.forEach((t) => {
    hourCounts[new Date(t.date).getHours()] += 1;
  });

  const buckets = {
    morning:   hourCounts.slice(6,  12).reduce((a, b) => a + b, 0),
    afternoon: hourCounts.slice(12, 17).reduce((a, b) => a + b, 0),
    evening:   hourCounts.slice(17, 22).reduce((a, b) => a + b, 0),
    night:     [...hourCounts.slice(22), ...hourCounts.slice(0, 6)].reduce((a, b) => a + b, 0),
  };
  const preferredShifts = Object.entries(buckets)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .filter(([, v]) => v > 0)
    .map(([k]) => k);

  // ── Frequent zones ──────────────────────────────────────────────────────
  const zoneCounts = {};
  ZONE_NAMES.forEach((z) => { zoneCounts[z] = 0; });

  transactions.forEach((t) => {
    if (t.zone && ZONE_NAMES.includes(t.zone)) {
      zoneCounts[t.zone] += 1;
    } else {
      // Stable fallback: last hex char of _id mod 5
      const idx = parseInt(t._id.toString().slice(-1), 16) % ZONE_NAMES.length;
      zoneCounts[ZONE_NAMES[idx]] += 1;
    }
  });

  const topZones = Object.entries(zoneCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  // ── Earnings pattern ────────────────────────────────────────────────────
  const dailyMap = {};
  transactions.forEach((t) => {
    const day = new Date(t.date).toISOString().slice(0, 10);
    dailyMap[day] = (dailyMap[day] || 0) + t.amount;
  });
  const dailyValues = Object.values(dailyMap);

  let avgDailyEarnings  = 0;
  let avgWeeklyEarnings = 0;
  let earningsCV        = 0.3;
  let earningsTrend     = 'stable';

  if (dailyValues.length > 0) {
    avgDailyEarnings  = dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length;
    avgWeeklyEarnings = avgDailyEarnings * 7;

    const variance = dailyValues.reduce((s, v) => s + (v - avgDailyEarnings) ** 2, 0) / dailyValues.length;
    earningsCV = avgDailyEarnings > 0 ? Math.sqrt(variance) / avgDailyEarnings : 0.3;

    const mid   = Math.floor(dailyValues.length / 2);
    const first = dailyValues.slice(0, mid).reduce((a, b) => a + b, 0) / (mid || 1);
    const last  = dailyValues.slice(mid).reduce((a, b) => a + b, 0) / ((dailyValues.length - mid) || 1);
    earningsTrend = last > first * 1.08 ? 'rising' : last < first * 0.92 ? 'falling' : 'stable';
  }

  // ── Risk adjustment (-8 to +15) ─────────────────────────────────────────
  const nightRatio     = buckets.night / (transactions.length || 1);
  const consistency    = 1 - Math.min(1, earningsCV);
  const riskAdjustment = parseFloat((nightRatio * 15 - consistency * 8).toFixed(2));

  // ── Premium multiplier (0.85–1.20) ─────────────────────────────────────
  let premiumAdjustment = 1.0;
  if      (earningsTrend === 'rising'  && earningsCV < 0.25) premiumAdjustment = 0.88;
  else if (earningsTrend === 'rising')                       premiumAdjustment = 0.93;
  else if (earningsTrend === 'falling' && nightRatio > 0.3)  premiumAdjustment = 1.18;
  else if (earningsTrend === 'falling')                      premiumAdjustment = 1.10;
  else if (earningsCV < 0.2)                                 premiumAdjustment = 0.92;

  // ── Upsert ──────────────────────────────────────────────────────────────
  const profile = await RiderProfile.findOneAndUpdate(
    { rider: riderId },
    {
      rider: riderId,
      hourCounts,
      preferredShifts,
      zoneCounts,
      topZones,
      avgDailyEarnings:  parseFloat(avgDailyEarnings.toFixed(2)),
      avgWeeklyEarnings: parseFloat(avgWeeklyEarnings.toFixed(2)),
      earningsTrend,
      earningsCV:        parseFloat(earningsCV.toFixed(3)),
      riskAdjustment,
      premiumAdjustment,
      lastUpdated: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return profile;
}

module.exports = { buildRiderProfile };
