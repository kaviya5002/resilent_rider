const express    = require('express');
const router     = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  addEarningsRecord,
  getMonthlyEarnings,
  getEarningsByDate,
  updateEarningsRecord,
  deleteEarningsRecord,
} = require('../controllers/earningsController');

router.post('/add',                protect, addEarningsRecord);
router.get('/month/:year/:month',  protect, getMonthlyEarnings);
router.get('/date/:date',          protect, getEarningsByDate);
router.put('/update/:date',        protect, updateEarningsRecord);
router.delete('/delete/:date',     protect, deleteEarningsRecord);

module.exports = router;
