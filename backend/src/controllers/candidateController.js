const Candidate = require('../models/Candidate');
const Interview = require('../models/Interview');
const Question = require('../models/Question');
const Response = require('../models/Response');
const Report = require('../models/Report');
const Violation = require('../models/Violation');
const Company = require('../models/Company');
const { sendInterviewInviteEmail } = require('../services/emailService');
const { generateQuestionsWithRAG } = require('../services/groqService');
const logAuditAction = require('../utils/auditLogger');
const { v4: uuidv4 } = require('uuid');

/**
 * Returns the date after which a candidate's cooldown lifts, or null if no cooldown applies.
 *
 * Cooldown only applies to candidates who have COMPLETED the interview.
 * A candidate who was merely invited (status = 'Interview Scheduled') is never blocked —
 * they should be able to register and take the interview normally.
 *
 * The clock starts from `completedAt`, not `createdAt`, so the window is measured
 * from when the interview was actually finished, not when the invite was sent.
 *
 * @param {Object} candidate - Existing Candidate doc
 * @param {number} cooldownMonths - Cooldown period in months
 * @returns {Date|null}
 */
function getCooldownUnlockDate(candidate, cooldownMonths) {
  // Only enforce cooldown for genuinely completed sessions
  const hasCompleted =
    candidate.interviewState === 'Completed' || !!candidate.completedAt;
  if (!hasCompleted) return null;

  const cooldownMs = cooldownMonths * 30 * 24 * 60 * 60 * 1000; // approx months → ms
  const referenceDate = candidate.completedAt || candidate.createdAt;
  const unlocksAt = new Date(referenceDate.getTime() + cooldownMs);
  return unlocksAt > new Date() ? unlocksAt : null;
}

