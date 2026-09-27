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
    
    // Auto-seed default admin account if not existing
    try {
      const User = require('../models/User');
      const bcrypt = require('bcryptjs');
      const adminEmail = (process.env.ADMIN_EMAIL || 'admin@college.edu').toLowerCase().trim();
      const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword2026!';
      const adminName = process.env.ADMIN_NAME || 'System Administrator';

      const existingAdmin = await User.findOne({ email: adminEmail });
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      if (!existingAdmin) {
        const newAdmin = new User({
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          role: 'admin'
        });
        await newAdmin.save();
        console.log(`[College Event Hub] Default admin user auto-seeded: ${adminEmail}`);
      } else {
        existingAdmin.name = adminName;
        existingAdmin.password = hashedPassword;
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log(`[College Event Hub] Admin user password & role synced: ${adminEmail}`);
      }
    } catch (seedErr) {
      console.error('[College Event Hub] Auto-seed admin error:', seedErr.message);
    }

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
