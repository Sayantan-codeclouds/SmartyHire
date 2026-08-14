const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
      unique: true,
      index: true,
    },
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    recommendation: {
      type: String,
      enum: ['Hire', 'Maybe', 'Reject'],
      required: true,
    },
    scores: {
      communication: { type: Number, default: 0 },
      confidence: { type: Number, default: 0 },
      technicalKnowledge: { type: Number, default: 0 },
      problemSolving: { type: Number, default: 0 },
      leadership: { type: Number, default: 0 },
      grammar: { type: Number, default: 0 },
      fluency: { type: Number, default: 0 },
      bodyLanguage: { type: Number, default: 0 },
      sentiment: { type: Number, default: 0 },
      cultureFit: { type: Number, default: 0 },
    },
    strengths: [String],
    weaknesses: [String],
    improvementAreas: [String],
    aiSummaryExplanation: {
      type: String,
      required: true,
    },
    questionBreakdown: [
      {
        questionTitle: String,
        questionType: String,
        score: Number,
        candidateAnswer: String,
        feedback: String,
      },
    ],
    proctoringReport: {
      totalViolations: { type: Number, default: 0 },
      trustScore: { type: Number, default: 100 },
      flaggedBehavior: [String],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
