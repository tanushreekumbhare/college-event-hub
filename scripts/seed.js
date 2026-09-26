require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const Feedback = require('../models/Feedback');
const Notification = require('../models/Notification');
const Club = require('../models/Club');
const Venue = require('../models/Venue');
const Category = require('../models/Category');

const seedData = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not found in environment.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB Atlas for Seeding...');

    // Clear existing collections
    await User.deleteMany({});
    await Event.deleteMany({});
    await Registration.deleteMany({});
    await Attendance.deleteMany({});
    await Feedback.deleteMany({});
    await Notification.deleteMany({});
    await Club.deleteMany({});
    await Venue.deleteMany({});
    await Category.deleteMany({});

    console.log('Cleared previous database collections.');

    // Passwords
    const adminPassword = await bcrypt.hash('AdminPassword2026!', 10);
    const orgPassword = await bcrypt.hash('OrganizerPassword2026!', 10);
    const studentPassword = await bcrypt.hash('StudentPassword2026!', 10);

    // 1. Create Admin
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@college.edu',
      password: adminPassword,
      role: 'admin',
      department: 'Administration'
    });

    // 2. Create 3 Organizers
    const orgs = await User.create([
      { name: 'Alice CodeClub Lead', email: 'organizer@college.edu', password: orgPassword, role: 'organizer', department: 'Computer Science' },
      { name: 'Bob Robotics Lead', email: 'robotics@college.edu', password: orgPassword, role: 'organizer', department: 'Robotics' },
      { name: 'Carol Cultural Lead', email: 'cultural@college.edu', password: orgPassword, role: 'organizer', department: 'Fine Arts' }
    ]);

    // 3. Create 20 Students
    const studentDocs = [
      { name: 'Demo Student', email: 'student@college.edu', password: studentPassword, role: 'student', studentId: 'STU-000', participationPoints: 50 }
    ];
    for (let i = 1; i <= 19; i++) {
      studentDocs.push({
        name: `Student User ${i}`,
        email: `student${i}@college.edu`,
        password: studentPassword,
        role: 'student',
        studentId: `STU-00${i}`,
        department: i % 2 === 0 ? 'Computer Science' : 'Information Technology',
        year: `${(i % 4) + 1}st Year`,
        participationPoints: i * 10
      });
    }
    const students = await User.create(studentDocs);

    // 4. Create Clubs, Venues, Categories
    await Category.create([
      { name: 'Technical', description: 'Tech talks and workshops' },
      { name: 'Cultural', description: 'Dance, music, and art fests' },
      { name: 'Sports', description: 'Inter-college tournaments' },
      { name: 'Workshop', description: 'Hands-on learning sessions' },
      { name: 'Hackathon', description: '24-hour coding marathons' }
    ]);

    await Venue.create([
      { name: 'Main Auditorium', location: 'Block A, 1st Floor', capacity: 500 },
      { name: 'CS Lab 3', location: 'IT Building, 2nd Floor', capacity: 60 },
      { name: 'Sports Complex Ground', location: 'Campus East Wing', capacity: 1000 }
    ]);

    await Club.create([
      { name: 'Code Club', code: 'CC', leadName: 'Alice CodeClub Lead', leadEmail: 'organizer@college.edu' },
      { name: 'Robotics Society', code: 'RS', leadName: 'Bob Robotics Lead', leadEmail: 'robotics@college.edu' },
      { name: 'Cultural Committee', code: 'CCM', leadName: 'Carol Cultural Lead', leadEmail: 'cultural@college.edu' }
    ]);

    // 5. Create 10 Events
    const events = await Event.create([
      {
        title: 'Full Stack Cloud Computing Workshop',
        description: 'Hands-on training building scalable web apps with Node.js and MongoDB Atlas Cloud.',
        category: 'Workshop',
        date: '2026-10-15',
        time: '10:00 AM',
        venue: 'CS Lab 3',
        organizer: 'Code Club',
        organizerUser: orgs[0]._id,
        maxParticipants: 60,
        status: 'APPROVED',
        imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: '24-Hour Campus Hackathon 2026',
        description: 'Build innovative AI & Cloud solutions to win prizes up to $5000.',
        category: 'Hackathon',
        date: '2026-11-01',
        time: '09:00 AM',
        venue: 'Main Auditorium',
        organizer: 'Code Club',
        organizerUser: orgs[0]._id,
        maxParticipants: 200,
        status: 'APPROVED',
        imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Annual Cultural Fest: Harmony 2026',
        description: 'Campus music concert, dance competitions, and food stalls.',
        category: 'Cultural',
        date: '2026-12-10',
        time: '04:00 PM',
        venue: 'Sports Complex Ground',
        organizer: 'Cultural Committee',
        organizerUser: orgs[2]._id,
        maxParticipants: 1000,
        status: 'APPROVED',
        imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80'
      },
      {
        title: 'Robotics Autonomous Line Follower',
        description: 'Design and race custom micro-controller robots on our obstacle course.',
        category: 'Technical',
        date: '2026-10-20',
        time: '02:00 PM',
        venue: 'CS Lab 3',
        organizer: 'Robotics Society',
        organizerUser: orgs[1]._id,
        maxParticipants: 40,
        status: 'APPROVED'
      },
      {
        title: 'Inter-College Basketball Championship',
        description: 'Annual basketball tournament with 16 participating colleges.',
        category: 'Sports',
        date: '2026-10-25',
        time: '08:00 AM',
        venue: 'Sports Complex Ground',
        organizer: 'Cultural Committee',
        organizerUser: orgs[2]._id,
        maxParticipants: 300,
        status: 'APPROVED'
      },
      {
        title: 'Cybersecurity & Ethical Hacking Seminar',
        description: 'Learn modern network defense, vulnerability assessment, and threat hunting.',
        category: 'Seminar',
        date: '2026-11-15',
        time: '11:00 AM',
        venue: 'Main Auditorium',
        organizer: 'Code Club',
        organizerUser: orgs[0]._id,
        maxParticipants: 150,
        status: 'APPROVED'
      },
      {
        title: 'AI & Large Language Models Deep Dive',
        description: 'Understanding neural network architectures, prompt engineering, and fine-tuning.',
        category: 'Workshop',
        date: '2026-11-20',
        time: '01:00 PM',
        venue: 'CS Lab 3',
        organizer: 'Code Club',
        organizerUser: orgs[0]._id,
        maxParticipants: 50,
        status: 'APPROVED'
      },
      {
        title: 'Photography & Digital Media Expo',
        description: 'Exhibition showcasing creative student photography and video edits.',
        category: 'Club Activity',
        date: '2026-11-28',
        time: '03:00 PM',
        venue: 'Main Auditorium',
        organizer: 'Cultural Committee',
        organizerUser: orgs[2]._id,
        maxParticipants: 200,
        status: 'PENDING_APPROVAL'
      },
      {
        title: 'Web3 & Decentralized Apps Bootcamp',
        description: 'Introduction to smart contracts and blockchain technology.',
        category: 'Technical',
        date: '2026-12-05',
        time: '10:00 AM',
        venue: 'CS Lab 3',
        organizer: 'Code Club',
        organizerUser: orgs[0]._id,
        maxParticipants: 45,
        status: 'PENDING_APPROVAL'
      },
      {
        title: 'Esports Gaming Tournament: Valorant',
        description: '5v5 Valorant campus championship with live commentary streaming.',
        category: 'Competition',
        date: '2026-12-18',
        time: '05:00 PM',
        venue: 'Main Auditorium',
        organizer: 'Code Club',
        organizerUser: orgs[0]._id,
        maxParticipants: 100,
        status: 'APPROVED'
      }
    ]);

    // 6. Create Registrations, Attendance, Feedback
    const reg1 = await Registration.create({ student: students[0]._id, event: events[0]._id, attended: true, attendedAt: new Date() });
    const reg2 = await Registration.create({ student: students[0]._id, event: events[1]._id, attended: false });
    const reg3 = await Registration.create({ student: students[1]._id, event: events[0]._id, attended: true, attendedAt: new Date() });

    await Attendance.create({ registration: reg1._id, student: students[0]._id, event: events[0]._id, markedBy: admin._id, status: 'PRESENT' });
    await Attendance.create({ registration: reg3._id, student: students[1]._id, event: events[0]._id, markedBy: admin._id, status: 'PRESENT' });

    await Feedback.create({ student: students[0]._id, event: events[0]._id, rating: 5, comment: 'Fantastic hands-on MongoDB Atlas Cloud session!' });
    await Feedback.create({ student: students[1]._id, event: events[0]._id, rating: 4, comment: 'Great presentation and clear code examples.' });

    await Notification.create({
      user: students[0]._id,
      title: 'Registration Confirmed',
      message: 'You have successfully registered for Full Stack Cloud Computing Workshop.',
      type: 'REGISTRATION'
    });

    console.log('\n=============================================================');
    console.log('✅ SEED COMPLETED SUCCESSFULLY!');
    console.log('Demo Accounts Created:');
    console.log('  Admin:     admin@college.edu / AdminPassword2026!');
    console.log('  Organizer: organizer@college.edu / OrganizerPassword2026!');
    console.log('  Student:   student@college.edu / StudentPassword2026!');
    console.log('=============================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Seed script error:', err);
    process.exit(1);
  }
};

seedData();
