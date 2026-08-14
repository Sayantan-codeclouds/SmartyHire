const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Company = require('../models/Company');

const listAll = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);

    const users = await User.find({});
    const companies = await Company.find({});

    console.log('=== USERS IN MONGO ATLAS ===');
    users.forEach((u) => console.log(`- Name: ${u.name} | Email: ${u.email} | Role: ${u.role}`));

    console.log('\n=== COMPANIES IN MONGO ATLAS ===');
    companies.forEach((c) => console.log(`- Name: ${c.name} | Slug: ${c.slug}`));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

listAll();
