/**
 * seedAdmin.js — Script to seed Super Admin user + ensure demo credentials work:
 * - Company Admin: admin@acme.com / password123
 * - Super Admin: admin@smartyhire.com / Admin@123456
 * - Seed 3 Plans: Free (₹0), Starter (₹499), Pro (₹1,199)
 *
 * Run with: node src/scripts/seedAdmin.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const User = require('../models/User');
const Plan = require('../models/Plan');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI not found in .env');
    process.exit(1);
  }
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');
};

const seed = async () => {
  await connectDB();

  // --- Seed / Reset Super Admin User ---
  let admin = await User.findOne({ email: 'admin@smartyhire.com' });
  if (!admin) {
    admin = await User.create({
      name: 'Super Admin',
      email: 'admin@smartyhire.com',
      password: 'Admin@123456',
      role: 'Super Admin',
      isVerified: true,
    });
    console.log(`✅ Super Admin created: ${admin.email} / password: Admin@123456`);
  } else {
    admin.password = 'Admin@123456';
    admin.role = 'Super Admin';
    admin.isSuspended = false;
    await admin.save();
    console.log(`✅ Super Admin updated: ${admin.email} / password: Admin@123456`);
  }

  // --- Seed / Reset Acme Company Admin ---
  let acmeUser = await User.findOne({ email: 'admin@acme.com' });
  if (acmeUser) {
    acmeUser.password = 'password123';
    acmeUser.isSuspended = false;
    await acmeUser.save();
    console.log(`✅ Demo Company Admin updated: admin@acme.com / password: password123`);
  }

  // --- Seed 3 Default Plans: Free (₹0), Starter (₹499), Pro (₹1,199) ---
  await Plan.deleteMany({});
  console.log('🧹 Re-seeding Plan Collection...');

  const plans = await Plan.insertMany([
    {
      name: 'Free',
      price: 0,
      interviewQuota: 10,
      billingCycle: 'monthly',
      isPopular: false,
      sortOrder: 1,
      isActive: true,
      features: [
        '10 AI Candidate Interviews/mo',
        'Standard Groq AI Question Generator',
        'Basic Evaluation Scorecard',
        'Community & Self-Service Support',
      ],
    },
    {
      name: 'Starter',
      price: 499,
      interviewQuota: 50,
      billingCycle: 'monthly',
      isPopular: false,
      sortOrder: 2,
      isActive: true,
      features: [
        '50 AI Candidate Interviews/mo',
        'Webcam & Mic Proctoring Alert Logs',
        'Full PDF Candidate Scorecards & Analytics',
        'Developer API Key & ATS Integration',
        'Standard Email Support',
      ],
    },
    {
      name: 'Pro',
      price: 1199,
      interviewQuota: 250,
      billingCycle: 'monthly',
      isPopular: true,
      sortOrder: 3,
      isActive: true,
      features: [
        '250 AI Candidate Interviews/mo',
        'Advanced Live Proctoring & Real-time Alerts',
        'Knowledge Vault RAG (Upload Custom Policies)',
        'Live Candidate Session Monitoring Dashboard',
        'Priority Technical Support',
      ],
    },
  ]);

  console.log(`✅ Successfully seeded ${plans.length} plans:`);
  plans.forEach((p) => console.log(`   - ${p.name}: ₹${p.price}/mo (${p.interviewQuota} interviews/mo)`));

  await mongoose.disconnect();
  console.log('✅ Done. Disconnected from MongoDB.');
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
