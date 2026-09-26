const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { requireDB, isAdmin } = require('../middleware/authMiddleware');

// @route   GET /api/events
// @desc    Get all events with search, category filtering, and registration counts
// @access  Public
router.get('/', requireDB, async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { venue: searchRegex },
        { organizer: searchRegex }
      ];
    }

    const events = await Event.find(filter).sort({ date: 1, time: 1 });

    // Aggregate registration counts for each event
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const registrationCount = await Registration.countDocuments({ event: event._id });
        const spotsLeft = Math.max(0, event.maxParticipants - registrationCount);
        const isFull = registrationCount >= event.maxParticipants;

        return {
          ...event.toObject(),
          registrationCount,
          spotsLeft,
          isFull
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: eventsWithCounts.length,
      events: eventsWithCounts
    });
  } catch (error) {
    console.error('Fetch events error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching events.'
    });
  }
});

// @route   GET /api/events/:id
// @desc    Get single event details with capacity and user registration status
// @access  Public
router.get('/:id', requireDB, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    const registrationCount = await Registration.countDocuments({ event: event._id });
    const spotsLeft = Math.max(0, event.maxParticipants - registrationCount);
    const isFull = registrationCount >= event.maxParticipants;

    let isRegistered = false;
    let registrationId = null;

    if (req.session && req.session.user) {
      const existingReg = await Registration.findOne({
        event: event._id,
        student: req.session.user.id
      });
      if (existingReg) {
        isRegistered = true;
        registrationId = existingReg._id;
      }
    }

    return res.status(200).json({
      success: true,
      event: {
        ...event.toObject(),
        registrationCount,
        spotsLeft,
        isFull,
        isRegistered,
        registrationId
      }
    });
  } catch (error) {
    console.error('Fetch event error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching event details.'
    });
  }
});

// @route   POST /api/events
// @desc    Create a new event
// @access  Admin only
router.post('/', requireDB, isAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      date,
      time,
      venue,
      organizer,
      maxParticipants,
      imageUrl
    } = req.body;

    if (!title || !description || !date || !time || !venue || !organizer || !maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields.'
      });
    }

    const newEvent = new Event({
      title: title.trim(),
      description: description.trim(),
      category: category || 'Technical',
      date,
      time: time.trim(),
      venue: venue.trim(),
      organizer: organizer.trim(),
      maxParticipants: Number(maxParticipants),
      imageUrl: imageUrl ? imageUrl.trim() : ''
    });

    await newEvent.save();

    return res.status(201).json({
      success: true,
      message: 'Event created successfully!',
      event: newEvent
    });
  } catch (error) {
    console.error('Create event error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating event.'
    });
  }
});

// @route   PUT /api/events/:id
// @desc    Update an existing event
// @access  Admin only
router.put('/:id', requireDB, isAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      date,
      time,
      venue,
      organizer,
      maxParticipants,
      imageUrl
    } = req.body;

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    if (title) event.title = title.trim();
    if (description) event.description = description.trim();
    if (category) event.category = category;
    if (date) event.date = date;
    if (time) event.time = time.trim();
    if (venue) event.venue = venue.trim();
    if (organizer) event.organizer = organizer.trim();
    if (maxParticipants) event.maxParticipants = Number(maxParticipants);
    if (imageUrl !== undefined) event.imageUrl = imageUrl.trim();

    await event.save();

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully!',
      event
    });
  } catch (error) {
    console.error('Update event error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating event.'
    });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete an event and its registrations
// @access  Admin only
router.delete('/:id', requireDB, isAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.'
      });
    }

    // Delete all registrations for this event
    await Registration.deleteMany({ event: event._id });
    await Event.findByIdAndDelete(event._id);

    return res.status(200).json({
      success: true,
      message: 'Event and related registrations deleted successfully.'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting event.'
    });
  }
});

module.exports = router;
