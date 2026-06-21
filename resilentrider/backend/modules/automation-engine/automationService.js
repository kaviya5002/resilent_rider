/**
 * Automation Engine — Main Service
 * ----------------------------------
 * runAutomationChecks(userId) runs all 5 triggers in parallel
 * and returns a merged { alerts, actions, triggerResults } object.
 */

const {
  weatherTrigger,
  incomeTrigger,
  claimsTrigger,
  zoneTrigger,
  systemTrigger,
} = require('./triggers');

/**
 * runAutomationChecks
 * @param {string} userId — MongoDB ObjectId string
 * @returns {{ alerts: string[], actions: string[], triggerResults: object[] }}
 */
async function runAutomationChecks(userId) {
  // Run all triggers in parallel for performance
  const [weather, income, claims, zone, system] = await Promise.all([
    weatherTrigger(userId),
    incomeTrigger(userId),
    claimsTrigger(userId),
    zoneTrigger(userId),
    systemTrigger(),
  ]);

  const triggerResults = [weather, income, claims, zone, system];

  // Merge all alerts and actions into flat arrays
  const alerts  = triggerResults.flatMap((r) => r.alerts);
  const actions = triggerResults.flatMap((r) => r.actions);

  return { alerts, actions, triggerResults };
}

module.exports = { runAutomationChecks };
