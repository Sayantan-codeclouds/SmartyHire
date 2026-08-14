const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Company = require('../models/Company');

const testReg = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);

    const email = 'sayantan.das@codeclouds.com';
    const existing = await User.findOne({ email });

    if (existing) {
      console.log(`[Found] User already registered: ${existing.email}`);
    } else {
      console.log(`[Ready] Email ${email} is available for registration!`);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

testReg();
