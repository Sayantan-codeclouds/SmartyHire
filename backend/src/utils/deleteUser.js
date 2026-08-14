const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Company = require('../models/Company');

const emailToDelete = process.argv[2] || 'sayantan.das@codeclouds.com';

const deleteUserByEmail = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log(`[Mongo] Connected to ${mongoose.connection.name}`);

    const user = await User.findOne({ email: emailToDelete });
    if (!user) {
      console.log(`[Result] No user found with email: ${emailToDelete}`);
      process.exit(0);
    }

    // Delete associated company workspace if created
    if (user.companyId) {
      await Company.findByIdAndDelete(user.companyId);
      console.log(`[Deleted] Associated Company Workspace ID: ${user.companyId}`);
    }

    await User.findByIdAndDelete(user._id);
    console.log(`[Success] Deleted user account: ${emailToDelete}`);

    process.exit(0);
  } catch (err) {
    console.error('[Delete Error]', err.message);
    process.exit(1);
  }
};

deleteUserByEmail();
