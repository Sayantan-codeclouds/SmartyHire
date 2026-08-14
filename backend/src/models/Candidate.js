const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
      index: true,
    },
    candidateCode: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Candidate name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Candidate email is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: '',
    },
    resumeUrl: {
      type: String,
      default: '',
    },
    recordingUrl: {
      type: String,
      default: '',
    },
    linkedIn: {
      type: String,
      default: '',
    },
    portfolio: {
      type: String,
      default: '',
    },
    assignedQuestions: [
      {
        order: Number,
        type: { type: String },
        title: String,
        questionText: String,
        difficulty: String,
        competency: String,
        timeLimitSeconds: { type: Number, default: 180 },
        expectedAnswerKeyPoints: [String],
      },
    ],
    systemCheck: {
      cameraPassed: { type: Boolean, default: false },
      micPassed: { type: Boolean, default: false },
      speakerPassed: { type: Boolean, default: false },
      internetSpeedMbps: { type: Number, default: 0 },
      browserCompatibility: { type: Boolean, default: true },
      consentGiven: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ['Applied', 'Interview Scheduled', 'Interviewed', 'Selected', 'Rejected', 'Offer Sent', 'Joined'],
      default: 'Applied',
    },
    interviewState: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed', 'Terminated'],
      default: 'Not Started',
    },
    isExpired: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 48 * 60 * 60 * 1000), // Valid for 48 Hours
    },
    startedAt: Date,
    completedAt: Date,
    overallScore: {
      type: Number,
      default: 0,
    },
    recommendation: {
      type: String,
      enum: ['Hire', 'Maybe', 'Reject', 'Pending'],
      default: 'Pending',
    },
    violationsCount: {
      type: Number,
      default: 0,
    },
    notes: [
      {
        author: String,
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Candidate', candidateSchema);
