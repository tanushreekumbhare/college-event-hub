const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
const ParticipationPoint = require('../models/ParticipationPoint');
const { generateRegistrationQR } = require('../services/qrService');

exports.registerForEvent = async (req, res) => {
  try {
    const studentId = req.session.user.id;
    const eventId = req.params.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (event.status !== 'APPROVED') {
      return res.status(400).json({ success: false, message: 'Event is not open for registration.' });
    }

    const existingReg = await Registration.findOne({ student: studentId, event: eventId });
    if (existingReg) {
      return res.status(400).json({ success: false, message: 'Already registered for this event.' });
    }

    const count = await Registration.countDocuments({ event: eventId });
    if (count >= event.maxParticipants) {
      return res.status(400).json({ success: false, message: 'Event is full.' });
    }

    const registration = await Registration.create({
      student: studentId,
      event: eventId
    });

    // Award participation points (5 points for registration)
    await User.findByIdAndUpdate(studentId, { $inc: { participationPoints: 5 } });
    await ParticipationPoint.create({
      student: studentId,
      event: eventId,
      points: 5,
      activityType: 'REGISTRATION',
      description: `Registered for ${event.title}`
    });

    res.status(201).json({
      success: true,
      message: 'Successfully registered for event!',
      registration
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error registering for event.' });
  }
};

exports.cancelRegistration = async (req, res) => {
  try {
    const studentId = req.session.user.id;
    const eventId = req.params.id;

    const registration = await Registration.findOneAndDelete({ student: studentId, event: eventId });
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration record not found.' });
    }

    res.status(200).json({ success: true, message: 'Registration cancelled successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error cancelling registration.' });
  }
};

exports.getMyRegistrations = async (req, res) => {
  try {
    const studentId = req.session.user.id;
    const registrations = await Registration.find({ student: studentId }).populate('event');
    res.status(200).json({ success: true, count: registrations.length, registrations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching registrations.' });
  }
};

exports.getRegistrationQR = async (req, res) => {
  try {
    const registrationId = req.params.id;
    const qrDataUrl = await generateRegistrationQR(registrationId);
    res.status(200).json({ success: true, qrDataUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating QR code.' });
  }
};
