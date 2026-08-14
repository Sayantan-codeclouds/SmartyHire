const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: false,
      default: null,
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    order: {
      type: Number,
      default: 1,
    },
    type: {
      type: String,
      enum: ['Technical', 'Behavioral', 'HR', 'Coding', 'Scenario', 'Aptitude', 'Follow-up', 'Candidate-Q&A'],
      default: 'Technical',
    },
    title: {
      type: String,
      required: true,
    },
    questionText: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['Junior', 'Mid-Level', 'Senior', 'Lead', 'General'],
      default: 'Mid-Level',
    },
    competency: {
      type: String,
      default: 'Problem Solving',
    },
    timeLimitSeconds: {
      type: Number,
      default: 180,
    },
    mcqOptions: [
      {
        optionText: String,
        isCorrect: Boolean,
      },
    ],
    starterCode: {
      type: String,
      default: '',
    },
    expectedAnswerKeyPoints: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Question', questionSchema);
