const { checkDBStatus } = require('../config/database');

// Ensure database is connected before DB operations
const requireDB = (req, res, next) => {
  if (!checkDBStatus()) {
    return res.status(503).json({
      success: false,
      message: 'Database is not connected. Please configure MONGODB_URI in your environment variables.'
    });
  }
  next();
};

// Check if user is authenticated (logged in via session)
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: 'Authentication required. Please login first.'
  });
};

// Check if logged-in user is an Admin
const isAdmin = (req, res, next) => {
  if (req.session && req.session.user) {
    if (req.session.user.role === 'admin') {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'Access denied: Admin privileges required.'
    });
  }
  return res.status(401).json({
    success: false,
    message: 'Authentication required. Please login as admin.'
  });
};

// Check if logged-in user is a Student
const isStudent = (req, res, next) => {
  if (req.session && req.session.user) {
    if (req.session.user.role === 'student') {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'Access denied: Student access only.'
    });
  }
  return res.status(401).json({
    success: false,
    message: 'Authentication required. Please login as a student.'
  });
};

// Check if logged-in user is an Organizer
const isOrganizer = (req, res, next) => {
  if (req.session && req.session.user) {
    if (req.session.user.role === 'organizer') {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'Access denied: Organizer privileges required.'
    });
  }
  return res.status(401).json({
    success: false,
    message: 'Authentication required. Please login as organizer.'
  });
};

// Check if user is Organizer or Admin
const isOrganizerOrAdmin = (req, res, next) => {
  if (req.session && req.session.user) {
    if (req.session.user.role === 'organizer' || req.session.user.role === 'admin') {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'Access denied: Organizer or Admin privileges required.'
    });
  }
  return res.status(401).json({
    success: false,
    message: 'Authentication required.'
  });
};

module.exports = {
  requireDB,
  isAuthenticated,
  isAdmin,
  isStudent,
  isOrganizer,
  isOrganizerOrAdmin
};
