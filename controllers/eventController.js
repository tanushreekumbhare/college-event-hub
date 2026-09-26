const Event = require('../models/Event');

exports.getEvents = async (req, res) => {
  try {
    const { category, search, venue, status } = req.query;
    let query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (venue) {
      query.venue = { $regex: venue, $options: 'i' };
    }

    if (status) {
      query.status = status;
    } else if (!req.session.user || req.session.user.role === 'student') {
      query.status = 'APPROVED';
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { organizer: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } }
      ];
    }

    const events = await Event.find(query).sort({ date: 1 });
    res.status(200).json({ success: true, count: events.length, events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching events' });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.status(200).json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching event details' });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const { title, description, category, date, time, venue, organizer, maxParticipants, rules, requirements, contactDetails } = req.body;

    let imageUrl = '';
    if (req.file) {
      imageUrl = req.file.path || req.file.secure_url;
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
    }

    const status = (req.session.user && req.session.user.role === 'admin') ? 'APPROVED' : 'PENDING_APPROVAL';

    const event = await Event.create({
      title,
      description,
      category,
      date,
      time,
      venue,
      organizer,
      organizerUser: req.session.user ? req.session.user.id : null,
      maxParticipants: Number(maxParticipants) || 50,
      imageUrl,
      status,
      rules: rules || '',
      requirements: requirements || '',
      contactDetails: contactDetails || ''
    });

    res.status(201).json({ success: true, message: 'Event created successfully!', event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error creating event' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (req.file) {
      req.body.imageUrl = req.file.path || req.file.secure_url;
    }

    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: 'Event updated successfully', event: updatedEvent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error updating event' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting event' });
  }
};
