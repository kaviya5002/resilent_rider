const express  = require('express');
const router   = express.Router();
const { createOrder } = require('./paymentController');
const { protect }     = require('../../middleware/authMiddleware');

// POST /api/payment/create-order
router.post('/create-order', protect, createOrder);

module.exports = router;
