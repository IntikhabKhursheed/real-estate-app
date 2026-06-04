const express = require('express');
const jwt = require('jsonwebtoken');
const uploadController = require('../controllers/uploadController');
const { uploadPropertyImages } = require('../middleware/upload');

const router = express.Router();

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

router.post('/', authenticateJWT, uploadPropertyImages, uploadController.uploadImages);

module.exports = router;
