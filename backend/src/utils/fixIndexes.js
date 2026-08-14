const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const fixIndexes = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);

    console.log('[Mongo] Connected to:', mongoose.connection.name);
    const db = mongoose.connection.db;

    try {
      await db.collection('companies').dropIndex('email_1');
      console.log('[Success] Successfully dropped invalid index "email_1" from companies collection!');
    } catch (err) {
      console.log('[Notice]', err.message);
    }

    const updatedCompanyIndexes = await db.collection('companies').indexes();
    console.log('\n=== UPDATED COMPANIES INDEXES ===');
    console.log(updatedCompanyIndexes);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

fixIndexes();
