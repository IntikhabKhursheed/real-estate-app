const express = require('express');
const router = express.Router();
const valuationController = require('../controllers/valuationController');

// POST /api/valuation/estimate (mapped via /estimate inside valuationRoutes)
router.post('/estimate', valuationController.estimateValuation);

// GET /api/valuation/investment-score/:id
router.get('/investment-score/:id', valuationController.getInvestmentScoreByPropertyId);

module.exports = router;
