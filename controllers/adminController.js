const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Feedback = require('../models/Feedback');
const bcrypt = require('bcryptjs');
const { createNotification } = require('../services/notificationService');

exports.getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalOrganizers = await User.countDocuments({ role: 'organizer' });
    const totalEvents = await Event.countDocuments();
    const pendingEvents = await Event.countDocuments({ status: 'PENDING_APPROVAL' });
    const totalRegistrations = await Registration.countDocuments();
    const totalAttendance = await Attendance.countDocuments();

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalStudents,
        totalOrganizers,
        totalEvents,
        pendingEvents,
        totalRegistrations,
        totalAttendance
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching admin dashboard stats.' });
  }
};

exports.getPendingEvents = async (req, res) => {
  try {
    const pendingEvents = await Event.find({ status: 'PENDING_APPROVAL' }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: pendingEvents.length, events: pendingEvents });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching pending events.' });
  }
};

exports.approveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    event.status = 'APPROVED';
    event.rejectionReason = '';
    await event.save();

    if (event.organizerUser) {
      await createNotification(event.organizerUser, 'Event Approved', `Your event "${event.title}" has been approved by admin!`, 'ANNOUNCEMENT');
    }

    res.status(200).json({ success: true, message: 'Event approved successfully.', event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error approving event.' });
  }
};

exports.rejectEvent = async (req, res) => {
  try {
    const { reason } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    event.status = 'REJECTED';
    event.rejectionReason = reason || 'Does not meet college guidelines.';
    await event.save();

    if (event.organizerUser) {
      await createNotification(event.organizerUser, 'Event Rejected', `Your event "${event.title}" was rejected. Reason: ${event.rejectionReason}`, 'ANNOUNCEMENT');
    }

    res.status(200).json({ success: true, message: 'Event rejected.', event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error rejecting event.' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching users.' });
  }
};

exports.toggleSuspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.isSuspended = !user.isSuspended;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isSuspended ? 'suspended' : 'unsuspended'} successfully.`,
      isSuspended: user.isSuspended
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error toggling user suspension.' });
  }
};

exports.createOrganizer = async (req, res) => {
  try {
    const { name, email, password, department } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const organizer = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'organizer',
      department: department || 'Computer Science'
    });

    res.status(201).json({
      success: true,
      message: 'New Organizer account created successfully!',
      user: {
        id: organizer._id,
        name: organizer.name,
        email: organizer.email,
        role: organizer.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Error creating organizer account.' });
  }
};

exports.changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'organizer', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified.' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, message: `User role updated to ${role} successfully.`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating user role.' });
  }
};
