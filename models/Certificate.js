const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    issueDate: {
      type: Date,
      default: Date.now
    },
    pdfUrl: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

certificateSchema.index({ student: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Certificate', certificateSchema);
