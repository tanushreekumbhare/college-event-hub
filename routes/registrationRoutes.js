const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { requireDB, isStudent } = require('../middleware/authMiddleware');

const { sendRegistrationEmail, sendCancellationEmail } = require('../config/mailer');

// @route   POST /api/registrations
// @desc    Register a student for an event
// @access  Student only
router.post('/', requireDB, isStudent, async (req, res) => {
  try {
    const { eventId } = req.body;
    const studentId = req.session.user.id;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required.'
      });
    }

    // 1. Verify that event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    // 2. Prevent duplicate registration
    const existingRegistration = await Registration.findOne({
      student: studentId,
      event: eventId
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'Already registered for this event.'
      });
    }

    // 3. Check event maximum capacity
    const currentRegistrationCount = await Registration.countDocuments({ event: eventId });
    if (currentRegistrationCount >= event.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Event is full. No more seats available.'
      });
    }

    // 4. Create registration
    const registration = new Registration({
      student: studentId,
      event: eventId
    });

    await registration.save();

    // 5. Send confirmation email (asynchronous, non-blocking)
    sendRegistrationEmail({
      toEmail: req.session.user.email,
      studentName: req.session.user.name,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      eventVenue: event.venue,
      eventOrganizer: event.organizer
    }).catch(err => console.error('Email error:', err));

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Confirmation email has been sent to your college inbox.',
      registration
    });
  } catch (error) {
    // Catch Mongo duplicate key error if concurrent requests bypass earlier check
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Already registered for this event.'
      });
    }

    console.error('Registration creation error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during event registration.'
    });
  }
});

// @route   GET /api/registrations/my
// @desc    Get all events registered by the current logged-in student
// @access  Student only
router.get('/my', requireDB, isStudent, async (req, res) => {
  try {
    const studentId = req.session.user.id;

    const registrations = await Registration.find({ student: studentId })
      .populate('event')
      .sort({ registeredAt: -1 });

    // Filter out any where event was deleted
    const validRegistrations = registrations.filter((r) => r.event !== null);

    return res.status(200).json({
      success: true,
      count: validRegistrations.length,
      registrations: validRegistrations
    });
  } catch (error) {
    console.error('Fetch student registrations error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching your registrations.'
    });
  }
});

// @route   DELETE /api/registrations/:id
// @desc    Cancel a student's registration
// @access  Student only
router.delete('/:id', requireDB, isStudent, async (req, res) => {
  try {
    const studentId = req.session.user.id;
    const registration = await Registration.findById(req.params.id).populate('event');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration record not found.'
      });
    }

    // Ensure student only cancels their own registration
    if (registration.student.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only cancel your own registrations.'
      });
    }

    await Registration.findByIdAndDelete(req.params.id);

    // Send cancellation confirmation email (asynchronous, non-blocking)
    if (registration.event) {
      sendCancellationEmail({
        toEmail: req.session.user.email,
        studentName: req.session.user.name,
        eventTitle: registration.event.title
      }).catch(err => console.error('Cancellation email error:', err));
    }

    return res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully. Cancellation notice sent to your email.'
    });
  } catch (error) {
    console.error('Cancel registration error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error cancelling registration.'
    });
  }
});


module.exports = router;
