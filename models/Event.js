const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
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
      enum: ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Hackathon', 'Competition', 'Club Activity', 'Other'],
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
    startTime: {
      type: String,
      default: ''
    },
    endTime: {
      type: String,
      default: ''
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
    organizerUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    maxParticipants: {
      type: Number,
      required: [true, 'Please specify maximum participants capacity'],
      min: [1, 'Capacity must be at least 1']
    },
    registrationDeadline: {
      type: String,
      default: ''
    },
    imageUrl: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'],
      default: 'APPROVED'
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    rules: {
      type: String,
      default: ''
    },
    requirements: {
      type: String,
      default: ''
    },
    contactDetails: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
