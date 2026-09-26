const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireDB } = require('../middleware/authMiddleware');

router.get('/', requireDB, async (req, res) => {
  try {
    const leaderboard = await User.find({ role: 'student' })
      .select('name department year participationPoints')
      .sort({ participationPoints: -1 })
      .limit(20);

    res.status(200).json({ success: true, leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching leaderboard' });
  }
});

module.exports = router;
