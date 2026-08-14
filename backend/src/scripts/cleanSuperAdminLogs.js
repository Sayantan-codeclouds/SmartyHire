const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const AuditLog = require('../models/AuditLog');

const cleanLogs = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI not found in .env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  const res = await AuditLog.deleteMany({
    $or: [
      { userRole: 'Super Admin' },
      { userName: 'Super Admin' },
    ],
  });

  console.log(`✅ Deleted ${res.deletedCount} Super Admin audit logs from MongoDB.`);

  await mongoose.disconnect();
  process.exit(0);
};

cleanLogs().catch((err) => {
  console.error('❌ Error cleaning logs:', err);
  process.exit(1);
});
