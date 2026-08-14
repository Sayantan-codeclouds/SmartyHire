const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const Candidate = require('../models/Candidate');

const cleanDuplicates = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI not found in .env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  const candidates = await Candidate.find().sort({ createdAt: -1 });
  const map = new Map();
  let deletedCount = 0;

  for (const c of candidates) {
    const key = `${c.interviewId.toString()}_${c.email.toLowerCase().trim()}`;
    if (map.has(key)) {
      const existing = map.get(key);
      // Decide which one to delete: keep the one that is Completed or has overallScore > 0 or has responses
      if (c.interviewState === 'Completed' || c.overallScore > 0) {
        // Delete existing unstarted record and keep this completed one
        console.log(`  - Deleting duplicate unstarted record ${existing.candidateCode} (${existing.name})`);
        await Candidate.findByIdAndDelete(existing._id);
        map.set(key, c);
        deletedCount++;
      } else {
        // Delete this duplicate unstarted record
        console.log(`  - Deleting duplicate unstarted record ${c.candidateCode} (${c.name})`);
        await Candidate.findByIdAndDelete(c._id);
        deletedCount++;
      }
    } else {
      map.set(key, c);
    }
  }

  console.log(`✅ Cleanup completed. Deleted ${deletedCount} duplicate candidate records.`);
  await mongoose.disconnect();
  process.exit(0);
};

cleanDuplicates().catch((err) => {
  console.error('❌ Error cleaning duplicates:', err);
  process.exit(1);
});
