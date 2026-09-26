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

module.exports = router;
