const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'estateiq_fallback_secret',
    { expiresIn: '1d' }
  );
};

exports.register = async (req, res) => {
  try {
    console.log('[REGISTER] Request received with data:', req.body);
    
    const { fullName, email, password, role } = req.body;

    // Validate required fields
    if (!fullName || !email || !password) {
      console.log('[REGISTER] Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'fullName, email, and password are required',
        data: null
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('[REGISTER] Invalid email format');
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        data: null
      });
    }

    // Validate password length
    if (password.length < 6) {
      console.log('[REGISTER] Password too short');
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
        data: null
      });
    }

    // Check if user already exists
    console.log('[REGISTER] Checking if user exists');
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('[REGISTER] Email already registered');
      return res.status(400).json({
        success: false,
        message: 'Email is already registered',
        data: null
      });
    }

    // Create new user
    console.log('[REGISTER] Creating new user');
    const user = new User({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || 'agent'
    });

    // Save user to database
    console.log('[REGISTER] Saving user');
    await user.save();
    console.log('[REGISTER] User saved successfully');

    // Generate JWT token
    const token = generateToken(user);

    // Return success response
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('[REGISTER] Exception caught:', error.message);
    console.error('[REGISTER] Stack trace:', error.stack);
    return res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

exports.login = async (req, res) => {
  try {
    console.log('[LOGIN] Request received');
    
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      console.log('[LOGIN] Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        data: null
      });
    }

    // Find user by email
    console.log('[LOGIN] Looking up user');
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      console.log('[LOGIN] User not found');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        data: null
      });
    }

    // Compare password
    console.log('[LOGIN] Comparing passwords');
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('[LOGIN] Password mismatch');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        data: null
      });
    }

    // Generate token
    const token = generateToken(user);

    // Return success response
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
          role: user.role,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('[LOGIN] Exception caught:', error.message);
    console.error('[LOGIN] Stack trace:', error.stack);
    return res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { fullName, phone = '' } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        data: null
      });
    }

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required',
        data: null
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        fullName: fullName.trim(),
        phone: phone ? phone.trim() : ''
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser._id,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          phone: updatedUser.phone || '',
          role: updatedUser.role,
          createdAt: updatedUser.createdAt
        }
      }
    });
  } catch (error) {
    console.error('[PROFILE UPDATE] Exception caught:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};
