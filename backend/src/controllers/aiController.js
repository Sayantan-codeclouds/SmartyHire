const mongoose = require('mongoose');
const Candidate = require('../models/Candidate');
const Interview = require('../models/Interview');
const Response = require('../models/Response');
const Violation = require('../models/Violation');
const Report = require('../models/Report');
const Question = require('../models/Question');
const KnowledgeDocument = require('../models/KnowledgeDocument');
const { generateFollowUpQuestion, evaluateCandidateResponses, answerCandidateQuestionWithRAG } = require('../services/groqService');

// Generate Adaptive Follow-Up Question during Live Interview
const getFollowUpQuestion = async (req, res, next) => {
  try {
    const { questionText, candidateAnswer, jobTitle, expectedAnswerKeyPoints, candidateId } = req.body;

    let previousQAs = [];
    if (candidateId) {
      const pastResponses = await Response.find({ candidateId }).sort({ createdAt: 1 }).lean();
      previousQAs = pastResponses.map((r) => ({
        questionText: r.questionText || r.questionTitle,
        answerText: r.answerText,
      }));
    }

    const followUp = await generateFollowUpQuestion({
      questionText,
      candidateAnswer,
      jobTitle,
      expectedAnswerKeyPoints: expectedAnswerKeyPoints || [],
      previousQAs,
    });
    res.status(200).json({ success: true, followUpQuestion: followUp });
  } catch (error) {
    next(error);
  }
};

// Trigger AI Evaluation Scorecard for Candidate via Groq API
const evaluateCandidateSession = async (req, res, next) => {
  try {
    const { candidateId } = req.params;

    const candidate = await Candidate.findById(candidateId).populate('interviewId');
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    const responses = await Response.find({ candidateId });
    const violations = await Violation.find({ candidateId });

    // Call Groq Evaluation Engine with RAG key points from assigned questions
    const evalData = await evaluateCandidateResponses({
      candidateName: candidate.name,
      jobTitle: candidate.interviewId?.title || 'Engineer',
      responses,
      violations,
      assignedQuestions: candidate.assignedQuestions || [],
    });

    // Upsert Candidate Report
    let report = await Report.findOne({ candidateId });
    if (report) {
      Object.assign(report, evalData);
      await report.save();
    } else {
      report = await Report.create({
        candidateId,
        interviewId: candidate.interviewId._id,
        companyId: candidate.companyId,
        ...evalData,
        proctoringReport: {
          totalViolations: violations.length,
          trustScore: Math.max(0, 100 - violations.length * 10),
          flaggedBehavior: violations.map((v) => v.type),
        },
      });
    }

    // Update candidate stats
    candidate.overallScore = report.overallScore;
    candidate.recommendation = report.recommendation;
    candidate.violationsCount = violations.length;
    await candidate.save();

    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    next(error);
  }
};

// Handle Candidate's Q&A Question at the end of the interview using RAG from Knowledge Vault PDFs
const answerCandidateQA = async (req, res, next) => {
  try {
    const { candidateId, candidateQuestion } = req.body;
    const cleanInput = (candidateQuestion || '').trim().toLowerCase();

    // 1. Deterministic closing statement check BEFORE DB queries
    const isClosingInput =
      /^(no|nothing|none|nope|no thanks|no thank you|nothing else|that's all|thats all|i'm good|im good|done|that is all|all good|no more|no questions|finish|submit)$/i.test(cleanInput) ||
      cleanInput.includes('nothing else') ||
      cleanInput.includes('no more questions') ||
      cleanInput.includes('no thank you') ||
      cleanInput === 'no';

    if (isClosingInput) {
      return res.status(200).json({
        success: true,
        aiAnswer: "Thank you so much for taking the time to interview with our team today! Your responses have been recorded and submitted to our hiring team. We wish you the best of luck!",
        isClosing: true,
      });
    }

    // 2. Safely find candidate if valid ObjectId
    let candidate = null;
    if (candidateId && mongoose.Types.ObjectId.isValid(candidateId)) {
      candidate = await Candidate.findById(candidateId).populate('interviewId companyId');
    }

    const company = candidate?.companyId;
    const interview = candidate?.interviewId;
    const targetCompanyId = company?._id || candidate?.companyId;

    // Fetch PDF Knowledge Vault Documents for Company RAG safely
    let documentKnowledge = '';
    let bankQuestions = [];

    // Fetch documents matching target company or all uploaded knowledge vault documents
    let docs = [];
    if (targetCompanyId) {
      docs = await KnowledgeDocument.find({ companyId: targetCompanyId }).limit(10).lean();
    }
    if (!docs || docs.length === 0) {
      docs = await KnowledgeDocument.find({}).limit(10).lean();
    }

    if (docs && docs.length > 0) {
      documentKnowledge = docs
        .map((d) => `Document "${d.title}" [Category: ${d.category || 'Policy'}]:\n${d.extractedText || d.content || ''}`)
        .join('\n\n---\n\n');
    }

    if (targetCompanyId) {
      bankQuestions = await Question.find({ companyId: targetCompanyId }).limit(10).lean();
    }

    const qaResult = await answerCandidateQuestionWithRAG({
      candidateQuestion: candidateQuestion || 'Do you have details on the team structure and company culture?',
      companyName: company?.name || 'SmartyHire Workspace',
      jobTitle: interview?.title || 'Engineer',
      jobRole: interview?.jobRole,
      department: interview?.department,
      jobDescription: interview?.jobDescription,
      skillsRequired: interview?.skillsRequired || [],
      documentKnowledge,
      rawDocs: docs,
      bankQuestions,
    });

    return res.status(200).json({
      success: true,
      aiAnswer: typeof qaResult === 'string' ? qaResult : qaResult.aiAnswer,
      isClosing: typeof qaResult === 'string' ? false : qaResult.isClosing,
    });
  } catch (error) {
    console.error('[answerCandidateQA Error]', error);
    const cleanInput = (req.body.candidateQuestion || '').trim().toLowerCase();
    const isClosing =
      cleanInput.includes('no more questions') ||
      cleanInput.includes('nothing else') ||
      cleanInput.includes('no thank you') ||
      cleanInput === 'no';

    if (isClosing) {
      return res.status(200).json({
        success: true,
        aiAnswer: "Thank you so much for taking the time to interview with our team today! Your responses have been recorded and submitted to our hiring team. We wish you the best of luck!",
        isClosing: true,
      });
    }

    const topic = cleanInput;
    let dynamicMsg = "We currently can't provide this information. Would you like to know anything else about us or the role?";

    if (topic.includes('hour') || topic.includes('schedule') || topic.includes('time') || topic.includes('shift') || topic.includes('day')) {
      dynamicMsg = "Our standard workweek is Monday through Thursday, with 9 working hours per day (36 total working hours per week). Friday, Saturday, and Sunday are observed weekly off days. Would you like to know anything else about us or the role?";
    } else if (topic.includes('leave') || topic.includes('vacation') || topic.includes('earned leave') || topic.includes('el') || topic.includes('pto')) {
      dynamicMsg = "Employees are entitled to 18 Earned Leave (EL) days per calendar year. Would you like to know anything else about us or the role?";
    }

    return res.status(200).json({
      success: true,
      aiAnswer: dynamicMsg,
      isClosing: false,
    });
  }
};

module.exports = {
  getFollowUpQuestion,
  evaluateCandidateSession,
  answerCandidateQA,
};
