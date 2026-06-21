const https = require('https');

// ── Constants ──────────────────────────────────────────────────────────────────
const OWM_BASE_URL        = 'https://api.openweathermap.org/data/2.5/weather';
const RAIN_THRESHOLD_MM   = 0.5;   // mm/h — anything above is considered rain
const HEAVY_RAIN_MM       = 7.6;   // mm/h — WMO heavy rain threshold
const EARNINGS_DROP_RATIO = 0.60;  // below 60% of expected = significant drop

// ── Confidence score weights ───────────────────────────────────────────────────
const SCORE = {
  RAIN_PRESENT:    40,
  HEAVY_RAIN:      20,
  EARNINGS_DROP:   30,
  LOCATION_MATCH:  10,
};

// ── Lightweight HTTP GET (no extra dependency) ─────────────────────────────────
function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          reject(new Error('Failed to parse OpenWeatherMap response'));
        }
      });
    }).on('error', reject);
  });
}

// ── getWeatherByCoordinates ────────────────────────────────────────────────────
// Returns: { rain, isHeavyRain, condition, description, temperature, humidity, timestamp }
async function getWeatherByCoordinates(lat, lng) {
  const apiKey = process.env.OPENWEATHER_API_KEY || process.env.WEATHER_API_KEY;
  if (!apiKey || apiKey.includes('your_')) throw new Error('OPENWEATHER_API_KEY is not set in environment variables');

  const url = `${OWM_BASE_URL}?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
  const { status, body } = await httpGet(url);

  if (status === 401) throw new Error('Invalid OpenWeatherMap API key');
  if (status === 429) throw new Error('OpenWeatherMap rate limit exceeded');
  if (status !== 200) throw new Error(`OpenWeatherMap error: ${body.message || status}`);

  // OWM puts rain volume under body.rain['1h'] — may be absent when dry
  const rainMmPerHour = body.rain?.['1h'] ?? 0;

  return {
    rain:        rainMmPerHour,
    isRaining:   rainMmPerHour >= RAIN_THRESHOLD_MM,
    isHeavyRain: rainMmPerHour >= HEAVY_RAIN_MM,
    condition:   body.weather?.[0]?.main        ?? 'Unknown',
    description: body.weather?.[0]?.description ?? 'Unknown',
    temperature: body.main?.temp                ?? null,
    humidity:    body.main?.humidity            ?? null,
    cityName:    body.name                      ?? null,
    timestamp:   new Date(body.dt * 1000).toISOString(),
  };
}

// ── calculateConfidenceScore ───────────────────────────────────────────────────
// Returns { score: 0–100, breakdown: {...}, isValid: bool, reason: string }
function calculateConfidenceScore({ weather, earningsToday, expectedEarnings, locationProvided }) {
  let score = 0;
  const breakdown = {};

  // +40 — rain present
  if (weather.isRaining) {
    score += SCORE.RAIN_PRESENT;
    breakdown.rainPresent = SCORE.RAIN_PRESENT;
  }

  // +20 — heavy rain
  if (weather.isHeavyRain) {
    score += SCORE.HEAVY_RAIN;
    breakdown.heavyRain = SCORE.HEAVY_RAIN;
  }

  // +30 — earnings dropped below 60% of expected
  const earningsRatio = expectedEarnings > 0 ? earningsToday / expectedEarnings : 1;
  const hasEarningsDrop = earningsRatio < EARNINGS_DROP_RATIO;
  if (hasEarningsDrop) {
    score += SCORE.EARNINGS_DROP;
    breakdown.earningsDrop = SCORE.EARNINGS_DROP;
  }

  // +10 — valid coordinates were provided
  if (locationProvided) {
    score += SCORE.LOCATION_MATCH;
    breakdown.locationMatch = SCORE.LOCATION_MATCH;
  }

  score = Math.min(score, 100);

  // Claim is valid when rain is present AND earnings dropped
  const isValid = weather.isRaining && hasEarningsDrop;

  let reason;
  if (isValid)                                    reason = 'Rain + Income Drop';
  else if (!weather.isRaining && hasEarningsDrop) reason = 'No Rain — Earnings Drop Only';
  else if (weather.isRaining && !hasEarningsDrop) reason = 'Rain Present — No Earnings Drop';
  else                                            reason = 'No Rain and No Earnings Drop';

  return { score, breakdown, isValid, reason };
}

module.exports = {
  getWeatherByCoordinates,
  calculateConfidenceScore,
  RAIN_THRESHOLD_MM,
  HEAVY_RAIN_MM,
  EARNINGS_DROP_RATIO,
};
