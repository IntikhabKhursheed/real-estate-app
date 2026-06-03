const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const jwt = require('jsonwebtoken');

// Inline authentication middleware to restrict routes
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: No token provided',
      data: null
    });
  }

  const token = authHeader.split(' ')[1]; // Expecting "Bearer <token>"
  
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

// GET /api/properties (Public)
router.get('/', propertyController.getAllProperties);

// GET /api/properties/:id (Public)
router.get('/:id', propertyController.getPropertyById);

// POST /api/properties (Protected)
router.post('/', authenticateJWT, propertyController.createProperty);

// PUT /api/properties/:id (Protected)
router.put('/:id', authenticateJWT, propertyController.updateProperty);

// DELETE /api/properties/:id (Protected)
router.delete('/:id', authenticateJWT, propertyController.deleteProperty);

module.exports = router;
