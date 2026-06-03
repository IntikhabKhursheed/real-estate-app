const express = require('express');
const router = express.Router();
const investmentController = require('../controllers/investmentController');

// POST /api/properties/investment
router.post('/investment', investmentController.calculate);

module.exports = router;
