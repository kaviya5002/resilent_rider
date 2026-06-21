const express = require('express');
const router = express.Router();
const { applyLoan, getMyLoans, getAllLoans, reviewLoan } = require('../controllers/loanController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/apply', protect, applyLoan);
router.get('/my-loans', protect, getMyLoans);
router.get('/all', protect, adminOnly, getAllLoans);
router.put('/:id/review', protect, adminOnly, reviewLoan);

module.exports = router;
