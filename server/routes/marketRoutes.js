const express = require('express');
const router = express.Router();
const marketController = require('../controllers/marketController');

// GET /api/market/trends?city=Lahore
router.get('/trends', marketController.getMarketTrends);

module.exports = router;
