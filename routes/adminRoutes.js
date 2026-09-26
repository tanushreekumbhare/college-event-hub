const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');
const { requireDB, isAdmin } = require('../middleware/authMiddleware');

// @route   GET /api/admin/stats
// @desc    Get overview analytics for admin dashboard
// @access  Admin only
router.get('/stats', requireDB, isAdmin, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [totalEvents, upcomingEvents, totalRegistrations, totalStudents] = await Promise.all([
      Event.countDocuments(),
      Event.countDocuments({ date: { $gte: today } }),
      Registration.countDocuments(),
      User.countDocuments({ role: 'student' })
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalEvents,
        upcomingEvents,
        totalRegistrations,
        totalStudents
      }
    });
  } catch (error) {
    console.error('Fetch admin stats error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching admin statistics.'
    });
  }
});

// @route   GET /api/admin/events/:id/registrations
// @desc    Get all students registered for a specific event
// @access  Admin only
router.get('/events/:id/registrations', requireDB, isAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    const registrations = await Registration.find({ event: event._id })
      .populate('student', 'name email createdAt')
      .sort({ registeredAt: -1 });

    return res.status(200).json({
      success: true,
      event: {
        id: event._id,
        title: event.title,
        date: event.date,
        time: event.time,
        venue: event.venue,
        maxParticipants: event.maxParticipants,
        totalRegistered: registrations.length
      },
      registrations
    });
  } catch (error) {
    console.error('Fetch event registrations error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching event registrations.'
    });
  }
});

// @route   POST /api/admin/create-admin
// @desc    Create a new admin account (Admin only)
// @access  Admin only
router.post('/create-admin', requireDB, isAdmin, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, and password.'
      });
    }

    if (password.length < 8 || !/\d/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and contain at least one number.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'admin'
    });

    await newAdmin.save();

    return res.status(201).json({
      success: true,
      message: 'New Admin account created successfully!',
      user: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating admin account.'
    });
  }
});

module.exports = router;

