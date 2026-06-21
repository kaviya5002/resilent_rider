const { getWeatherByCoordinates, calculateConfidenceScore } = require('./weatherService');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/weather/validate-claim
// ─────────────────────────────────────────────────────────────────────────────
const validateClaim = async (req, res) => {
  try {
    const { userId, latitude, longitude, earningsToday, expectedEarnings } = req.body;

    // ── Input validation ───────────────────────────────────────────────────
    if (!userId || latitude === undefined || longitude === undefined ||
        earningsToday === undefined || expectedEarnings === undefined) {
      return res.status(400).json({
        success: false,
        message: 'userId, latitude, longitude, earningsToday and expectedEarnings are all required',
      });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    const today    = Number(earningsToday);
    const expected = Number(expectedEarnings);

    if (isNaN(lat) || isNaN(lng) || isNaN(today) || isNaN(expected)) {
      return res.status(400).json({ success: false, message: 'latitude, longitude, earningsToday and expectedEarnings must be valid numbers' });
    }
    if (lat < -90 || lat > 90)   return res.status(400).json({ success: false, message: 'latitude must be between -90 and 90' });
    if (lng < -180 || lng > 180) return res.status(400).json({ success: false, message: 'longitude must be between -180 and 180' });
    if (today < 0 || expected < 0) return res.status(400).json({ success: false, message: 'earnings values cannot be negative' });

    // ── Fetch weather ──────────────────────────────────────────────────────
    const weather = await getWeatherByCoordinates(lat, lng);

    // ── Score & validate ───────────────────────────────────────────────────
    const { score, breakdown, isValid, reason } = calculateConfidenceScore({
      weather,
      earningsToday:    today,
      expectedEarnings: expected,
      locationProvided: true,
    });

    console.log(
      `\n🌧  [WeatherIntelligence] Claim validated — User: ${userId} | ` +
      `Valid: ${isValid} | Score: ${score} | Reason: ${reason} | ` +
      `Rain: ${weather.rain}mm/h | Earnings: ${today}/${expected}\n`
    );

    return res.status(200).json({
      success: true,
      data: {
        isValid,
        reason,
        confidenceScore: score,
        scoreBreakdown:  breakdown,
        weather: {
          rain:        weather.rain,
          isRaining:   weather.isRaining,
          isHeavyRain: weather.isHeavyRain,
          condition:   weather.condition,
          description: weather.description,
          temperature: weather.temperature,
          humidity:    weather.humidity,
          cityName:    weather.cityName,
          timestamp:   weather.timestamp,
        },
        earnings: {
          today,
          expected,
          dropPercent: expected > 0
            ? Math.round((1 - today / expected) * 100)
            : 0,
        },
      },
    });

  } catch (error) {
    // Surface API key / rate-limit errors clearly
    const isClientError = error.message.includes('API key') || error.message.includes('rate limit');
    console.error('[WeatherIntelligence] validateClaim error:', error.message);
    return res.status(isClientError ? 502 : 500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { validateClaim };
