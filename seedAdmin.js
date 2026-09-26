require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const seedAdmin = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('[Admin Seed] Error: MONGODB_URI is not set. Please set it in your .env file.');
    process.exit(1);
  }

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@college.edu').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'Campus Administrator';

  if (!adminPassword) {
    console.error('\n=============================================================');
    console.error('[Admin Seed] Error: ADMIN_PASSWORD is required in environment variables!');
    console.error('Please run with an environment variable or define it in your .env file:');
    console.error('  Example: ADMIN_PASSWORD="MySecureAdminPass123!" npm run seed:admin');
    console.error('=============================================================\n');
    process.exit(1);
  }

  if (adminPassword.length < 6) {
    console.error('[Admin Seed] Error: ADMIN_PASSWORD must be at least 6 characters.');
    process.exit(1);
  }

  try {
    console.log('[Admin Seed] Connecting to MongoDB Atlas...');
    await mongoose.connect(uri);

    const existingAdmin = await User.findOne({ email: adminEmail });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    if (existingAdmin) {
      existingAdmin.name = adminName;
      existingAdmin.password = hashedPassword;
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log(`[Admin Seed] Existing user '${adminEmail}' successfully updated with ADMIN role and new password.`);
    } else {
      const newAdmin = new User({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });
      await newAdmin.save();
      console.log(`[Admin Seed] New Admin account successfully created for: ${adminEmail}`);
    }

    console.log('[Admin Seed] Done! You can now log in at /login.html with:');
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Role:  admin`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Admin Seed] Failed to seed admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();
