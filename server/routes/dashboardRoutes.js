const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: No token provided',
      data: null
    });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: No token in header',
      data: null
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'estateiq_fallback_secret', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Invalid token',
        data: null
      });
    }

    req.user = user;
    next();
  });
};

router.get('/agent', authenticateJWT, dashboardController.getAgentDashboard);

module.exports = router;
