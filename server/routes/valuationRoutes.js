const express = require('express');
const router = express.Router();
const valuationController = require('../controllers/valuationController');

// POST /api/valuation/estimate (mapped via /estimate inside valuationRoutes)
router.post('/estimate', valuationController.estimateValuation);

module.exports = router;
