const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Company = require('../models/Company');

const cleanTest = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log(`[Mongo] Connected to database: ${mongoose.connection.name}`);

    // Remove any user other than admin@acme.com
    const delUsers = await User.deleteMany({ email: { $ne: 'admin@acme.com' } });
    console.log(`[Clean] Deleted ${delUsers.deletedCount} test user(s).`);

    // Remove any company other than acme-corp
    const delCompanies = await Company.deleteMany({ slug: { $ne: 'acme-corp' } });
    console.log(`[Clean] Deleted ${delCompanies.deletedCount} test company workspace(s).`);

    console.log('[Success] Database cleaned. You can now register any email address.');
    process.exit(0);
  } catch (err) {
    console.error('[Clean Error]', err.message);
    process.exit(1);
  }
};

cleanTest();
