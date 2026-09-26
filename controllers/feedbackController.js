const Feedback = require('../models/Feedback');
const Registration = require('../models/Registration');

exports.submitFeedback = async (req, res) => {
  try {
    const studentId = req.session.user.id;
    const eventId = req.params.eventId;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    const registration = await Registration.findOne({ student: studentId, event: eventId });
    if (!registration || !registration.attended) {
      return res.status(403).json({ success: false, message: 'Feedback permitted only for attended events.' });
    }

    const existingFeedback = await Feedback.findOne({ student: studentId, event: eventId });
    if (existingFeedback) {
      return res.status(400).json({ success: false, message: 'Feedback already submitted for this event.' });
    }

    const feedback = await Feedback.create({
      student: studentId,
      event: eventId,
      rating: Number(rating),
      comment: comment || ''
    });

    res.status(201).json({ success: true, message: 'Feedback submitted successfully!', feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error submitting feedback.' });
  }
};

exports.getEventFeedback = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const feedbackList = await Feedback.find({ event: eventId }).populate('student', 'name department');
    
    let avgRating = 0;
    if (feedbackList.length > 0) {
      const sum = feedbackList.reduce((acc, f) => acc + f.rating, 0);
      avgRating = (sum / feedbackList.length).toFixed(1);
    }

    res.status(200).json({
      success: true,
      count: feedbackList.length,
      averageRating: Number(avgRating),
      feedback: feedbackList
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching feedback.' });
  }
};
