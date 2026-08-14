const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
      index: true,
    },
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: false,
      default: null,
    },
    questionTitle: String,
    questionText: String,
    answerText: {
      type: String,
      default: '',
    },
    audioUrl: {
      type: String,
      default: '',
    },
    codeSubmitted: {
      type: String,
      default: '',
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: 0,
    },
    sentiment: {
      type: String,
      enum: ['Confident', 'Neutral', 'Hesitant', 'Nervous'],
      default: 'Confident',
    },
    aiFeedback: {
      type: String,
      default: '',
    },
    followUpQuestionsAsked: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Response', responseSchema);
