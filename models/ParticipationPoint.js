const mongoose = require('mongoose');

const participationPointSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null
    },
    points: {
      type: Number,
      required: true
    },
    activityType: {
      type: String,
      enum: ['REGISTRATION', 'ATTENDANCE', 'WORKSHOP', 'COMPETITION', 'CERTIFICATE'],
      required: true
    },
    description: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ParticipationPoint', participationPointSchema);
