const { createPayoutOrder } = require('./paymentService');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/create-order
// ─────────────────────────────────────────────────────────────────────────────
const createOrder = async (req, res) => {
  try {
    const { amount, userId } = req.body;

    if (!amount || !userId) {
      return res.status(400).json({
        success: false,
        message: 'amount and userId are required',
      });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'amount must be a positive number',
      });
    }

    const order = await createPayoutOrder(parsedAmount, userId);

    return res.status(201).json({
      success: true,
      message: 'Razorpay order created successfully',
      data: {
        orderId:  order.orderId,
        amount:   order.amount,
        currency: order.currency,
        receipt:  order.receipt,
      },
    });

  } catch (error) {
    const msg = error?.error?.description || error?.message || 'Razorpay order creation failed';
    const isConfigError = msg.includes('RAZORPAY_KEY');
    console.error('[PaymentService] createOrder error:', msg);
    return res.status(isConfigError ? 503 : 500).json({
      success: false,
      message: msg,
    });
  }
};

module.exports = { createOrder };
