const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const Registration = require('../models/Registration');
const { generateCertificatePDF } = require('../services/certificateService');
const { requireDB, isAuthenticated } = require('../middleware/authMiddleware');

router.get('/', requireDB, isAuthenticated, async (req, res) => {
  try {
    const studentId = req.session.user.id;
    const certificates = await Certificate.find({ student: studentId }).populate('event');
    res.status(200).json({ success: true, count: certificates.length, certificates });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching certificates' });
  }
});

router.get('/:registrationId/download', requireDB, isAuthenticated, async (req, res) => {
  try {
    const { registrationId } = req.params;
    const registration = await Registration.findById(registrationId)
      .populate('student', 'name email')
      .populate('event', 'title date venue organizer');

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration record not found.' });
    }

    if (!registration.attended) {
      return res.status(403).json({ success: false, message: 'Certificate is only available after verified event attendance.' });
    }

    const certificateData = {
      studentName: registration.student.name,
      eventTitle: registration.event.title,
      eventDate: registration.event.date,
      certificateId: `CERT-${registration._id.toString().substring(18).toUpperCase()}`,
      organizerName: registration.event.organizer
    };

    generateCertificatePDF(res, certificateData);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating certificate PDF' });
  }
});

module.exports = router;
