const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { requireDB } = require('../middleware/authMiddleware');

// @route   POST /api/auth/register
// @desc    Register a new student account
// @access  Public
router.post('/register', requireDB, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, and password.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Check if user already exists
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    // Hash password with bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'student'
    });

    await newUser.save();

    // Automatically set session upon successful registration
    req.session.user = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    };

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to College Event Hub.',
      user: req.session.user
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration.'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & establish session
// @access  Public
router.post('/login', requireDB, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials. User not found.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.'
      });
    }

    // Establish session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      user: req.session.user
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login.'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Destroy session and log user out
// @access  Public
router.post('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error logging out.'
        });
      }
      res.clearCookie('connect.sid');
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully.'
      });
    });
  } else {
    return res.status(200).json({
      success: true,
      message: 'Already logged out.'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get currently logged in user from session
// @access  Public
router.get('/me', (req, res) => {
  if (req.session && req.session.user) {
    return res.status(200).json({
      success: true,
      user: req.session.user
    });
  }
  return res.status(200).json({
    success: true,
    user: null
  });
});

module.exports = router;
