const mongoose = require('mongoose');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Event = require('../models/Event');
const ParticipationPoint = require('../models/ParticipationPoint');

exports.scanAndMarkAttendance = async (req, res) => {
  try {
    let { registrationId } = req.body;
    if (!registrationId) {
      return res.status(400).json({ success: false, message: 'Registration ID is required.' });
    }

    registrationId = String(registrationId).trim();
    if (registrationId.startsWith('{')) {
      try {
        const parsed = JSON.parse(registrationId);
        if (parsed.registrationId) {
          registrationId = parsed.registrationId;
        }
      } catch (e) {}
    }

    if (!mongoose.Types.ObjectId.isValid(registrationId)) {
      return res.status(400).json({ success: false, message: 'Invalid Ticket ID format. Please enter or scan a valid QR pass ID.' });
    }

    const registration = await Registration.findById(registrationId).populate('student').populate('event');
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Invalid ticket: Registration record not found.' });
    }

    const existingAttendance = await Attendance.findOne({ registration: registrationId });
    if (existingAttendance || registration.attended) {
      return res.status(400).json({
        success: false,
        message: `Attendance already marked for student '${registration.student ? registration.student.name : 'Student'}'.`
      });
    }

    // Mark registration as attended
    registration.attended = true;
    registration.attendedAt = new Date();
    await registration.save();

    // Create Attendance record
    const attendance = await Attendance.create({
      registration: registration._id,
      student: registration.student._id,
      event: registration.event._id,
      markedBy: req.session.user ? req.session.user.id : null,
      status: 'PRESENT'
    });

    // Award attendance points (20 points for attendance)
    if (registration.student) {
      await User.findByIdAndUpdate(registration.student._id, { $inc: { participationPoints: 20 } });
      await ParticipationPoint.create({
        student: registration.student._id,
        event: registration.event._id,
        points: 20,
        activityType: 'ATTENDANCE',
        description: `Attended ${registration.event.title}`
      });
    }

    res.status(200).json({
      success: true,
      message: `Attendance marked successfully for ${registration.student ? registration.student.name : 'Student'}!`,
      studentName: registration.student ? registration.student.name : 'Student',
      eventTitle: registration.event ? registration.event.title : 'Event',
      attendance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error processing attendance scan.' });
  }
};

exports.getEventAttendance = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid Event ID format.' });
    }
    const attendanceList = await Attendance.find({ event: eventId }).populate('student', 'name email studentId department');
    res.status(200).json({ success: true, count: attendanceList.length, attendance: attendanceList });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching attendance records.' });
  }
};
