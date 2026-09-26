const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('\n=============================================================');
    console.warn('[College Event Hub] WARNING: MONGODB_URI is not defined in environment variables.');
    console.warn('[College Event Hub] Please create a .env file with your MongoDB Atlas URI:');
    console.warn('  MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/college_events');
    console.warn('[College Event Hub] Server is running, but database features will return 503 until connected.');
    console.warn('=============================================================\n');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000 // 5 seconds timeout for fast feedback
    });
    isConnected = true;
    console.log(`[College Event Hub] MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.error('\n=============================================================');
    console.error('[College Event Hub] ERROR: MongoDB Connection Failed');
    console.error(`[College Event Hub] Reason: ${error.message}`);
    console.error('[College Event Hub] Common fixes:');
    console.error('  1. Check your Atlas username and password (special characters must be URL-encoded).');
    console.error('  2. In MongoDB Atlas Network Access, add IP: 0.0.0.0/0 (Allow access from anywhere).');
    console.error('=============================================================\n');
    return false;
  }
};

const checkDBStatus = () => {
  return mongoose.connection.readyState === 1;
};

module.exports = {
  connectDB,
  checkDBStatus
};
