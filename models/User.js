const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your full name'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email address'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    validate: {
      validator: function (v) {
        // Enforce at least one number when setting a plain or hashed password
        return v.length >= 8 && (/\d/.test(v) || v.startsWith('$2a$') || v.startsWith('$2b$'));
      },
      message: 'Password must contain at least one number'
    }
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Remove password when returning user object
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);

