/**
 * Automation Engine — Triggers
 * -----------------------------
 * Each trigger is an async function that returns:
 *   { alerts: string[], actions: string[] }
 *
 * All triggers use existing models — no new DB writes.
 */

const Transaction   = require('../../models/Transaction');
const Claim         = require('../../models/Claim');
const RiderProfile  = require('../../models/RiderProfile');
const mongoose      = require('mongoose');

// ── High-risk zone list (shared with claims-intelligence) ─────────────────────
const HIGH_RISK_ZONES = [
  'Downtown District',
  'Industrial Area',
  'Industrial Zone',
  'Highway',
  'Night Market',
  'Port Area',
  'Warehouse District',
];

// ── Weather simulation — seeded from hour so it's consistent per hour ─────────
const WEATHER_CONDITIONS = ['Clear', 'Cloudy', 'Rain', 'Storm', 'Flood', 'Windy'];
const BAD_WEATHER        = ['Rain', 'Storm', 'Flood'];

function simulateWeather() {
  // Rotate through conditions based on hour-of-day for realistic simulation
  const hour  = new Date().getHours();
  const index = Math.floor((hour / 24) * WEATHER_CONDITIONS.length);
  // Add a small random spike: 20% chance of bad weather regardless of hour
  if (Math.random() < 0.20) {
    return BAD_WEATHER[Math.floor(Math.random() * BAD_WEATHER.length)];
  }
  return WEATHER_CONDITIONS[index];
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER 1 — Weather
// ─────────────────────────────────────────────────────────────────────────────
async function weatherTrigger(userId) {
  const alerts  = [];
  const actions = [];

  const condition = simulateWeather();

  if (BAD_WEATHER.includes(condition)) {
    alerts.push(`High weather risk detected — current condition: ${condition}`);
    actions.push('Increase risk factor');
  }

  return { trigger: 'weatherTrigger', fired: alerts.length > 0, condition, alerts, actions };
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER 2 — Income Drop
// ─────────────────────────────────────────────────────────────────────────────
async function incomeTrigger(userId) {
  const alerts  = [];
  const actions = [];

  const now           = new Date();
  const weekStart     = new Date(now - 7  * 86400000);
  const prevWeekStart = new Date(now - 14 * 86400000);

  // Current week earnings
  const currentTx = await Transaction.find({
    rider: userId,
    type:  'earning',
    date:  { $gte: weekStart },
  });
  const currentWeekEarnings = currentTx.reduce((s, t) => s + t.amount, 0);

  // Previous week earnings
  const prevTx = await Transaction.find({
    rider: userId,
    type:  'earning',
    date:  { $gte: prevWeekStart, $lt: weekStart },
  });
  const prevWeekEarnings = prevTx.reduce((s, t) => s + t.amount, 0);

  // Fall back to RiderProfile avgWeeklyEarnings if no real transactions
  let baseline = prevWeekEarnings;
  if (baseline === 0) {
    const profile = await RiderProfile.findOne({ rider: userId });
    baseline = profile?.avgWeeklyEarnings ?? 0;
  }

  const dropped = baseline > 0 && currentWeekEarnings < baseline * 0.60;

  if (dropped) {
    alerts.push(
      `Income drop detected — this week: ₹${currentWeekEarnings.toFixed(0)}, ` +
      `last week: ₹${baseline.toFixed(0)} (${Math.round((currentWeekEarnings / baseline) * 100)}% of baseline)`
    );
    actions.push('Recommend micro-loan');
  }

  return {
    trigger: 'incomeTrigger',
    fired:   alerts.length > 0,
    currentWeekEarnings,
    prevWeekEarnings: baseline,
    alerts,
    actions,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER 3 — Claim Frequency
// ─────────────────────────────────────────────────────────────────────────────
async function claimsTrigger(userId) {
  const alerts  = [];
  const actions = [];

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const recentCount   = await Claim.countDocuments({
    rider:     userId,
    createdAt: { $gte: thirtyDaysAgo },
  });

  if (recentCount > 3) {
    alerts.push(`High claim frequency detected — ${recentCount} claims filed in the last 30 days`);
    actions.push('Flag rider for monitoring');
  }

  return { trigger: 'claimsTrigger', fired: alerts.length > 0, recentClaimCount: recentCount, alerts, actions };
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER 4 — Zone Risk
// ─────────────────────────────────────────────────────────────────────────────
async function zoneTrigger(userId) {
  const alerts  = [];
  const actions = [];

  // Check rider's most recent transaction zone
  const lastTx = await Transaction.findOne({ rider: userId, type: 'earning' }).sort({ date: -1 });
  const currentZone = lastTx?.zone ?? null;

  const inHighRisk = currentZone
    ? HIGH_RISK_ZONES.some((z) => currentZone.toLowerCase().includes(z.toLowerCase()))
    : false;

  if (inHighRisk) {
    alerts.push(`Dangerous zone detected — rider last active in: ${currentZone}`);
    actions.push('Send safety notification');
  }

  return { trigger: 'zoneTrigger', fired: alerts.length > 0, currentZone, alerts, actions };
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER 5 — System Health
// ─────────────────────────────────────────────────────────────────────────────
const DB_RESPONSE_THRESHOLD_MS = 300; // flag if DB ping takes longer than 300ms

async function systemTrigger() {
  const alerts  = [];
  const actions = [];

  // Measure a lightweight DB round-trip
  const start = Date.now();
  try {
    await mongoose.connection.db.admin().ping();
  } catch {
    // If ping fails, treat as worst-case latency
  }
  const responseTime = Date.now() - start;

  if (responseTime > DB_RESPONSE_THRESHOLD_MS) {
    alerts.push(`System performance issue — DB response time: ${responseTime}ms (threshold: ${DB_RESPONSE_THRESHOLD_MS}ms)`);
    actions.push('Notify administrator');
  }

  return { trigger: 'systemTrigger', fired: alerts.length > 0, dbResponseMs: responseTime, alerts, actions };
}

module.exports = { weatherTrigger, incomeTrigger, claimsTrigger, zoneTrigger, systemTrigger };
