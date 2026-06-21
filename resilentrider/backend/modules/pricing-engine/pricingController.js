const { calculateDynamicPremium } = require('./pricingEngine');

/**
 * @desc  Calculate dynamic premium for a rider
 * @route GET /api/pricing/calculate/:userId
 * @access Private
 */
const getDynamicPricing = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await calculateDynamicPremium(userId);

    // ── Console log ───────────────────────────────────────────────────────
    console.log('\n💰 [PricingEngine] Dynamic premium calculated successfully');
    console.log('─────────────────────────────────────────────────────────');
    console.log(`  User ID            : ${userId}`);
    console.log(`  Risk Level         : ${result.riskLevel}`);
    console.log(`  Base Premium       : ₹${result.basePremium}`);
    console.log(`  Risk Factor        : ${result.riskFactor}`);
    console.log(`  Behavior Factor    : ${result.behaviorFactor}  (trend: ${result.breakdown.earningsTrend})`);
    console.log(`  Environment Factor : ${result.environmentFactor}  (weather: ${result.breakdown.weatherCondition})`);
    console.log(`  Stability Factor   : ${result.stabilityFactor}  (${result.breakdown.stabilityLabel})`);
    console.log(`  ── Final Premium   : ₹${result.finalPremium}/month`);
    console.log('─────────────────────────────────────────────────────────\n');

    res.status(200).json({
      success: true,
      message: 'Dynamic premium calculated successfully',
      data: {
        basePremium:       result.basePremium,
        riskFactor:        result.riskFactor,
        behaviorFactor:    result.behaviorFactor,
        environmentFactor: result.environmentFactor,
        stabilityFactor:   result.stabilityFactor,
        finalPremium:      result.finalPremium,
        breakdown:         result.breakdown,
      },
    });
  } catch (error) {
    console.error('[PricingEngine] Error:', error.message);
    const status = error.message === 'User not found' ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

module.exports = { getDynamicPricing };
