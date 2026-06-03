const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// POST /api/properties/search
router.post('/search', searchController.search);

module.exports = router;
