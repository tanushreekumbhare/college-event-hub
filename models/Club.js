const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide club name'],
      unique: true,
      trim: true
    },
    code: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true
    },
    description: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      default: 'General'
    },
    leadName: {
      type: String,
      default: ''
    },
    leadEmail: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Club', clubSchema);
