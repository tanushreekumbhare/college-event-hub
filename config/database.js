const mongoose = require('mongoose');

let isConnected = false;

const DEFAULT_URI = 'mongodb+srv://tanushreekumbhare11_db_user:LAUOMNrXqnGuwTaJ@cluster0.bvf4swb.mongodb.net/college_event_hub?retryWrites=true&w=majority';

const connectDB = async () => {
  let uri = process.env.MONGODB_URI;

  if (uri === 'OFFLINE_TEST_MODE') {
    isConnected = false;
    return false;
  }

  // Use DEFAULT_URI if MONGODB_URI is missing, invalid, empty, or points to old cluster
  if (!uri || uri.trim() === '' || uri.includes('tkumbhare76') || uri.includes('<username>')) {
    uri = DEFAULT_URI;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000
    });
    isConnected = true;
    console.log(`[College Event Hub] MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.error('\n=============================================================');
    console.error('[College Event Hub] ERROR: MongoDB Connection Failed');
    console.error(`[College Event Hub] Reason: ${error.message}`);
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
