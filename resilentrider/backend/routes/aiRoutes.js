const express = require('express');
const router = express.Router();
const { getRiskScore, getIncomePrediction, getZoneSuggestions, getHeatmapData, getRelocationSuggestions, getDemandForecast, getAISummary } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/risk-score', getRiskScore);
router.get('/income-prediction', getIncomePrediction);
router.get('/zone-suggestions', getZoneSuggestions);
router.get('/heatmap', getHeatmapData);
router.post('/relocation', getRelocationSuggestions);
router.get('/demand-forecast', getDemandForecast);
router.get('/summary', getAISummary);

module.exports = router;
