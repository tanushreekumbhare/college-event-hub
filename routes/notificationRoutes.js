const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { requireDB, isAuthenticated } = require('../middleware/authMiddleware');

router.get('/', requireDB, isAuthenticated, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.session.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: notifications.length, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching notifications' });
  }
});

router.put('/:id/read', requireDB, isAuthenticated, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating notification' });
  }
});

router.put('/read-all', requireDB, isAuthenticated, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.session.user.id }, { isRead: true });
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating notifications' });
  }
});

module.exports = router;
