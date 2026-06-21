/**
 * Registration Intelligence — Risk Engine
 * ----------------------------------------
 * Pure scoring module. No DB, no Express dependencies.
 * Called during signup and via the standalone endpoint.
 *
 * Formula:
 *   riskScore = (ageRisk * 0.15) + (vehicleRisk * 0.25) +
 *               (cityRisk * 0.20) + (hoursRisk * 0.20) +
 *               (accidentRisk * 0.20)
 *
 * All sub-scores are normalised to 0–100.
 */

// ── Sub-score tables ──────────────────────────────────────────────────────────

const VEHICLE_RISK = {
  motorcycle:  85,
  scooter:     70,
  bicycle:     55,
  ebike:       50,
  car:         35,
  van:         40,
};

// City risk based on traffic density / accident statistics
const CITY_RISK = {
  // High-density metros
  mumbai:     88, delhi: 85, bangalore: 80, chennai: 78,
  hyderabad:  75, kolkata: 82, pune: 72, ahmedabad: 70,
  // Mid-tier cities
  jaipur:     60, lucknow: 58, surat: 55, kanpur: 62,
  nagpur:     52, indore: 50, bhopal: 48, patna: 65,
  // Lower-risk cities
  chandigarh: 38, mysore: 35, coimbatore: 40, kochi: 42,
};
const DEFAULT_CITY_RISK = 55; // fallback for unlisted cities

/**
 * ageRisk — younger and older riders carry higher risk
 * Peak safety window: 28–40
 */
function calcAgeRisk(age) {
  const a = Number(age);
  if (!a || a < 16) return 80;
  if (a < 20)       return 75;
  if (a < 25)       return 55;
  if (a < 28)       return 40;
  if (a <= 40)      return 20;   // safest bracket
  if (a <= 50)      return 35;
  if (a <= 60)      return 55;
  return 75;
}

/**
 * vehicleRisk — lookup table, default to mid-range if unknown
 */
function calcVehicleRisk(vehicleType) {
  const key = (vehicleType || '').toLowerCase().trim();
  return VEHICLE_RISK[key] ?? 60;
}

/**
 * cityRisk — lookup table, default if city not listed
 */
function calcCityRisk(city) {
  const key = (city || '').toLowerCase().trim();
  return CITY_RISK[key] ?? DEFAULT_CITY_RISK;
}

/**
 * hoursRisk — based on declared daily working hours
 * More hours = more exposure = higher risk
 */
function calcHoursRisk(dailyHours) {
  const h = Number(dailyHours);
  if (!h || h <= 0) return 50;   // unknown → neutral
  if (h <= 4)       return 20;
  if (h <= 6)       return 35;
  if (h <= 8)       return 50;
  if (h <= 10)      return 65;
  if (h <= 12)      return 78;
  return 90;                     // 12+ hours
}

/**
 * accidentRisk — based on self-reported accident history (count)
 */
function calcAccidentRisk(accidentHistory) {
  const n = Number(accidentHistory);
  if (!n || n <= 0) return 10;
  if (n === 1)      return 40;
  if (n === 2)      return 65;
  if (n === 3)      return 80;
  return 95;                     // 4+
}

// ── Risk level thresholds ─────────────────────────────────────────────────────

function getRiskLevel(score) {
  if (score <= 40) return 'LOW';
  if (score <= 70) return 'MEDIUM';
  return 'HIGH';
}

function getRecommendedPlan(riskLevel) {
  const plans = {
    LOW:    'BasicShield — ₹299/month',
    MEDIUM: 'RiderPlus — ₹599/month',
    HIGH:   'EliteGuard — ₹999/month',
  };
  return plans[riskLevel];
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * calculateRiskProfile
 * @param {object} params
 * @param {number}  params.age
 * @param {string}  params.vehicleType
 * @param {string}  params.city
 * @param {number}  params.dailyHours      — declared working hours per day
 * @param {number}  params.accidentHistory — number of past accidents
 * @returns {{ riskScore, riskLevel, recommendedPlan, breakdown }}
 */
function calculateRiskProfile({ age, vehicleType, city, dailyHours = 0, accidentHistory = 0 }) {
  const ageRisk      = calcAgeRisk(age);
  const vehicleRisk  = calcVehicleRisk(vehicleType);
  const cityRisk     = calcCityRisk(city);
  const hoursRisk    = calcHoursRisk(dailyHours);
  const accidentRisk = calcAccidentRisk(accidentHistory);

  const riskScore = Math.round(
    ageRisk      * 0.15 +
    vehicleRisk  * 0.25 +
    cityRisk     * 0.20 +
    hoursRisk    * 0.20 +
    accidentRisk * 0.20
  );

  const riskLevel       = getRiskLevel(riskScore);
  const recommendedPlan = getRecommendedPlan(riskLevel);

  return {
    riskScore,
    riskLevel,
    recommendedPlan,
    breakdown: { ageRisk, vehicleRisk, cityRisk, hoursRisk, accidentRisk },
  };
}

module.exports = { calculateRiskProfile };
