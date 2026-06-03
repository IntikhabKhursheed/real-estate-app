const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('[APP] Starting minimal EstateIQ server...');

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/estateiq';
console.log('[APP] Connecting to MongoDB...');
mongoose.connect(mongoURI)
  .then(() => console.log('[APP] MongoDB connected successfully'))
  .catch(err => console.error('[APP] MongoDB connection error:', err.message));

// Direct inline auth routes - no external route file
const User = require('./models/User');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'estateiq_fallback_secret',
    { expiresIn: '1d' }
  );
};

// POST /api/auth/register - inline handler
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('[REGISTER] Received request');
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'fullName, email, and password are required',
        data: null
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered',
        data: null
      });
    }

    const user = new User({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'agent'
    });

    await user.save();
    console.log('[REGISTER] User saved successfully');

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('[REGISTER] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
});

// POST /api/auth/login - inline handler
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('[LOGIN] Received request');
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        data: null
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        data: null
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        data: null
      });
    }

    const token = generateToken(user);
    console.log('[LOGIN] Login successful');

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('[LOGIN] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR HANDLER]', err.message);
  res.status(500).json({
    success: false,
    message: err.message,
    data: null
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[APP] EstateIQ Server Running on Port ${PORT}`);
});

module.exports = app;
