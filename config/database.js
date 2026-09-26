const mongoose = require('mongoose');

let isConnected = false;

const DEFAULT_URI = 'mongodb+srv://tanushreekumbhare11_db_user:LAUOMNrXqnGuwTaJ@cluster0.bvf4swb.mongodb.net/college_event_hub?retryWrites=true&w=majority';

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return true;
  }

  let uri = process.env.MONGODB_URI;

  if (uri === 'OFFLINE_TEST_MODE') {
    isConnected = false;
    return false;
  }

  if (!uri || uri.trim() === '' || uri.includes('tkumbhare76') || uri.includes('<username>')) {
    uri = DEFAULT_URI;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      family: 4
    });
    isConnected = true;
    console.log(`[College Event Hub] MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    isConnected = false;
    console.error(`[College Event Hub] ERROR: MongoDB Connection Failed: ${error.message}`);
    return false;
  }
};

const checkDBStatus = () => {
  if (mongoose.connection.readyState === 0 && process.env.MONGODB_URI !== 'OFFLINE_TEST_MODE') {
    connectDB().catch(() => {});
  }
  return mongoose.connection.readyState === 1 || isConnected;
};

module.exports = {
  connectDB,
  checkDBStatus
};
