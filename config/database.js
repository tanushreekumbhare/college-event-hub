const mongoose = require('mongoose');

let isConnected = false;

const DEFAULT_URI = 'mongodb+srv://tanushreekumbhare11_db_user:LAUOMNrXqnGuwTaJ@cluster0.bvf4swb.mongodb.net/college_event_hub?retryWrites=true&w=majority';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI !== undefined ? process.env.MONGODB_URI : DEFAULT_URI;

  if (!uri || uri === 'none' || uri === '') {
    console.warn('\n=============================================================');
    console.warn('[College Event Hub] WARNING: MONGODB_URI is empty or disabled.');
    console.warn('=============================================================\n');
    isConnected = false;
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
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
