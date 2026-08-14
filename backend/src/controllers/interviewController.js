const Interview = require('../models/Interview');
const Question = require('../models/Question');
const Candidate = require('../models/Candidate');
const { generateQuestionsWithRAG } = require('../services/groqService');
const { sendInterviewInviteEmail } = require('../services/emailService');
const { v4: uuidv4 } = require('uuid');
const logAuditAction = require('../utils/auditLogger');

// Create New Interview & Trigger AI Question Generation via Groq
const createInterview = async (req, res, next) => {
  try {
    const {
      title,
      jobRole,
      department,
      experience,
      employmentType,
      salaryRange,
      durationMinutes,
      difficulty,
      skillsRequired,
      jobDescription,
      instructions,
      aiConfig,
      proctoring,
      rounds,
    } = req.body;

    const targetQuestionCount = Number(aiConfig?.questionCount) || 6;
    const targetDurationMinutes = Number(durationMinutes) || 30;

    // Generate a unique public ID for the interview link
    const publicId = uuidv4();

    const interview = await Interview.create({
      companyId: req.companyId,
      createdBy: req.user.id,
      publicId,
      title,
      jobRole,
      department,
      experience,
      employmentType,
      salaryRange,
      durationMinutes: targetDurationMinutes,
      difficulty,
      skillsRequired: Array.isArray(skillsRequired)
        ? skillsRequired
        : skillsRequired
        ? skillsRequired.split(',').map((s) => s.trim())
        : [],
      jobDescription,
      instructions,
      aiConfig: {
        ...aiConfig,
        questionCount: targetQuestionCount,
      },
      proctoring,
      rounds,
      status: 'Published',
    });

    // Fetch company Question Bank for RAG context (questions with no interview linked)
    const bankQuestions = await Question.find({ companyId: req.companyId, interviewId: null }).limit(20).lean();
    console.log(`[RAG] Using ${bankQuestions.length} question bank entries as context for interview blueprint generation.`);

    // Generate a pool of AI questions (2x requested question count) to give candidate sessions a rich pool to sample & adapt from!
    const poolCount = Math.max(targetQuestionCount * 2, 10);

    const generatedQuestions = await generateQuestionsWithRAG({
      jobTitle: jobRole,
      department,
      experience,
      skills: interview.skillsRequired,
      jobDescription,
      questionCount: poolCount,
      durationMinutes: targetDurationMinutes,
      bankQuestions,
    });

    const questionDocs = generatedQuestions.map((q, idx) => ({
      interviewId: interview._id,
      companyId: req.companyId,
      order: idx + 1,
      type: q.type || 'Technical',
      title: q.title || `Question ${idx + 1}`,
      questionText: q.questionText || q.question || 'Explain your technical approach.',
      difficulty: q.difficulty || difficulty || 'Mid-Level',
      competency: q.competency || 'Problem Solving',
      timeLimitSeconds: q.timeLimitSeconds || 180,
      expectedAnswerKeyPoints: q.expectedAnswerKeyPoints || [],
    }));

    await Question.insertMany(questionDocs);

    // Audit log interview creation
    await logAuditAction(
      req,
      'INTERVIEW_CREATED',
      'InterviewTemplate',
      `Created AI Interview "${title}" (${jobRole}, ${questionDocs.length} AI questions generated)`,
      { entityId: interview._id }
    );

    res.status(201).json({
      success: true,
      interview,
      questionsGenerated: questionDocs.length,
    });
  } catch (error) {
    next(error);
  }
};

// Send Direct Candidate Invitation Email via Resend
const sendCandidateInvite = async (req, res, next) => {
  try {
    const { candidateName, candidateEmail } = req.body;

    if (!candidateEmail) {
      return res.status(400).json({ success: false, message: 'Please provide a valid candidate email address.' });
    }

    const interview = await Interview.findOne({ _id: req.params.id, companyId: req.companyId }).populate('companyId', 'name');
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview template not found.' });
    }

    const cleanEmail = candidateEmail.toLowerCase().trim();
    let candidate = await Candidate.findOne({ interviewId: interview._id, email: cleanEmail });

    if (candidate) {
      if (candidateName) candidate.name = candidateName;
      candidate.status = 'Interview Scheduled';
      candidate.isExpired = false;
      candidate.expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
      await candidate.save();
    } else {
      const candidateCode = 'CAN-' + Math.floor(100000 + Math.random() * 900000);
      candidate = await Candidate.create({
        interviewId: interview._id,
        companyId: req.companyId,
        name: candidateName || 'Invited Candidate',
        email: cleanEmail,
        candidateCode,
        status: 'Interview Scheduled',
        interviewState: 'Not Started',
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      });

      await Interview.findByIdAndUpdate(interview._id, { $inc: { candidatesCount: 1 } });
    }

    const companyName = interview.companyId?.name || 'Our Company';

    // Trigger Resend Email
    await sendInterviewInviteEmail(candidateName, candidateEmail, interview.title, companyName, interview.publicId);

    // Audit log candidate invitation
    await logAuditAction(
      req,
      'INVITATION_SENT',
      'CandidateInvite',
      `Sent AI Interview invitation to ${candidateName || 'Candidate'} (${candidateEmail}) for "${interview.title}"`,
      { entityId: candidate._id }
    );

    res.status(200).json({
      success: true,
      message: `Interview invitation sent to ${candidateEmail} via Resend!`,
      candidate,
    });
  } catch (error) {
    next(error);
  }
};

// Get All Workspace Interviews
const getInterviews = async (req, res, next) => {
  try {
    const interviews = await Interview.find({ companyId: req.companyId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: interviews.length, interviews });
  } catch (error) {
    next(error);
  }
};

// Get Single Interview Detail with Questions
const getInterviewById = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }
    const questions = await Question.find({ interviewId: interview._id }).sort({ order: 1 });
    res.status(200).json({ success: true, interview, questions });
  } catch (error) {
    next(error);
  }
};

// Get Public Interview Link Information (Used by Candidate Landing Page)
const getPublicInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({ publicId: req.params.publicId }).populate('companyId', 'name logoUrl brandColor');
    if (!interview || interview.status !== 'Published') {
      return res.status(404).json({ success: false, message: 'Interview link is invalid or expired' });
    }
    const questionsCount = await Question.countDocuments({ interviewId: interview._id });

    res.status(200).json({
      success: true,
      interview: {
        id: interview._id,
        publicId: interview.publicId,
        title: interview.title,
        jobRole: interview.jobRole,
        department: interview.department,
        experience: interview.experience,
        employmentType: interview.employmentType,
        durationMinutes: interview.durationMinutes,
        instructions: interview.instructions,
        proctoring: interview.proctoring,
        company: interview.companyId,
        questionCount: questionsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Toggle / Update Interview Status (Published, Archived, Draft)
const updateInterviewStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const interview = await Interview.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview template not found' });
    }

    interview.status = status || (interview.status === 'Published' ? 'Archived' : 'Published');
    await interview.save();

    res.status(200).json({
      success: true,
      message: `Interview template status updated to ${interview.status}`,
      interview,
    });
  } catch (error) {
    next(error);
  }
};

// Soft-Delete Interview Blueprint (Sets status to 'Deleted')
const deleteInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview template not found' });
    }

    interview.status = 'Deleted';
    await interview.save();

    res.status(200).json({
      success: true,
      message: 'Interview template moved to Trash (Deleted status)',
      interview,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInterview,
  sendCandidateInvite,
  getInterviews,
  getInterviewById,
  getPublicInterview,
  updateInterviewStatus,
  deleteInterview,
};
