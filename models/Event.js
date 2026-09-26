const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide an event title'],
    trim: true,
    maxlength: [150, 'Title cannot exceed 150 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide an event description'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please specify a category'],
    enum: ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Other'],
    default: 'Technical'
  },
  date: {
    type: String,
    required: [true, 'Please provide event date (YYYY-MM-DD)']
  },
  time: {
    type: String,
    required: [true, 'Please provide event time (e.g. 10:00 AM)']
  },
  venue: {
    type: String,
    required: [true, 'Please provide event venue or room'],
    trim: true
  },
  organizer: {
    type: String,
    required: [true, 'Please provide organizing club or department'],
    trim: true
  },
  maxParticipants: {
    type: Number,
    required: [true, 'Please specify maximum participants capacity'],
    min: [1, 'Capacity must be at least 1']
  },
  imageUrl: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', eventSchema);
