const express = require('express');
const router = express.Router();
const Venue = require('../models/Venue');
const { requireDB, isAdmin } = require('../middleware/authMiddleware');

router.get('/', requireDB, async (req, res) => {
  try {
    const venues = await Venue.find().sort({ name: 1 });
    res.status(200).json({ success: true, venues });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching venues' });
  }
});

router.post('/', requireDB, isAdmin, async (req, res) => {
  try {
    const venue = await Venue.create(req.body);
    res.status(201).json({ success: true, message: 'Venue created', venue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error creating venue' });
  }
});

module.exports = router;
