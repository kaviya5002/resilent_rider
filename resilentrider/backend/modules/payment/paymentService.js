const Razorpay = require('razorpay');

// ── Razorpay instance — initialised lazily so missing keys fail loudly ────────
let _razorpay = null;

function getRazorpay() {
  if (_razorpay) return _razorpay;

  const key_id     = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables');
  }

  _razorpay = new Razorpay({ key_id, key_secret });
  return _razorpay;
}

// ── createPayoutOrder ─────────────────────────────────────────────────────────
// amount   : number — in rupees (converted to paise internally)
// userId   : string — used to build a unique receipt id
// Returns  : { orderId, amount, currency, receipt }
async function createPayoutOrder(amount, userId) {
  if (!amount || amount <= 0) throw new Error('amount must be a positive number');
  if (!userId)                throw new Error('userId is required');

  const razorpay = getRazorpay();

  const amountInPaise = Math.round(amount * 100);
  const shortId = String(userId).slice(-8);          // last 8 chars of userId
  const receipt  = `rr_${shortId}_${Date.now().toString().slice(-8)}`; // max ~22 chars

  const order = await razorpay.orders.create({
    amount:   amountInPaise,
    currency: 'INR',
    receipt,
    notes: {
      userId,
      source: 'ResilientRider claim payout',
    },
  });

  console.log(
    `\n💳 [PaymentService] Razorpay order created — User: ${userId} | ` +
    `Order: ${order.id} | Amount: ₹${amount} (${amountInPaise} paise)\n`
  );

  return {
    orderId:  order.id,
    amount:   order.amount,
    currency: order.currency,
    receipt:  order.receipt,
  };
}

module.exports = { createPayoutOrder };
