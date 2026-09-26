const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { requireDB, isOrganizerOrAdmin, isAdmin } = require('../middleware/authMiddleware');

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

const { upload, uploadToCloudinary } = require('../config/cloudinary');

// @route   POST /api/events
// @desc    Create a new event with optional Cloudinary image upload
// @access  Organizer or Admin
router.post('/', requireDB, isOrganizerOrAdmin, upload.single('image'), async (req, res) => {
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
      imageUrl: bodyImageUrl
    } = req.body;

    if (!title || !description || !date || !time || !venue || !organizer || !maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields.'
      });
    }

    let finalImageUrl = bodyImageUrl ? bodyImageUrl.trim() : '';

    // If an image file was uploaded, upload to Cloudinary
    if (req.file) {
      try {
        const cloudinaryRes = await uploadToCloudinary(req.file.buffer, 'college_events');
        finalImageUrl = cloudinaryRes.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload event image poster to Cloudinary.'
        });
      }
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
      imageUrl: finalImageUrl
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
// @desc    Update an existing event with optional Cloudinary image upload
// @access  Organizer or Admin
router.put('/:id', requireDB, isOrganizerOrAdmin, upload.single('image'), async (req, res) => {
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
      imageUrl: bodyImageUrl
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

    // If new image file uploaded, upload to Cloudinary
    if (req.file) {
      try {
        const cloudinaryRes = await uploadToCloudinary(req.file.buffer, 'college_events');
        event.imageUrl = cloudinaryRes.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary update upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload new event poster image.'
        });
      }
    } else if (bodyImageUrl !== undefined) {
      event.imageUrl = bodyImageUrl.trim();
    }

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
// @access  Organizer or Admin
router.delete('/:id', requireDB, isOrganizerOrAdmin, async (req, res) => {
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
