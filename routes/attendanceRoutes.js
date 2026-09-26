const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { requireDB, isAuthenticated, isOrganizerOrAdmin } = require('../middleware/authMiddleware');

router.post('/scan', requireDB, isOrganizerOrAdmin, attendanceController.scanAndMarkAttendance);
router.get('/event/:eventId', requireDB, isOrganizerOrAdmin, attendanceController.getEventAttendance);

module.exports = router;
