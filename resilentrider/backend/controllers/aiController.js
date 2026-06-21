const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { buildRiderProfile } = require('../services/learningService');

// @desc    Get AI risk score for a rider
// @route   GET /api/ai/risk-score
// @access  Private (user)
const getRiskScore = async (req, res) => {
  try {
    const [rider, profile] = await Promise.all([
      User.findById(req.user.id),
      buildRiderProfile(req.user.id),
    ]);
    const j = (range) => (Math.random() - 0.5) * range;

    // ── Time-of-day risk (0–100) ──────────────────────────────────────────
    const hour = new Date().getHours();
    const timeRisk = (() => {
      if (hour >= 0  && hour < 5)  return 80 + j(12);
      if (hour >= 5  && hour < 7)  return 55 + j(10);
      if (hour >= 7  && hour < 9)  return 65 + j(10);
      if (hour >= 9  && hour < 16) return 35 + j(10);
      if (hour >= 16 && hour < 20) return 60 + j(10);
      if (hour >= 20 && hour < 24) return 70 + j(12);
      return 50;
    })();

    // ── Weather severity (0–100) ──────────────────────────────────────────
    const weatherBase  = 30 + Math.abs(Math.sin(Date.now() / 3600000)) * 40;
    const weatherSpike = Math.random() < 0.2 ? 25 : 0;
    const weatherRisk  = Math.min(100, weatherBase + weatherSpike + j(8));

    // ── Traffic density (0–100) ───────────────────────────────────────────
    const isPeak      = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20);
    const trafficBase = isPeak ? 72 : 45;
    const trafficRisk = Math.min(100, Math.max(0, trafficBase + j(14)));

    // ── Area crime index (0–100) ──────────────────────────────────────────
    const idSeed    = parseInt(rider._id.toString().slice(-3), 16) % 50;
    const crimeBase = 30 + idSeed * 0.6;
    const areaRisk  = Math.min(100, Math.max(0, crimeBase + j(10)));

    // ── Accident probability (0–100) ──────────────────────────────────────
    const riderBase    = rider.riskScore || 75;
    const accidentRisk = Math.min(100, Math.max(0, (100 - riderBase) + j(10)));

    // ── Weighted formula ──────────────────────────────────────────────────
    const rawRisk =
      accidentRisk * 0.30 +
      weatherRisk  * 0.20 +
      timeRisk     * 0.20 +
      areaRisk     * 0.15 +
      trafficRisk  * 0.15;

    // ── Learning adjustment: clamp final risk with profile signal ─────────
    // riskAdjustment is -8 (safer daytime rider) to +15 (erratic night rider)
    const adjustedRisk = rawRisk + (profile ? profile.riskAdjustment : 0);
    const overallRisk  = Math.round(Math.min(100, Math.max(0, adjustedRisk)));
    const overallScore = Math.round(100 - overallRisk);

    // ── Recommendation ────────────────────────────────────────────────────
    const recommendations = {
      safe: [
        'Conditions are ideal — great time to maximise your rides.',
        'Low risk detected. Stay consistent and keep up the safe riding.',
        'All signals green. Focus on high-demand zones for best earnings.',
      ],
      moderate: [
        'Moderate risk detected. Reduce speed in congested areas.',
        'Stay alert — traffic density is elevated in your zone.',
        'Consider avoiding the Downtown corridor during peak hours.',
      ],
      high: [
        'High risk conditions. Avoid late-night rides in low-lit areas.',
        'Weather and traffic are both elevated — ride with extra caution.',
        'Consider taking a break until conditions improve.',
      ],
    };
    const tier = overallRisk >= 65 ? 'high' : overallRisk >= 40 ? 'moderate' : 'safe';
    const pool = recommendations[tier];
    const recommendation = pool[Math.floor(Math.random() * pool.length)];

    // ── riskFactors array — shape kept identical for AIRiskPanel.jsx ──────
    // 'Weather Conditions' and 'Traffic Density' labels are read by name in the UI
    const riskFactors = [
      { label: 'Speed Control',      value: Math.round(Math.min(100, overallScore + j(6))) },
      { label: 'Route Safety',       value: Math.round(Math.min(100, overallScore - j(8))) },
      { label: 'Weather Conditions', value: Math.round(100 - weatherRisk) },  // UI reads this
      { label: 'Traffic Density',    value: Math.round(100 - trafficRisk) },  // UI reads this
    ];

    res.status(200).json({
      success: true,
      data: {
        overallScore,                          // kept — admin panel uses this
        overallRisk,                           // new — raw risk value
        riskFactors,                           // kept — admin panel reads by label
        status: overallRisk < 35 ? 'Safe' : overallRisk < 65 ? 'Moderate' : 'High Risk',
        recommendation,
        breakdown: {
          weather:  { score: Math.round(weatherRisk),  label: weatherRisk  >= 65 ? 'Severe'   : weatherRisk  >= 40 ? 'Moderate' : 'Clear'  },
          traffic:  { score: Math.round(trafficRisk),  label: trafficRisk  >= 65 ? 'Heavy'    : trafficRisk  >= 40 ? 'Moderate' : 'Light'  },
          time:     { score: Math.round(timeRisk),     label: timeRisk     >= 65 ? 'High Risk' : timeRisk    >= 40 ? 'Moderate' : 'Low'    },
          area:     { score: Math.round(areaRisk),     label: areaRisk     >= 65 ? 'Dangerous' : areaRisk   >= 40 ? 'Moderate' : 'Safe'   },
          accident: { score: Math.round(accidentRisk), label: accidentRisk >= 65 ? 'High'     : accidentRisk >= 40 ? 'Medium'  : 'Low'    },
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get AI income prediction
// @route   GET /api/ai/income-prediction
// @access  Private (user)
const getIncomePrediction = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transactions = await Transaction.find({
      rider: req.user.id,
      type: 'earning',
      date: { $gte: thirtyDaysAgo },
    }).sort({ date: 1 });

    // ── Build daily earnings array (30 days) ──────────────────────────────
    // Seed a stable base from rider ID so the same rider gets consistent ranges
    const idSeed = parseInt(req.user.id.toString().slice(-4), 16) % 300;
    const BASE_DAILY = 110 + idSeed * 0.4; // ~110–230 range per rider

    const dailyEarnings = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return { date: d, amount: 0, hasReal: false };
    });

    transactions.forEach((t) => {
      const daysAgo = Math.floor((Date.now() - new Date(t.date)) / 86400000);
      const idx = 29 - Math.min(29, daysAgo);
      dailyEarnings[idx].amount += t.amount;
      dailyEarnings[idx].hasReal = true;
    });

    // Fill days with no transactions using realistic mock values
    const jitter = () => (Math.random() - 0.5) * 30; // ±15 daily noise
    dailyEarnings.forEach((d) => {
      if (!d.hasReal) {
        const dow = d.date.getDay(); // 0=Sun, 6=Sat
        const isWeekend = dow === 0 || dow === 6;
        const seasonality = isWeekend ? 1.2 + Math.random() * 0.1 : 1.0;

        // Weather: ~25% chance of rain on any day, rain cuts earnings 15–30%
        const rainDay = Math.random() < 0.25;
        const weatherMult = rainDay ? 0.75 + Math.random() * 0.1 : 1.0;

        // Traffic: peak-hour bonus baked into daily total (~20% of days are high-congestion)
        const trafficBonus = Math.random() < 0.2 ? BASE_DAILY * 0.15 : 0;

        d.amount = parseFloat(
          Math.max(40, BASE_DAILY * seasonality * weatherMult + trafficBonus + jitter()).toFixed(2)
        );
      }
    });

    // ── Weighted Moving Average (recent days weighted higher) ─────────────
    // Weights: oldest day = 1, newest day = 30
    const wmaWindow = 14; // last 14 days for WMA
    const recentDays = dailyEarnings.slice(-wmaWindow);
    let weightSum = 0, weightedTotal = 0;
    recentDays.forEach((d, i) => {
      const w = i + 1;
      weightedTotal += d.amount * w;
      weightSum += w;
    });
    const wmaDailyAvg = weightedTotal / weightSum;

    // ── Aggregate into 4 weekly buckets ───────────────────────────────────
    const weeklyTotals = [0, 0, 0, 0];
    dailyEarnings.forEach((d, i) => {
      weeklyTotals[Math.floor(i / 7)] += d.amount;
    });
    const weeklyHistory = weeklyTotals.map((w) => parseFloat(w.toFixed(2)));

    // ── Factor calculations ───────────────────────────────────────────────
    // Weather impact: average rain reduction across last 7 days
    const last7 = dailyEarnings.slice(-7);
    const avgLast7 = last7.reduce((s, d) => s + d.amount, 0) / 7;
    const avgPrev7 = dailyEarnings.slice(-14, -7).reduce((s, d) => s + d.amount, 0) / 7;
    const weatherImpact = parseFloat((((avgLast7 - avgPrev7) / avgPrev7) * 100).toFixed(1));

    // Traffic impact: weekend vs weekday ratio in last 14 days
    const weekendDays = recentDays.filter((d) => [0, 6].includes(d.date.getDay()));
    const weekdayDays = recentDays.filter((d) => ![0, 6].includes(d.date.getDay()));
    const avgWeekend = weekendDays.length ? weekendDays.reduce((s, d) => s + d.amount, 0) / weekendDays.length : wmaDailyAvg;
    const avgWeekday = weekdayDays.length ? weekdayDays.reduce((s, d) => s + d.amount, 0) / weekdayDays.length : wmaDailyAvg;
    const trafficImpact = parseFloat((((avgWeekend - avgWeekday) / avgWeekday) * 100).toFixed(1));

    // Demand trend: slope of last 14 days (linear regression)
    const n = recentDays.length;
    const xMean = (n - 1) / 2;
    const yMean = recentDays.reduce((s, d) => s + d.amount, 0) / n;
    let num = 0, den = 0;
    recentDays.forEach((d, i) => { num += (i - xMean) * (d.amount - yMean); den += (i - xMean) ** 2; });
    const slope = den !== 0 ? num / den : 0;
    const demandTrend = parseFloat((slope * 7).toFixed(2)); // weekly trend delta

    // ── Prediction ────────────────────────────────────────────────────────
    // Next week = WMA daily avg × 7 + demand trend + small live jitter
    const liveNoise = (Math.random() - 0.5) * 20;
    const predictedNextWeek = parseFloat(
      Math.max(200, wmaDailyAvg * 7 + demandTrend + liveNoise).toFixed(2)
    );
    const currentWeek = weeklyHistory[3];

    // ── Confidence: higher when variance is low and data is plentiful ─────
    const variance = recentDays.reduce((s, d) => s + (d.amount - wmaDailyAvg) ** 2, 0) / n;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / wmaDailyAvg; // coefficient of variation
    const dataBonus = Math.min(10, transactions.length); // up to +10 for real data
    const confidence = Math.min(95, Math.max(70, Math.round(92 - cv * 40 + dataBonus * 0.5)));

    const growthRate = (((predictedNextWeek - currentWeek) / (currentWeek || 1)) * 100).toFixed(1);

    // ── Factor labels with dynamic impact levels ──────────────────────────
    const impactLevel = (val) => (Math.abs(val) > 10 ? 'High' : Math.abs(val) > 4 ? 'Medium' : 'Low');
    const trendLabel = demandTrend >= 0 ? 'Upward' : 'Downward';

    const factors = [
      { label: 'Historical Performance', impact: confidence >= 85 ? 'High' : 'Medium' },
      { label: `Weather Forecast (${weatherImpact >= 0 ? '+' : ''}${weatherImpact}%)`, impact: impactLevel(weatherImpact) },
      { label: `Traffic Patterns (${trafficImpact >= 0 ? '+' : ''}${trafficImpact}%)`, impact: impactLevel(trafficImpact) },
      { label: `Seasonal Trend (${trendLabel})`, impact: impactLevel(demandTrend) },
    ];

    // ── Dynamic insights ──────────────────────────────────────────────────
    const hour = new Date().getHours();
    const peakHint = hour < 12 ? '6–9 PM this evening' : hour < 17 ? '5–8 PM today' : 'tomorrow morning 7–9 AM';
    const zoneHint = demandTrend > 0 ? 'Downtown, Business District' : 'Airport Zone, Shopping Mall';

    const insights = [
      `Peak earning window predicted: ${peakHint}`,
      `Recommended high-demand zones: ${zoneHint}`,
    ];

    res.status(200).json({
      success: true,
      data: {
        weeklyHistory,
        currentWeek,
        predictedNextWeek,
        confidence,
        growthRate,
        factors,
        insights,
        _meta: {
          weatherImpact,
          trafficImpact,
          demandTrend,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get smart zone relocation suggestions
// @route   GET /api/ai/zone-suggestions
// @access  Private (user)
const getZoneSuggestions = async (req, res) => {
  try {
    // Simulated demand-based zone suggestions
    const zones = [
      { area: 'Downtown District', demand: 'High', distance: '2.3 km', earningsBoost: '+$45/hr', demandScore: 92 },
      { area: 'Business Park', demand: 'Medium', distance: '4.1 km', earningsBoost: '+$32/hr', demandScore: 74 },
      { area: 'Shopping Mall', demand: 'Medium', distance: '3.5 km', earningsBoost: '+$28/hr', demandScore: 68 },
      { area: 'Airport Zone', demand: 'High', distance: '6.2 km', earningsBoost: '+$52/hr', demandScore: 88 },
      { area: 'University Area', demand: 'Low', distance: '1.8 km', earningsBoost: '+$18/hr', demandScore: 45 },
    ];

    // Sort by demand score
    zones.sort((a, b) => b.demandScore - a.demandScore);

    res.status(200).json({ success: true, data: zones.slice(0, 3) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get smart relocation suggestions based on context
// @route   POST /api/ai/relocation
// @access  Private
const getRelocationSuggestions = async (req, res) => {
  try {
    const { time, weather } = req.body;

    // ── Load learned profile in parallel ─────────────────────────────────
    const profile = await buildRiderProfile(req.user.id);

    // ── Context signals ───────────────────────────────────────────────────
    const hour      = time ? new Date(time).getHours() : new Date().getHours();
    const dow       = new Date().getDay();
    const isPeak    = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20);
    const isWeekend = dow === 0 || dow === 6;
    const isMorning = hour >= 6 && hour < 12;
    const isEvening = hour >= 17 && hour < 22;

    // Normalised weather penalty (0–100): higher = worse conditions
    const BAD_WEATHER = ['rain', 'storm', 'fog', 'snow'];
    const weatherStr  = (weather || 'clear').toLowerCase();
    const weatherPenalty = BAD_WEATHER.includes(weatherStr)
      ? 55 + Math.random() * 30   // 55–85 on bad weather
      : 10 + Math.random() * 20;  // 10–30 on clear weather

    // ── Zone templates ────────────────────────────────────────────────────
    // baseDemand / baseDistance / baseTraffic are 0–100 normalised signals
    // baseEarnings is $/hr used to compute expectedEarningsBoost
    const r = () => (Math.random() - 0.5) * 10; // ±5 live jitter per field

    const templates = [
      {
        zoneName:    'Downtown District',
        baseDemand:  isPeak ? 90 : 75,
        baseDistKm:  2.3 + (Math.random() - 0.5) * 0.4,
        baseTraffic: isPeak ? 80 : 55,
        baseEarnings: 45,
      },
      {
        zoneName:    'Business Park',
        baseDemand:  isPeak && !isWeekend ? 82 : 58,
        baseDistKm:  4.1 + (Math.random() - 0.5) * 0.6,
        baseTraffic: isPeak ? 72 : 45,
        baseEarnings: 32,
      },
      {
        zoneName:    'Shopping Mall',
        baseDemand:  isWeekend ? 78 : 60,
        baseDistKm:  3.5 + (Math.random() - 0.5) * 0.5,
        baseTraffic: isWeekend ? 70 : 50,
        baseEarnings: 28,
      },
      {
        zoneName:    'Airport Zone',
        baseDemand:  isMorning || isEvening ? 88 : 70,
        baseDistKm:  6.2 + (Math.random() - 0.5) * 0.8,
        baseTraffic: 60,
        baseEarnings: 52,
      },
      {
        zoneName:    'University Area',
        baseDemand:  !isWeekend && hour >= 8 && hour <= 18 ? 65 : 38,
        baseDistKm:  1.8 + (Math.random() - 0.5) * 0.3,
        baseTraffic: 40,
        baseEarnings: 18,
      },
    ];

    // ── Score each zone ───────────────────────────────────────────────────
    // score = (demand*0.5) + (distancePenalty*-0.2) + (weather*-0.1) + (traffic*-0.2)
    // + personalBonus: +8 if zone is in rider's top-3 frequent zones
    const topZones = profile ? profile.topZones : [];

    const scored = templates.map((z) => {
      const demand          = Math.min(100, Math.max(0, z.baseDemand + r()));
      const distKm          = parseFloat(Math.max(0.5, z.baseDistKm).toFixed(1));
      const distancePenalty = Math.min(100, (distKm / 10) * 100);
      const traffic         = Math.min(100, Math.max(0, z.baseTraffic + r()));
      const weather         = weatherPenalty;

      // Personal familiarity bonus — rider knows this zone, earns more efficiently
      const personalBonus = topZones.includes(z.zoneName) ? 8 : 0;

      const score = parseFloat(
        ((demand * 0.5) + (distancePenalty * -0.2) + (weather * -0.1) + (traffic * -0.2) + personalBonus).toFixed(2)
      );

      const earningsVariance = Math.round((Math.random() - 0.5) * 6);
      const earningsVal      = Math.max(5, z.baseEarnings + earningsVariance);
      const demandLevel      = demand >= 70 ? 'High' : demand >= 50 ? 'Medium' : 'Low';

      return {
        zoneName:              z.zoneName,
        demandLevel,
        demand:                demandLevel,
        distance:              `${distKm} km`,
        expectedEarningsBoost: `+$${earningsVal}/hr`,
        score,
        personalized:          topZones.includes(z.zoneName),
      };
    });

    scored.sort((a, b) => b.score - a.score);

    res.status(200).json({ success: true, data: scored });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get demand forecast data
// @route   GET /api/ai/demand-forecast
// @access  Private
const getDemandForecast = async (req, res) => {
  try {
    const now     = new Date();
    const hour    = now.getHours();
    const dow     = now.getDay();          // 0=Sun, 6=Sat
    const isWeekend = dow === 0 || dow === 6;
    const j = (n) => (Math.random() - 0.5) * n;

    // ── Past demand trend: pull last 7 days of earning transactions ────────
    const sevenDaysAgo = new Date(now - 7 * 86400000);
    const recentTx = await Transaction.find({
      type: 'earning',
      date: { $gte: sevenDaysAgo },
    });

    // Daily totals → normalise to 0–100 demand index
    const dailyTotals = Array(7).fill(0);
    recentTx.forEach((t) => {
      const daysAgo = Math.floor((now - new Date(t.date)) / 86400000);
      const idx = Math.min(6, daysAgo);
      dailyTotals[6 - idx] += t.amount;
    });
    const maxDaily = Math.max(...dailyTotals, 1);
    const trendIndex = dailyTotals.map((v) => Math.round((v / maxDaily) * 100));
    // If no real data, use a realistic synthetic trend
    const hasTrend = recentTx.length > 0;
    const baseTrend = hasTrend
      ? trendIndex.reduce((a, b) => a + b, 0) / 7
      : 60 + j(10);

    // ── Weather factor (0–100 penalty, same sine-wave as risk score) ──────
    const weatherPenalty = Math.min(40, Math.abs(Math.sin(Date.now() / 3600000)) * 35 + j(5));

    // ── Hour-of-day demand curve (0–100) ──────────────────────────────
    const hourCurve = [
      18, 12, 10, 8, 10, 20,   // 0–5 AM
      38, 62, 75, 65, 55, 58,  // 6–11 AM
      70, 65, 60, 62, 72, 85,  // 12–5 PM
      92, 88, 78, 65, 50, 30,  // 6–11 PM
    ];

    // ── Next-6-hour hourly forecast ───────────────────────────────────
    const hourly = Array.from({ length: 6 }, (_, i) => {
      const h          = (hour + i) % 24;
      const isPeak     = (h >= 7 && h <= 9) || (h >= 17 && h <= 20);
      const weekendMult = isWeekend ? 1.15 : 1.0;
      const trendMult  = 0.7 + (baseTrend / 100) * 0.6;  // 0.7–1.3

      const rawDemand  = hourCurve[h] * weekendMult * trendMult - weatherPenalty * 0.4;
      const demandVal  = Math.min(100, Math.max(5, Math.round(rawDemand + j(8))));

      // Expected orders: peak ~25–40, off-peak ~5–15
      const baseOrders  = isPeak ? 28 + Math.random() * 14 : 8 + Math.random() * 10;
      const expectedOrders = Math.round(baseOrders * weekendMult * trendMult);

      const demandLevel = demandVal >= 70 ? 'High' : demandVal >= 45 ? 'Medium' : 'Low';
      const label = `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? 'AM' : 'PM'}`;

      return { hour: h, label, demandLevel, demandValue: demandVal, expectedOrders };
    });

    // ── Weekly chart arrays (kept for AIRiskPanel.jsx) ────────────────────
    const labels   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const isPeak   = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20);
    const weekBase = isPeak ? 78 : 62;
    const forecast = labels.map((_, i) => {
      const isWknd = i >= 5;
      const trendBoost = hasTrend ? (trendIndex[i] - 50) * 0.2 : 0;
      return Math.min(100, Math.max(20, Math.round(
        weekBase * (isWknd ? 1.18 : 1) - weatherPenalty * 0.3 + trendBoost + j(10)
      )));
    });
    const level = Math.round(forecast.reduce((a, b) => a + b, 0) / forecast.length);

    res.status(200).json({
      success: true,
      data: {
        // ─ existing fields kept for AIRiskPanel.jsx ─
        current:  level >= 78 ? 'High' : level >= 55 ? 'Medium' : 'Low',
        level,
        forecast,
        labels,
        // ─ new hourly forecast ─
        hourly,
        weatherPenalty: Math.round(weatherPenalty),
        isWeekend,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get risk heatmap data
// @route   GET /api/ai/heatmap
// @access  Private
const getHeatmapData = async (req, res) => {
  try {
    const zones = [
      { id: 1, name: 'Downtown', risk: 85, x: 30, y: 40 },
      { id: 2, name: 'Business District', risk: 72, x: 60, y: 30 },
      { id: 3, name: 'Residential North', risk: 45, x: 20, y: 20 },
      { id: 4, name: 'Shopping Mall', risk: 68, x: 70, y: 60 },
      { id: 5, name: 'Industrial Area', risk: 55, x: 40, y: 70 },
      { id: 6, name: 'Suburbs East', risk: 38, x: 80, y: 50 },
      { id: 7, name: 'Airport Zone', risk: 78, x: 50, y: 15 },
      { id: 8, name: 'University Area', risk: 62, x: 15, y: 65 },
    ];

    const timeSlots = [
      { time: '6-9 AM', risk: 65 },
      { time: '9-12 PM', risk: 45 },
      { time: '12-3 PM', risk: 72 },
      { time: '3-6 PM', risk: 58 },
      { time: '6-9 PM', risk: 82 },
      { time: '9-12 AM', risk: 48 },
    ];

    res.status(200).json({ success: true, data: { zones, timeSlots } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    AI decision brain — combines all signals into one summary
// @route   GET /api/ai/summary
// @access  Private
const getAISummary = async (req, res) => {
  try {
    const now  = new Date();
    const hour = now.getHours();
    const dow  = now.getDay();
    const j    = (n) => (Math.random() - 0.5) * n;

    // ── Load rider + learned profile in parallel ──────────────────────────
    const [rider, profile] = await Promise.all([
      User.findById(req.user.id),
      buildRiderProfile(req.user.id),
    ]);

    // ── 1. Risk score (reuse same formula as getRiskScore) ────────────────
    const isPeak      = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20);
    const timeRisk    = hour < 5 ? 80 + j(12) : hour < 7 ? 55 + j(10) : hour < 9 ? 65 + j(10) :
                        hour < 16 ? 35 + j(10) : hour < 20 ? 60 + j(10) : 70 + j(12);
    const weatherRisk = Math.min(100, 30 + Math.abs(Math.sin(Date.now() / 3600000)) * 40 +
                        (Math.random() < 0.2 ? 25 : 0) + j(8));
    const trafficRisk = Math.min(100, Math.max(0, (isPeak ? 72 : 45) + j(14)));
    const idSeed      = parseInt(rider._id.toString().slice(-3), 16) % 50;
    const areaRisk    = Math.min(100, Math.max(0, 30 + idSeed * 0.6 + j(10)));
    const accidentRisk = Math.min(100, Math.max(0, (100 - (rider.riskScore || 75)) + j(10)));
    const rawRisk     = accidentRisk * 0.30 + weatherRisk * 0.20 + timeRisk * 0.20 +
                        areaRisk * 0.15 + trafficRisk * 0.15;
    const overallRisk = Math.round(Math.min(100, Math.max(0,
      rawRisk + (profile ? profile.riskAdjustment : 0)
    )));
    const riskLevel   = overallRisk < 35 ? 'Low' : overallRisk < 65 ? 'Moderate' : 'High';

    // ── 2. Income prediction (WMA from last 30 days) ──────────────────────
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const transactions  = await Transaction.find({
      rider: req.user.id, type: 'earning', date: { $gte: thirtyDaysAgo },
    }).sort({ date: 1 });

    const idSeed4      = parseInt(req.user.id.toString().slice(-4), 16) % 300;
    const BASE_DAILY   = 110 + idSeed4 * 0.4;
    const dailyArr     = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (29 - i));
      return { date: d, amount: 0 };
    });
    transactions.forEach((t) => {
      const idx = 29 - Math.min(29, Math.floor((Date.now() - new Date(t.date)) / 86400000));
      dailyArr[idx].amount += t.amount;
    });
    dailyArr.forEach((d) => {
      if (d.amount === 0) {
        const isWknd = [0, 6].includes(d.date.getDay());
        d.amount = Math.max(40, BASE_DAILY * (isWknd ? 1.2 : 1.0) *
          (Math.random() < 0.25 ? 0.78 : 1.0) + j(15));
      }
    });
    const recent14 = dailyArr.slice(-14);
    let wSum = 0, wTotal = 0;
    recent14.forEach((d, i) => { const w = i + 1; wTotal += d.amount * w; wSum += w; });
    const wmaDailyAvg      = wTotal / wSum;
    const predictedWeekly  = parseFloat(Math.max(200, wmaDailyAvg * 7 + j(20)).toFixed(2));
    const currentWeekTotal = dailyArr.slice(-7).reduce((s, d) => s + d.amount, 0);

    // ── 3. Best zone (from relocation scoring) ────────────────────────────
    const isWeekend  = dow === 0 || dow === 6;
    const isMorning  = hour >= 6 && hour < 12;
    const isEvening  = hour >= 17 && hour < 22;
    const wPenalty   = Math.min(30, Math.abs(Math.sin(Date.now() / 3600000)) * 25 + j(5));
    const topZones   = profile ? profile.topZones : [];
    const r          = () => j(10);

    const zoneTemplates = [
      { zoneName: 'Downtown District', baseDemand: isPeak ? 90 : 75, baseDistKm: 2.3, baseTraffic: isPeak ? 80 : 55, baseEarnings: 45 },
      { zoneName: 'Business Park',     baseDemand: isPeak && !isWeekend ? 82 : 58, baseDistKm: 4.1, baseTraffic: isPeak ? 72 : 45, baseEarnings: 32 },
      { zoneName: 'Shopping Mall',     baseDemand: isWeekend ? 78 : 60, baseDistKm: 3.5, baseTraffic: isWeekend ? 70 : 50, baseEarnings: 28 },
      { zoneName: 'Airport Zone',      baseDemand: isMorning || isEvening ? 88 : 70, baseDistKm: 6.2, baseTraffic: 60, baseEarnings: 52 },
      { zoneName: 'University Area',   baseDemand: !isWeekend && hour >= 8 && hour <= 18 ? 65 : 38, baseDistKm: 1.8, baseTraffic: 40, baseEarnings: 18 },
    ];
    const scoredZones = zoneTemplates.map((z) => {
      const demand   = Math.min(100, Math.max(0, z.baseDemand + r()));
      const distKm   = parseFloat(Math.max(0.5, z.baseDistKm + j(0.4)).toFixed(1));
      const distPen  = Math.min(100, (distKm / 10) * 100);
      const traffic  = Math.min(100, Math.max(0, z.baseTraffic + r()));
      const personal = topZones.includes(z.zoneName) ? 8 : 0;
      const score    = (demand * 0.5) + (distPen * -0.2) + (wPenalty * -0.1) + (traffic * -0.2) + personal;
      return { zoneName: z.zoneName, score, baseEarnings: z.baseEarnings };
    });
    scoredZones.sort((a, b) => b.score - a.score);
    const bestZone = scoredZones[0];

    // ── 4. Demand level right now ─────────────────────────────────────────
    const hourCurve = [18,12,10,8,10,20,38,62,75,65,55,58,70,65,60,62,72,85,92,88,78,65,50,30];
    const demandNow = Math.min(100, Math.max(5, Math.round(
      hourCurve[hour] * (isWeekend ? 1.15 : 1.0) - wPenalty * 0.4 + j(8)
    )));
    const demandLevel = demandNow >= 70 ? 'High' : demandNow >= 45 ? 'Medium' : 'Low';

    // ── 5. Alerts ─────────────────────────────────────────────────────────
    const alerts = [];

    if (overallRisk >= 65)
      alerts.push({ type: 'risk',   priority: 'high',   message: `High risk detected (${overallRisk}/100) — ride with extra caution.` });
    else if (overallRisk >= 40)
      alerts.push({ type: 'risk',   priority: 'medium', message: `Moderate risk (${overallRisk}/100) — stay alert in congested areas.` });

    if (demandNow >= 75)
      alerts.push({ type: 'demand', priority: 'high',   message: `High demand right now near ${bestZone.zoneName} — great time to ride!` });

    if (profile && profile.earningsTrend === 'falling')
      alerts.push({ type: 'earnings', priority: 'medium', message: 'Your earnings have been declining. Consider shifting to peak hours.' });

    if (profile && profile.earningsTrend === 'rising')
      alerts.push({ type: 'earnings', priority: 'low',    message: 'Earnings trending up — keep up the momentum!' });

    if (weatherRisk >= 65)
      alerts.push({ type: 'weather', priority: 'high',   message: 'Severe weather conditions detected. Reduce speed and stay safe.' });

    if (isPeak)
      alerts.push({ type: 'demand', priority: 'low',    message: `Peak hour active — ${bestZone.zoneName} is your best zone right now.` });

    // ── 6. Best action string ─────────────────────────────────────────────
    let bestAction;
    if (overallRisk >= 65 && demandNow < 50)
      bestAction = 'Take a break — risk is high and demand is low.';
    else if (demandNow >= 75 && overallRisk < 50)
      bestAction = `Head to ${bestZone.zoneName} now — high demand, low risk.`;
    else if (profile && profile.earningsTrend === 'falling')
      bestAction = `Shift to ${bestZone.zoneName} during ${profile.preferredShifts[0] || 'evening'} hours to recover earnings.`;
    else if (isPeak)
      bestAction = `Stay active — peak hour in progress. ${bestZone.zoneName} has the best score.`;
    else
      bestAction = `Position near ${bestZone.zoneName} for the next demand surge.`;

    res.status(200).json({
      success: true,
      data: {
        bestAction,
        expectedEarnings: {
          thisWeek:  parseFloat(currentWeekTotal.toFixed(2)),
          nextWeek:  predictedWeekly,
          daily:     parseFloat(wmaDailyAvg.toFixed(2)),
        },
        riskLevel,
        overallRisk,
        recommendedZone: {
          name:          bestZone.zoneName,
          score:         parseFloat(bestZone.score.toFixed(2)),
          personalized:  topZones.includes(bestZone.zoneName),
          earningsBoost: `+$${bestZone.baseEarnings}/hr`,
        },
        demandNow: { level: demandLevel, value: demandNow },
        alerts,
        profile: profile ? {
          preferredShifts:  profile.preferredShifts,
          topZones:         profile.topZones,
          earningsTrend:    profile.earningsTrend,
          premiumAdjustment: profile.premiumAdjustment,
        } : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getRiskScore, getIncomePrediction, getZoneSuggestions, getHeatmapData, getRelocationSuggestions, getDemandForecast, getAISummary };
