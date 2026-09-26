const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    registration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
      required: true
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
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    checkedInAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'LATE'],
      default: 'PRESENT'
    }
  },
  { timestamps: true }
);

attendanceSchema.index({ student: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
