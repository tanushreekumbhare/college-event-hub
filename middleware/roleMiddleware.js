const { isAdmin, isStudent, isOrganizer, isOrganizerOrAdmin } = require('./authMiddleware');

module.exports = {
  isAdmin,
  isStudent,
  isOrganizer,
  isOrganizerOrAdmin
};
