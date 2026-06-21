                                                                                                                                                      const LocationLog = require('./locationModel');

// ── Haversine formula — distance in km between two lat/lng points ─────────────
function haversineKm(lat1, lon1, lat2, lon2) {
  const R    = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_JUMP_KM      = 2;    // max allowed distance jump
const MIN_JUMP_SECS    = 5;    // within this many seconds
const HISTORY_LIMIT    = 100;  // max points returned

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/location/update
// ─────────────────────────────────────────────────────────────────────────────
const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, speed } = req.body;
    const riderId = req.user.id;

    // ── Validation 1: required fields ─────────────────────────────────────
    if (latitude === undefined || latitude === null ||
        longitude === undefined || longitude === null) {
      return res.status(400).json({
        success: false,
        message: 'latitude and longitude are required',
      });
    }

    const lat = Number(latitude);
    const lon = Number(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        success: false,
        message: 'latitude and longitude must be valid numbers',
      });
    }

    if (lat < -90 || lat > 90) {
      return res.status(400).json({ success: false, message: 'latitude must be between -90 and 90' });
    }
    if (lon < -180 || lon > 180) {
      return res.status(400).json({ success: false, message: 'longitude must be between -180 and 180' });
    }

    // ── Validation 2: jump distance check ────────────────────────────────
    // Fetch the most recent point for this rider
    const lastPoint = await LocationLog.findOne({ rider: riderId }).sort({ timestamp: -1 });

    if (lastPoint) {
      const now        = Date.now();
      const lastTime   = new Date(lastPoint.timestamp).getTime();
      const elapsedSec = (now - lastTime) / 1000;

      if (elapsedSec < MIN_JUMP_SECS) {
        const distKm = haversineKm(lastPoint.latitude, lastPoint.longitude, lat, lon);

        if (distKm > MAX_JUMP_KM) {
          console.warn(
            `\n⚠️  [LocationTracking] Jump rejected — Rider: ${riderId} | ` +
            `Distance: ${distKm.toFixed(2)} km in ${elapsedSec.toFixed(1)}s\n`
          );
          return res.status(422).json({
            success: false,
            message: `Suspicious location jump detected: ${distKm.toFixed(2)} km in ${elapsedSec.toFixed(1)}s (max ${MAX_JUMP_KM} km per ${MIN_JUMP_SECS}s)`,
            code:    'JUMP_DETECTED',
          });
        }
      }
    }

    // ── Save location ─────────────────────────────────────────────────────
    const log = await LocationLog.create({
      rider:     riderId,
      latitude:  lat,
      longitude: lon,
      speed:     speed !== undefined ? Math.max(0, Number(speed) || 0) : 0,
      timestamp: new Date(),
    });

    console.log(
      `📍 [LocationTracking] Updated — Rider: ${riderId} | ` +
      `(${lat}, ${lon}) | Speed: ${log.speed} km/h`
    );

    res.status(201).json({
      success: true,
      message: 'Location updated successfully',
      data: {
        id:        log._id,
        latitude:  log.latitude,
        longitude: log.longitude,
        speed:     log.speed,
        timestamp: log.timestamp,
      },
    });
  } catch (error) {
    console.error('[LocationTracking] updateLocation error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/location/latest/:userId  — single most recent point, fast
// ─────────────────────────────────────────────────────────────────────────────
const getLatestLocation = async (req, res) => {
  try {
    const point = await LocationLog
      .findOne({ rider: req.params.userId })
      .sort({ timestamp: -1 })
      .select('latitude longitude speed timestamp -_id')
      .lean();

    if (!point) {
      return res.status(404).json({ success: false, message: 'No location data found' });
    }

    res.status(200).json({ success: true, data: point });
  } catch (error) {
    console.error('[LocationTracking] getLatestLocation error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/location/history/:userId
// ─────────────────────────────────────────────────────────────────────────────
const getLocationHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const history = await LocationLog.find({ rider: userId })
      .sort({ timestamp: -1 })
      .limit(HISTORY_LIMIT)
      .select('latitude longitude speed timestamp -_id');

    console.log(
      `\n📋 [LocationTracking] History fetched — User: ${userId} | Points: ${history.length}\n`
    );

    res.status(200).json({
      success: true,
      count:   history.length,
      data:    history,
    });
  } catch (error) {
    console.error('[LocationTracking] getLocationHistory error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { updateLocation, getLocationHistory, getLatestLocation };
