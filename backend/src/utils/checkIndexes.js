const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const checkAndDropIndexes = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);

    console.log('[Mongo] Connected to:', mongoose.connection.name);

    const db = mongoose.connection.db;

    const userIndexes = await db.collection('users').indexes();
    console.log('\n=== USERS INDEXES ===');
    console.log(userIndexes);

    const companyIndexes = await db.collection('companies').indexes();
    console.log('\n=== COMPANIES INDEXES ===');
    console.log(companyIndexes);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkAndDropIndexes();
