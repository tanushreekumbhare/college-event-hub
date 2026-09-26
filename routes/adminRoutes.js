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

// @route   POST /api/admin/verify-attendance
// @desc    Scan/verify registration ID from QR code and mark attendance
// @access  Admin only
router.post('/verify-attendance', requireDB, isAdmin, async (req, res) => {
  try {
    let { registrationId } = req.body;

    if (!registrationId) {
      return res.status(400).json({
        success: false,
        message: 'Registration ID or raw QR payload is required.'
      });
    }

    // Handle JSON payload string if raw QR text was scanned
    registrationId = registrationId.trim();
    if (registrationId.startsWith('{')) {
      try {
        const parsed = JSON.parse(registrationId);
        if (parsed.registrationId) {
          registrationId = parsed.registrationId;
        }
      } catch (e) {
        // Fallthrough if not valid JSON
      }
    }

    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(registrationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Ticket ID format. Please scan or enter a valid 24-character ObjectId.'
      });
    }

    const registration = await Registration.findById(registrationId)
      .populate('student', 'name email')
      .populate('event', 'title date time venue');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Invalid Ticket: Registration record not found in database.'
      });
    }

    if (registration.attended) {
      return res.status(400).json({
        success: false,
        alreadyAttended: true,
        message: `Already Checked-In: Student '${registration.student ? registration.student.name : 'Student'}' was already marked present on ${new Date(registration.attendedAt).toLocaleString()}.`,
        registration
      });
    }

    registration.attended = true;
    registration.attendedAt = new Date();
    await registration.save();

    return res.status(200).json({
      success: true,
      message: `Check-in Verified! Marked attendance for ${registration.student ? registration.student.name : 'Student'} (${registration.event ? registration.event.title : 'Event'}).`,
      registration
    });
  } catch (error) {
    console.error('Verify attendance error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error processing attendance verification.'
    });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get detailed MongoDB aggregation analytics (top events, registrations over time, categories)
// @access  Admin only
router.get('/analytics', requireDB, isAdmin, async (req, res) => {
  try {
    // 1. Top events by signup count
    const topEventsAggregation = await Registration.aggregate([
      {
        $group: {
          _id: '$event',
          signupCount: { $sum: 1 }
        }
      },
      { $sort: { signupCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'events',
          localField: '_id',
          foreignField: '_id',
          as: 'eventDetails'
        }
      },
      { $unwind: '$eventDetails' },
      {
        $project: {
          _id: 1,
          signupCount: 1,
          title: '$eventDetails.title',
          category: '$eventDetails.category',
          maxParticipants: '$eventDetails.maxParticipants'
        }
      }
    ]);

    // 2. Registrations over time (grouped by day)
    const registrationsOverTime = await Registration.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$registeredAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 14 }
    ]);

    // 3. Category breakdown
    const categoryBreakdown = await Event.aggregate([
      {
        $group: {
          _id: '$category',
          totalEvents: { $sum: 1 }
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      analytics: {
        topEvents: topEventsAggregation,
        registrationsOverTime,
        categoryBreakdown
      }
    });
  } catch (error) {
    console.error('Analytics aggregation error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error generating analytics aggregation.'
    });
  }
});

// @route   GET /api/admin/events/:id/export-csv
// @desc    Export attendee roster for a specific event as downloadable CSV
// @access  Admin only
router.get('/events/:id/export-csv', requireDB, isAdmin, async (req, res) => {
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

    const safeTitle = event.title.replace(/[^a-zA-Z0-9]/g, '_');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Attendee_Roster_${safeTitle}.csv"`);

    let csvContent = `Index,Student Name,College Email,Registration Date,Attendance Status,Checked-In At\n`;

    registrations.forEach((reg, idx) => {
      const name = reg.student ? `"${reg.student.name.replace(/"/g, '""')}"` : 'Unknown';
      const email = reg.student ? reg.student.email : 'N/A';
      const regDate = new Date(reg.registeredAt).toISOString();
      const status = reg.attended ? 'Present' : 'Registered';
      const checkinDate = reg.attendedAt ? new Date(reg.attendedAt).toISOString() : 'N/A';

      csvContent += `${idx + 1},${name},${email},${regDate},${status},${checkinDate}\n`;
    });

    return res.send(csvContent);
  } catch (error) {
    console.error('Export CSV error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error exporting CSV attendee roster.'
    });
  }
});

module.exports = router;