// Candidate Register via Public Link
const registerCandidate = async (req, res, next) => {
  try {
    const { publicId, name, email, phone, linkedIn, portfolio, systemCheck } = req.body;

    const interview = await Interview.findOne({ publicId }).populate('companyId');
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    // Fetch company cooldown setting (default 3 months)
    const company = await Company.findById(interview.companyId._id);
    const cooldownMonths = company?.settings?.candidateCooldownMonths ?? 3;

    const cleanEmail = (email || '').toLowerCase().trim();
    let candidate = await Candidate.findOne({ interviewId: interview._id, email: cleanEmail });

    // ── Cooldown Enforcement ──────────────────────────────────────────────────
    if (candidate) {
      const unlocksAt = getCooldownUnlockDate(candidate, cooldownMonths);
      if (unlocksAt) {
        const unlocksFormatted = unlocksAt.toLocaleDateString('en-IN', {
          day: 'numeric', month: 'long', year: 'numeric',
        });
        return res.status(429).json({
          success: false,
          isCooldown: true,
          message: `This email address has already been used for this interview. You may re-apply after ${unlocksFormatted}.`,
          unlocksAt: unlocksAt.toISOString(),
          cooldownMonths,
        });
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    if (candidate) {
      // Update existing invited candidate record
      if (name) candidate.name = name;
      if (phone) candidate.phone = phone;
      if (req.file) candidate.resumeUrl = `/uploads/${req.file.filename}`;
      if (linkedIn) candidate.linkedIn = linkedIn;
      if (portfolio) candidate.portfolio = portfolio;
      if (systemCheck) candidate.systemCheck = JSON.parse(systemCheck);
      candidate.status = 'Applied';
      candidate.isExpired = false;
      candidate.expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
      await candidate.save();
    } else {
      // Create new candidate record
      const candidateCode = 'CAN-' + uuidv4().substring(0, 6).toUpperCase();
      const resumeUrl = req.file ? `/uploads/${req.file.filename}` : '';
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

      candidate = await Candidate.create({
        companyId: interview.companyId._id,
        interviewId: interview._id,
        candidateCode,
        name,
        email: cleanEmail,
        phone,
        resumeUrl,
        linkedIn,
        portfolio,
        systemCheck: systemCheck ? JSON.parse(systemCheck) : { consentGiven: true },
        status: 'Applied',
        interviewState: 'Not Started',
        expiresAt,
      });

      await Interview.findByIdAndUpdate(interview._id, { $inc: { candidatesCount: 1 } });
    }

    res.status(201).json({
      success: true,
      candidateId: candidate._id,
      candidateCode: candidate.candidateCode,
      candidate,
    });
  } catch (error) {
    next(error);
  }
};

// Add Candidate & Send Resend Email Invite (Recruiter Action)
const addAndInviteCandidate = async (req, res, next) => {
  try {
    const { name, email, interviewId } = req.body;

    if (!name || !email || !interviewId) {
      return res.status(400).json({ success: false, message: 'Please provide candidate name, email, and select an interview.' });
    }

    const interview = await Interview.findOne({ _id: interviewId, companyId: req.companyId }).populate('companyId', 'name');
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Selected interview blueprint not found.' });
    }

    // Fetch company cooldown setting (default 3 months)
    const company = await Company.findById(req.companyId);
    const cooldownMonths = company?.settings?.candidateCooldownMonths ?? 3;

    const cleanEmail = email.toLowerCase().trim();
    let candidate = await Candidate.findOne({ interviewId: interview._id, email: cleanEmail });

    // ── Cooldown Enforcement ──────────────────────────────────────────────────
    if (candidate) {
      const unlocksAt = getCooldownUnlockDate(candidate, cooldownMonths);
      if (unlocksAt) {
        const unlocksFormatted = unlocksAt.toLocaleDateString('en-IN', {
          day: 'numeric', month: 'long', year: 'numeric',
        });
        return res.status(409).json({
          success: false,
          isCooldown: true,
          message: `${name} (${cleanEmail}) is in a ${cooldownMonths}-month re-application cooldown for this interview. Cooldown lifts on ${unlocksFormatted}.`,
          unlocksAt: unlocksAt.toISOString(),
          cooldownMonths,
        });
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    if (candidate) {
      if (name) candidate.name = name;
      candidate.status = 'Interview Scheduled';
      candidate.isExpired = false;
      candidate.expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
      await candidate.save();
    } else {
      const candidateCode = 'CAN-' + uuidv4().substring(0, 6).toUpperCase();
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

      candidate = await Candidate.create({
        companyId: req.companyId,
        interviewId: interview._id,
        candidateCode,
        name,
        email: cleanEmail,
        status: 'Interview Scheduled',
        interviewState: 'Not Started',
        expiresAt,
      });

      await Interview.findByIdAndUpdate(interview._id, { $inc: { candidatesCount: 1 } });
    }

    const companyName = interview.companyId?.name || 'Our Company';

    // Trigger Resend Email Invite
    await sendInterviewInviteEmail(name, cleanEmail, interview.title, companyName, interview.publicId);

    // Log Audit Event
    await logAuditAction({
      companyId: req.companyId,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'CANDIDATE_INVITED',
      entityType: 'Candidate',
      entityId: candidate._id.toString(),
      details: `Invited candidate ${name} (${cleanEmail}) to ${interview.title} (Expires in 48h)`,
    });

    res.status(201).json({
      success: true,
      message: `Candidate ${name} added & invitation email sent to ${cleanEmail} via Resend (Expires in 48h)!`,
      candidate,
    });
  } catch (error) {
    next(error);
  }
};

// Fisher-Yates Shuffle Helper
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Start Candidate Interview & Check 48-Hour Link Expiration
const startCandidateSession = async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    const candidate = await Candidate.findById(candidateId).populate('interviewId');
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate registration not found' });
    }

    // CHECK 48-HOUR LINK EXPIRATION & COMPLETION
    const isExpired =
      candidate.isExpired ||
      candidate.interviewState === 'Completed' ||
      (candidate.expiresAt && new Date(candidate.expiresAt) < new Date());

    if (isExpired) {
      if (!candidate.isExpired) {
        candidate.isExpired = true;
        await candidate.save();
      }
      return res.status(403).json({
        success: false,
        message: 'This candidate interview link has expired or was already completed. Interview links are valid for 48 hours.',
        isExpired: true,
      });
    }

    candidate.interviewState = 'In Progress';
    if (!candidate.startedAt) candidate.startedAt = new Date();

    // DYNAMIC CANDIDATE-UNIQUE QUESTION GENERATION FOR EVERY SESSION
    if (!candidate.assignedQuestions || candidate.assignedQuestions.length === 0) {
      // Fetch blueprint questions for this interview + company Question Bank as RAG reference
      const interviewQuestions = await Question.find({ interviewId: candidate.interviewId._id }).lean();
      const companyBank = await Question.find({
        companyId: candidate.interviewId.companyId || candidate.companyId,
      }).limit(25).lean();

      // Combine both pools and shuffle randomly
      const combinedBank = shuffleArray([...interviewQuestions, ...companyBank]);

      const targetCount = Number(candidate.interviewId.aiConfig?.questionCount) || 6;
      const targetDuration = Number(candidate.interviewId.durationMinutes) || 30;
      const perQuestionSec = Math.max(60, Math.floor((targetDuration * 60) / targetCount));

      console.log(`[RAG] Generating candidate-unique ${targetCount}-question set (${targetDuration}m duration, ${perQuestionSec}s/q) for ${candidate.name} (${candidate.candidateCode}).`);

      const generated = await generateQuestionsWithRAG({
        jobTitle: candidate.interviewId.jobRole || candidate.interviewId.title,
        department: candidate.interviewId.department,
        experience: candidate.interviewId.experience,
        skills: candidate.interviewId.skillsRequired || [],
        jobDescription: candidate.interviewId.jobDescription || '',
        questionCount: targetCount,
        durationMinutes: targetDuration,
        bankQuestions: combinedBank,
        candidateName: candidate.name,
        seed: `${candidate.candidateCode}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      });

      const assigned = generated.map((q, idx) => ({
        order: idx + 1,
        type: q.type || 'Technical',
        title: q.title || `Question ${idx + 1}`,
        questionText: q.questionText || q.question || 'Explain your engineering approach.',
        difficulty: q.difficulty || candidate.interviewId.difficulty || 'Mid-Level',
        competency: q.competency || 'Problem Solving',
        timeLimitSeconds: q.timeLimitSeconds || perQuestionSec,
        expectedAnswerKeyPoints: q.expectedAnswerKeyPoints || [],
        isCandidateQA: q.isCandidateQA || false,
      }));

      candidate.assignedQuestions = assigned;
    }

    await candidate.save();

    res.status(200).json({
      success: true,
      candidate: {
        id: candidate._id,
        name: candidate.name,
        code: candidate.candidateCode,
        isExpired: candidate.isExpired,
      },
      interview: candidate.interviewId,
      questions: candidate.assignedQuestions,
    });
  } catch (error) {
    next(error);
  }
};

// Toggle Candidate Link Expiration
const toggleExpireCandidate = async (req, res, next) => {
  try {
    const candidate = await Candidate.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    candidate.isExpired = !candidate.isExpired;
    await candidate.save();

    await logAuditAction(
      req,
      'CANDIDATE_LINK_TOGGLED',
      'CandidateLink',
      `Toggled candidate interview link for "${candidate.name}" (${candidate.email}) to ${candidate.isExpired ? 'Expired' : 'Active'}`,
      { entityId: candidate._id }
    );

    res.status(200).json({
      success: true,
      message: `Candidate link status updated: ${candidate.isExpired ? 'Expired' : 'Active'}`,
      isExpired: candidate.isExpired,
    });
  } catch (error) {
    next(error);
  }
};

// Upload WebRTC Video Session Recording
const uploadVideoRecording = async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    const recordingUrl = req.file ? `/uploads/${req.file.filename}` : '';

    const candidate = await Candidate.findByIdAndUpdate(candidateId, { recordingUrl }, { new: true });
    res.status(200).json({ success: true, recordingUrl: candidate.recordingUrl });
  } catch (error) {
    next(error);
  }
};

// Helper: Hydrate empty/default question titles & texts from assignedQuestions
function hydrateResponses(responses, candidate) {
  if (!candidate || !candidate.assignedQuestions || candidate.assignedQuestions.length === 0) {
    return responses;
  }
  return responses.map((r, idx) => {
    const doc = r.toObject ? r.toObject() : { ...r };
    const matched = candidate.assignedQuestions.find(
      (aq) => aq._id?.toString() === doc.questionId?.toString()
    ) || candidate.assignedQuestions[idx];

    if (matched) {
      if (!doc.questionTitle || doc.questionTitle === 'Question') {
        doc.questionTitle = matched.title || `Question ${idx + 1}`;
      }
      if (!doc.questionText || doc.questionText === 'Interview Question') {
        doc.questionText = matched.questionText || '';
      }
    }
    return doc;
  });
}

// Submit Single Answer / Transcript Response
const submitAnswerResponse = async (req, res, next) => {
  try {
    const {
      candidateId,
      questionId,
      questionTitle,
      questionText,
      answerText,
      codeSubmitted,
      durationSeconds,
      sentiment,
    } = req.body;

    const candidate = await Candidate.findById(candidateId);
    let title = questionTitle;
    let text = questionText;

    // Try finding matching assigned question
    if ((!title || title === 'Question' || !text) && candidate?.assignedQuestions?.length > 0) {
      const matched = candidate.assignedQuestions.find(
        (aq) => aq._id?.toString() === questionId?.toString()
      );
      if (matched) {
        title = matched.title || title;
        text = matched.questionText || text;
      }
    }

    // Try finding from Question collection if real questionId
    if (!title || !text) {
      const dbQ = await Question.findById(questionId);
      if (dbQ) {
        title = dbQ.title || title;
        text = dbQ.questionText || text;
      }
    }

    const responseDoc = await Response.create({
      candidateId,
      interviewId: candidate ? candidate.interviewId : null,
      questionId,
      questionTitle: title || 'Question',
      questionText: text || '',
      answerText,
      codeSubmitted,
      durationSeconds: durationSeconds || 60,
      sentiment: sentiment || 'Confident',
    });

    res.status(201).json({ success: true, response: responseDoc });
  } catch (error) {
    next(error);
  }
};

// Complete Interview & Mark Candidate Ready for Evaluation
const completeCandidateInterview = async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    candidate.interviewState = 'Completed';
    candidate.status = 'Interviewed';
    candidate.isExpired = true; // Automatically expire completed interview links
    candidate.completedAt = new Date();
    await candidate.save();

    await Interview.findByIdAndUpdate(candidate.interviewId, { $inc: { completedCount: 1 } });

    res.status(200).json({
      success: true,
      message: 'Interview submitted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// Get All Workspace Candidates
const getCompanyCandidates = async (req, res, next) => {
  try {
    const { search, status, recommendation, interviewId, sort } = req.query;

    let query = { companyId: req.companyId };

    if (status) query.status = status;
    if (recommendation) query.recommendation = recommendation;
    if (interviewId) query.interviewId = interviewId;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { candidateCode: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'score_desc') sortOption = { overallScore: -1 };
    if (sort === 'score_asc') sortOption = { overallScore: 1 };

    const candidates = await Candidate.find(query)
      .sort(sortOption)
      .populate('interviewId', 'title jobRole department');

    res.status(200).json({ success: true, count: candidates.length, candidates });
  } catch (error) {
    next(error);
  }
};

// Get Candidate Detail with Report & Responses
const getCandidateDetail = async (req, res, next) => {
  try {
    const candidate = await Candidate.findOne({ _id: req.params.id, companyId: req.companyId })
      .populate('interviewId');

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    const rawResponses = await Response.find({ candidateId: candidate._id });
    const responses = hydrateResponses(rawResponses, candidate);
    const report = await Report.findOne({ candidateId: candidate._id });

    // Synchronize Candidate overallScore & recommendation if Report exists
    if (report && (candidate.overallScore !== report.overallScore || candidate.recommendation !== report.recommendation)) {
      candidate.overallScore = report.overallScore;
      candidate.recommendation = report.recommendation;
      await candidate.save();
    }

    res.status(200).json({
      success: true,
      candidate,
      responses,
      report,
    });
  } catch (error) {
    next(error);
  }
};

// Update Candidate Pipeline Status (Kanban Drag and Drop)
const updateCandidateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const candidate = await Candidate.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { status },
      { new: true }
    );

    if (candidate) {
      await logAuditAction(
        req,
        'CANDIDATE_STATUS_CHANGED',
        'RecruitmentPipeline',
        `Moved candidate "${candidate.name}" (${candidate.email}) to status "${status}"`,
        { entityId: candidate._id }
      );
    }

    res.status(200).json({ success: true, candidate });
  } catch (error) {
    next(error);
  }
};

// Add Recruiter Note to Candidate Profile
const addCandidateNote = async (req, res, next) => {
  try {
    const { text } = req.body;
    const candidate = await Candidate.findOne({ _id: req.params.id, companyId: req.companyId });
    candidate.notes.push({ author: req.user.name, text });
    await candidate.save();
    res.status(200).json({ success: true, notes: candidate.notes });
  } catch (error) {
    next(error);
  }
};

// Record Proctoring Violation
const recordViolation = async (req, res, next) => {
  try {
    const { candidateId, type, details, severity } = req.body;
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    const violation = await Violation.create({
      candidateId,
      interviewId: candidate.interviewId,
      companyId: candidate.companyId,
      type: type || 'Camera Blocked / Lens Covered',
      details: details || 'Proctoring alert triggered during session.',
      severity: severity || 'medium',
    });

    await Candidate.findByIdAndUpdate(candidateId, { $inc: { violationsCount: 1 } });

    res.status(201).json({ success: true, violation });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerCandidate,
  addAndInviteCandidate,
  startCandidateSession,
  toggleExpireCandidate,
  uploadVideoRecording,
  submitAnswerResponse,
  completeCandidateInterview,
  getCompanyCandidates,
  getCandidateDetail,
  updateCandidateStatus,
  addCandidateNote,
  recordViolation,
};
