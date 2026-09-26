const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { requireDB, isAuthenticated } = require('../middleware/authMiddleware');

router.post('/events/:eventId/feedback', requireDB, isAuthenticated, feedbackController.submitFeedback);
router.get('/events/:eventId/feedback', requireDB, feedbackController.getEventFeedback);

module.exports = router;
