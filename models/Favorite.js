const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    }
  },
  { timestamps: true }
);

favoriteSchema.index({ student: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
