const { runAutomationChecks } = require('./automationService');

/**
 * @desc  Run all automation checks for a rider
 * @route GET /api/automation/check/:userId
 * @access Private
 */
const runChecks = async (req, res) => {
  try {
    const { userId } = req.params;

    const { alerts, actions, triggerResults } = await runAutomationChecks(userId);

    // ── Logging ───────────────────────────────────────────────────────────
    console.log('\n⚙️  [AutomationEngine] Automation checks completed successfully');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`  User ID       : ${userId}`);
    console.log(`  Triggers Run  : ${triggerResults.length}`);
    console.log(`  Fired         : ${triggerResults.filter((t) => t.fired).map((t) => t.trigger).join(', ') || 'none'}`);
    console.log(`  Total Alerts  : ${alerts.length}`);
    console.log(`  Total Actions : ${actions.length}`);

    triggerResults.forEach((t) => {
      if (t.fired) {
        console.log(`\n  🔔 ${t.trigger}`);
        t.alerts.forEach((a)  => console.log(`     Alert  → ${a}`));
        t.actions.forEach((a) => console.log(`     Action → ${a}`));
      }
    });

    console.log('─────────────────────────────────────────────────────────────\n');

    res.status(200).json({
      success: true,
      message: 'Automation checks completed successfully',
      data: {
        userId,
        alerts,
        actions,
        summary: {
          totalTriggers: triggerResults.length,
          firedTriggers: triggerResults.filter((t) => t.fired).length,
          totalAlerts:   alerts.length,
          totalActions:  actions.length,
        },
        triggerResults,
      },
    });
  } catch (error) {
    console.error('[AutomationEngine] runChecks error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { runChecks };
