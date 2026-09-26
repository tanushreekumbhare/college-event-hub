const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide venue name'],
      unique: true,
      trim: true
    },
    location: {
      type: String,
      default: ''
    },
    capacity: {
      type: Number,
      required: [true, 'Please specify venue capacity'],
      min: 1
    },
    facilities: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'MAINTENANCE', 'BOOKED'],
      default: 'AVAILABLE'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Venue', venueSchema);
