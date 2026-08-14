const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    publicId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Interview title is required'],
      trim: true,
    },
    jobRole: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      default: 'Engineering',
    },
    experience: {
      type: String,
      default: '1-3 years',
    },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
      default: 'Full-time',
    },
    salaryRange: {
      type: String,
      default: '$80,000 - $120,000',
    },
    durationMinutes: {
      type: Number,
      default: 30,
    },
    difficulty: {
      type: String,
      enum: ['Junior', 'Mid-Level', 'Senior', 'Lead/Architect'],
      default: 'Mid-Level',
    },
    skillsRequired: [
      {
        type: String,
        trim: true,
      },
    ],
    jobDescription: {
      type: String,
      required: true,
    },
    instructions: {
      type: String,
      default: 'Please answer clearly into your microphone. Keep response concise.',
    },
    aiConfig: {
      personality: {
        type: String,
        enum: ['Professional & Friendly', 'Strict Technical Architect', 'Behavioral HR Specialist', 'Fast-Paced Startup Founder'],
        default: 'Professional & Friendly',
      },
      voice: {
        type: String,
        default: 'alloy',
      },
      language: {
        type: String,
        default: 'en-US',
      },
      questionCount: {
        type: Number,
        default: 5,
      },
      passingScore: {
        type: Number,
        default: 70,
      },
    },
    proctoring: {
      cameraRequired: { type: Boolean, default: true },
      microphoneRequired: { type: Boolean, default: true },
      tabSwitchDetection: { type: Boolean, default: true },
      fullscreenRequired: { type: Boolean, default: true },
      maxViolationsAllowed: { type: Number, default: 3 },
    },
    rounds: {
      enableCodingRound: { type: Boolean, default: true },
      enableMCQRound: { type: Boolean, default: true },
      enableHRRound: { type: Boolean, default: true },
      enableAptitudeRound: { type: Boolean, default: true },
    },
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Archived', 'Deleted'],
      default: 'Published',
    },
    candidatesCount: {
      type: Number,
      default: 0,
    },
    completedCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Interview', interviewSchema);
