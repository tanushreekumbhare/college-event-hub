require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const { connectDB, checkDBStatus } = require('./config/database');

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const clubRoutes = require('./routes/clubRoutes');
const venueRoutes = require('./routes/venueRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();

// Enable trust proxy for Google App Engine HTTPS reverse proxy
app.set('trust proxy', 1);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'college_event_hub_fallback_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to false so local development and App Engine standard work smoothly
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    }
  })
);

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/categories', categoryRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    databaseConnected: checkDBStatus(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found.'
  });
});

// Catch-all route to serve index.html for unknown frontend routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred.'
  });
});

// Server Initialization
const PORT = process.env.PORT || 8080;

const startServer = async () => {
  // Connect to MongoDB Atlas
  await connectDB();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n=============================================================`);
    console.log(`[College Event Hub] Server is running successfully!`);
    console.log(`[College Event Hub] Local URL: http://localhost:${PORT}`);
    console.log(`[College Event Hub] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[College Event Hub] Ready for Google App Engine standard environment`);
    console.log(`=============================================================\n`);
  });
};

if (require.main === module) {
  startServer();
}

module.exports = app;

