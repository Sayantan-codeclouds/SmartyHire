/**
 * clearData.js — Script to safely clear all candidates, interviews, responses,
 * reports, violations, and interview-linked questions from MongoDB.
 *
 * Run with: node src/scripts/clearData.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const Candidate = require('../models/Candidate');
const Interview = require('../models/Interview');
const Response = require('../models/Response');
const Report = require('../models/Report');
const Violation = require('../models/Violation');
const Question = require('../models/Question');
const AuditLog = require('../models/AuditLog');

const clearDatabase = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI not found in .env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  console.log('🧹 Clearing Candidates, Interviews, Responses, Reports & Violations...');

  const candidatesDeleted = await Candidate.deleteMany({});
  console.log(`  - Deleted ${candidatesDeleted.deletedCount} Candidates`);

  const interviewsDeleted = await Interview.deleteMany({});
  console.log(`  - Deleted ${interviewsDeleted.deletedCount} Interviews`);

  const responsesDeleted = await Response.deleteMany({});
  console.log(`  - Deleted ${responsesDeleted.deletedCount} Candidate Responses`);

  const reportsDeleted = await Report.deleteMany({});
  console.log(`  - Deleted ${reportsDeleted.deletedCount} Candidate Reports`);

  const violationsDeleted = await Violation.deleteMany({});
  console.log(`  - Deleted ${violationsDeleted.deletedCount} Proctoring Violations`);

  // Delete questions linked to specific deleted interviews (keep general Question Bank blueprints with interviewId = null)
  const interviewQuestionsDeleted = await Question.deleteMany({ interviewId: { $ne: null } });
  console.log(`  - Deleted ${interviewQuestionsDeleted.deletedCount} Interview-linked Questions (Question Bank blueprints preserved)`);

  // Log Audit Action
  await AuditLog.create({
    companyId: new mongoose.Types.ObjectId(),
    userName: 'Database Cleanup Tool',
    userRole: 'Super Admin',
    action: 'DATABASE_CLEARED',
    entityType: 'SystemDatabase',
    details: `Cleared ${candidatesDeleted.deletedCount} candidates, ${interviewsDeleted.deletedCount} interviews, ${reportsDeleted.deletedCount} reports, and associated data.`,
    ipAddress: '127.0.0.1',
  }).catch(() => {});

  console.log('✅ Database cleanup completed successfully!');
  await mongoose.disconnect();
  process.exit(0);
};

clearDatabase().catch((err) => {
  console.error('❌ Cleanup failed:', err);
  process.exit(1);
});
