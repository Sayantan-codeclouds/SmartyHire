const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    logoUrl: {
      type: String,
      default: '',
    },
    brandColor: {
      type: String,
      default: '#6366F1', // Primary indigo accent
    },
    website: {
      type: String,
      default: '',
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    language: {
      type: String,
      default: 'en',
    },
    subscription: {
      plan: {
        type: String,
        enum: ['Free', 'Starter', 'Pro', 'Professional', 'Enterprise'],
        default: 'Free',
      },
      status: {
        type: String,
        enum: ['active', 'canceled', 'past_due', 'trialing'],
        default: 'active',
      },
      razorpayCustomerId: { type: String, default: '' },
      lastPaymentId: { type: String, default: '' },
      monthlyInterviewQuota: { type: Number, default: 10 },
      usedInterviewsThisMonth: { type: Number, default: 0 },
      subscriptionExpiresAt: { type: Date },
    },
    apiKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    settings: {
      defaultVoice: { type: String, default: 'alloy' },
      enableAutoEvaluation: { type: Boolean, default: true },
      enableEmailNotifications: { type: Boolean, default: true },
      proctoringStrictness: {
        type: String,
        enum: ['low', 'medium', 'high', 'strict'],
        default: 'high',
      },
      // Cooldown window preventing the same email from re-applying to the same interview link
      candidateCooldownMonths: { type: Number, default: 3, min: 1, max: 12 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', companySchema);
