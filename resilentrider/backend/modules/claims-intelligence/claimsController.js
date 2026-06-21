const Claim        = require('../../models/Claim');
const InsurancePlan = require('../../models/InsurancePlan');
const { calculateFraudScore, resolveClaimStatus } = require('./fraudScorer');
const { getWeatherByCoordinates, calculateConfidenceScore } = require('../weather-intelligence/weatherService');
const { resolveAutoDecision, processPayout } = require('./payoutService');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Fetch the rider's active insurance plan id.
 * Falls back to a dummy ObjectId so the required field is always satisfied
 * even when no plan exists yet (allows testing without a plan).
 */
async function resolveInsurancePlan(riderId) {
  const plan = await InsurancePlan.findOne({ rider: riderId, status: 'active' });
  if (plan) return plan._id;

  // Create a minimal placeholder plan so the required ref is satisfied
  const mongoose = require('mongoose');
  return new mongoose.Types.ObjectId(); // non-persisted placeholder
}

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * @desc  Submit a new claim with automated fraud detection
 * @route POST /api/claims/submit
 * @access Private
 */
const submitClaim = async (req, res) => {
  try {
    const riderId = req.user.id;
    const {
      claimType,
      amount,
      location,
      description,
      incidentDate,
    } = req.body;

    // ── Validation ────────────────────────────────────────────────────────
    if (!claimType || !amount) {
      return res.status(400).json({ success: false, message: 'claimType and amount are required' });
    }

    const VALID_TYPES = ['accident', 'medical', 'vehicle_damage', 'theft', 'emergency'];
    if (!VALID_TYPES.includes(claimType)) {
      return res.status(400).json({
        success: false,
        message: `claimType must be one of: ${VALID_TYPES.join(', ')}`,
      });
    }

    // ── Step 1: Check claim history (last 30 days) ────────────────────────
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const recentClaimCount = await Claim.countDocuments({
      rider: riderId,
      createdAt: { $gte: thirtyDaysAgo },
    });

    // ── Step 2: Calculate fraud score ─────────────────────────────────────
    const claimTime = new Date();
    const { fraudScore, breakdown } = calculateFraudScore({
      amount:           Number(amount),
      recentClaimCount,
      claimTime,
      location:         location || '',
    });

    console.log('\n🔍 [ClaimsIntelligence] Fraud score calculated');
    console.log('─────────────────────────────────────────────────────');
    console.log(`  Rider ID         : ${riderId}`);
    console.log(`  Claim Type       : ${claimType}`);
    console.log(`  Amount           : ₹${amount}`);
    console.log(`  Location         : ${location || 'N/A'}`);
    console.log(`  Recent Claims    : ${recentClaimCount} (last 30 days)`);
    console.log(`  Claim Hour       : ${claimTime.getHours()}:00`);
    console.log('  ── Score Breakdown ────────────────────────────────');
    if (breakdown.highAmount)   console.log(`  High Amount      : +${breakdown.highAmount}`);
    if (breakdown.rapidRepeat)  console.log(`  Rapid Repeat     : +${breakdown.rapidRepeat}`);
    if (breakdown.unusualHours) console.log(`  Unusual Hours    : +${breakdown.unusualHours}`);
    if (breakdown.highRiskZone) console.log(`  High-Risk Zone   : +${breakdown.highRiskZone}`);
    console.log(`  Fraud Score      : ${fraudScore}`);
    console.log('─────────────────────────────────────────────────────\n');

    // ── Step 3: Determine fraud-based status ─────────────────────────────
    const fraudStatus = resolveClaimStatus(fraudScore);

    // ── Step 4: Resolve insurance plan reference ──────────────────────────
    const insurancePlanId = await resolveInsurancePlan(riderId);

    // ── Step 5: Weather validation (non-blocking — falls back gracefully) ─
    let weatherConfidenceScore = null;
    let weatherValidationReason = null;
    let autoDecisionStatus = fraudStatus;
    let payoutStatus = 'pending';

    if (location) {
      try {
        const [lat, lng] = location.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          const weather = await getWeatherByCoordinates(lat, lng);
          const earningsToday    = Number(req.body.earningsToday)    || 0;
          const expectedEarnings = Number(req.body.expectedEarnings) || 0;

          const { score, reason } = calculateConfidenceScore({
            weather,
            earningsToday,
            expectedEarnings,
            locationProvided: true,
          });

          weatherConfidenceScore  = score;
          weatherValidationReason = reason;

          // Weather decision overrides fraud status only when fraud is clean
          if (fraudStatus !== 'fraud_suspected') {
            const decision = resolveAutoDecision(score);
            autoDecisionStatus = decision.status;
            payoutStatus       = decision.payoutStatus;
          }

          console.log(
            `\n🌧  [ClaimsIntelligence] Weather validation — Score: ${score} | ` +
            `Reason: ${reason} | Auto Decision: ${autoDecisionStatus}\n`
          );
        }
      } catch (weatherErr) {
        // Weather API failure must never block claim submission
        console.warn('[ClaimsIntelligence] Weather validation skipped:', weatherErr.message);
      }
    }

    // ── Step 6: Save claim ────────────────────────────────────────────────
    const claim = await Claim.create({
      rider:                  riderId,
      insurancePlan:          insurancePlanId,
      claimType,
      amount:                 Number(amount),
      description:            description || `${claimType} claim submitted via claims intelligence module`,
      status:                 autoDecisionStatus,
      fraudScore,
      weatherConfidenceScore,
      weatherValidationReason,
      payoutStatus,
      incidentDate:           incidentDate ? new Date(incidentDate) : claimTime,
      incidentLocation:       location || '',
    });

    // ── Step 7: Trigger payout if approved ────────────────────────────────
    let payoutResult = null;
    if (autoDecisionStatus === 'approved') {
      try {
        payoutResult = await processPayout({
          riderId,
          claimId: claim._id,
          claimedAmount: claim.amount,
        });
        // Mark payout completed on the claim
        await Claim.findByIdAndUpdate(claim._id, {
          $set: {
            payoutStatus:   'completed',
            approvedAmount: payoutResult.approvedAmount,
            paidAt:         new Date(),
          },
        });
      } catch (payoutErr) {
        console.error('[ClaimsIntelligence] Payout failed:', payoutErr.message);
      }
    }

    console.log('✅ [ClaimsIntelligence] Claim submitted successfully');
    console.log(`   Claim ID : ${claim._id} | Status : ${autoDecisionStatus} | Fraud Score : ${fraudScore}\n`);

    return res.status(201).json({
      success: true,
      message: 'Claim submitted successfully',
      data: {
        claimId:                claim._id,
        claimType:              claim.claimType,
        amount:                 claim.amount,
        fraudScore:             claim.fraudScore,
        status:                 autoDecisionStatus,
        payout:                 autoDecisionStatus === 'approved' ? 'initiated' : 'not_applicable',
        approvedAmount:         payoutResult?.approvedAmount ?? 0,
        payoutStatus:           autoDecisionStatus === 'approved' ? 'completed' : 'not_applicable',
        weatherConfidenceScore,
        weatherValidationReason,
        location:               claim.incidentLocation,
        time:                   claim.incidentDate,
        createdAt:              claim.createdAt,
        breakdown,
        ...(payoutResult && { transactionId: payoutResult.transactionId }),
      },
    });
  } catch (error) {
    console.error('[ClaimsIntelligence] submitClaim error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc  Get all claims for a specific user
 * @route GET /api/claims/user/:userId
 * @access Private
 */
const getUserClaims = async (req, res) => {
  try {
    const { userId } = req.params;

    const claims = await Claim.find({ rider: userId })
      .populate('insurancePlan', 'planName coverageAmount')
      .sort({ createdAt: -1 });

    console.log(`\n📋 [ClaimsIntelligence] Claims retrieved — User: ${userId} | Count: ${claims.length}\n`);

    res.status(200).json({
      success: true,
      message: 'Claims retrieved successfully',
      count:   claims.length,
      data:    claims,
    });
  } catch (error) {
    console.error('[ClaimsIntelligence] getUserClaims error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc  Update claim status (admin or system use)
 * @route PUT /api/claims/update-status/:claimId
 * @access Private
 */
const updateClaimStatus = async (req, res) => {
  try {
    const { claimId } = req.params;
    const { status, approvedAmount } = req.body;

    const VALID_STATUSES = ['submitted', 'under_review', 'approved', 'rejected', 'paid', 'fraud_suspected'];
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const updates = {
      status,
      reviewedBy: req.user.id,
      ...(approvedAmount !== undefined && { approvedAmount: Number(approvedAmount) }),
      ...(status === 'paid' && { paidAt: new Date() }),
    };

    const claim = await Claim.findByIdAndUpdate(claimId, { $set: updates }, { new: true, runValidators: true });

    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    console.log(`\n📋 [ClaimsIntelligence] Claim status updated — ID: ${claimId} | New Status: ${status}\n`);

    res.status(200).json({
      success: true,
      message: 'Claim status updated successfully',
      data:    claim,
    });
  } catch (error) {
    console.error('[ClaimsIntelligence] updateClaimStatus error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { submitClaim, getUserClaims, updateClaimStatus };
