const Transaction = require('../../models/Transaction');

// ── Confidence score → decision thresholds ─────────────────────────────────
const THRESHOLDS = {
  APPROVED:     70,   // >= 70  → approved
  UNDER_REVIEW: 40,   // 40–69  → under_review
                      // < 40   → rejected
};

// ── Payout percentage per confidence band ──────────────────────────────────
const PAYOUT_RATE = 0.80; // 80% of claimed amount paid out on approval

/**
 * resolveAutoDecision
 * Maps a weather confidenceScore to { status, payoutStatus }
 */
function resolveAutoDecision(confidenceScore) {
  if (confidenceScore >= THRESHOLDS.APPROVED) {
    return { status: 'approved', payoutStatus: 'pending' };
  }
  if (confidenceScore >= THRESHOLDS.UNDER_REVIEW) {
    return { status: 'under_review', payoutStatus: 'not_applicable' };
  }
  return { status: 'rejected', payoutStatus: 'not_applicable' };
}

/**
 * processPayout
 * Creates a claim_payout Transaction and returns payout details.
 * Only called when status === 'approved'.
 */
async function processPayout({ riderId, claimId, claimedAmount }) {
  const approvedAmount = Math.round(claimedAmount * PAYOUT_RATE);

  const transaction = await Transaction.create({
    rider:       riderId,
    type:        'claim_payout',
    amount:      approvedAmount,
    status:      'completed',
    description: 'Auto payout processed',
    reference:   `CLAIM-${claimId}`,
    date:        new Date(),
  });

  console.log(
    `\n💰 [PayoutService] Payout processed — Rider: ${riderId} | ` +
    `Claim: ${claimId} | Amount: ₹${approvedAmount} | Txn: ${transaction._id}\n`
  );

  return { approvedAmount, transactionId: transaction._id };
}

module.exports = { resolveAutoDecision, processPayout, PAYOUT_RATE };
