const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
const { requireDB, isAdmin } = require('../middleware/authMiddleware');

router.get('/', requireDB, async (req, res) => {
  try {
    const clubs = await Club.find().sort({ name: 1 });
    res.status(200).json({ success: true, clubs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching clubs' });
  }
});

router.post('/', requireDB, isAdmin, async (req, res) => {
  try {
    const club = await Club.create(req.body);
    res.status(201).json({ success: true, message: 'Club created', club });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error creating club' });
  }
});

module.exports = router;
