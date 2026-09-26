const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');
const { requireDB, isAuthenticated } = require('../middleware/authMiddleware');

router.get('/', requireDB, isAuthenticated, async (req, res) => {
  try {
    const favorites = await Favorite.find({ student: req.session.user.id }).populate('event');
    res.status(200).json({ success: true, count: favorites.length, favorites });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching favorites' });
  }
});

router.post('/:eventId', requireDB, isAuthenticated, async (req, res) => {
  try {
    const studentId = req.session.user.id;
    const eventId = req.params.eventId;

    const existing = await Favorite.findOne({ student: studentId, event: eventId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Event already in favorites' });
    }

    const favorite = await Favorite.create({ student: studentId, event: eventId });
    res.status(201).json({ success: true, message: 'Added to favorites', favorite });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding favorite' });
  }
});

router.delete('/:eventId', requireDB, isAuthenticated, async (req, res) => {
  try {
    await Favorite.findOneAndDelete({ student: req.session.user.id, event: req.params.eventId });
    res.status(200).json({ success: true, message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error removing favorite' });
  }
});

module.exports = router;
