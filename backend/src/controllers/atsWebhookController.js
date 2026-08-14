const Candidate = require('../models/Candidate');
const Interview = require('../models/Interview');
const Company = require('../models/Company');
const { v4: uuidv4 } = require('uuid');

/**
 * Handle incoming ATS webhook payloads (Greenhouse / Ashby / Lever)
 */
const handleATSWebhook = async (req, res, next) => {
  try {
    const { apiKey } = req.params;
    const company = await Company.findOne({ apiKey });

    if (!company) {
      return res.status(401).json({ success: false, message: 'Invalid ATS webhook API key' });
    }

    const { candidateName, candidateEmail, candidatePhone, jobPublicId } = req.body;

    const interview = await Interview.findOne({ companyId: company._id, publicId: jobPublicId });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview blueprint not found for ATS payload' });
    }

    const candidateCode = 'ATS-' + uuidv4().substring(0, 6).toUpperCase();

    const candidate = await Candidate.create({
      companyId: company._id,
      interviewId: interview._id,
      candidateCode,
      name: candidateName || 'ATS Candidate',
      email: candidateEmail || 'ats_candidate@example.com',
      phone: candidatePhone || '',
      status: 'Applied',
      interviewState: 'Not Started',
    });

    res.status(201).json({
      success: true,
      message: 'ATS Candidate synced successfully',
      candidateId: candidate._id,
      publicInterviewUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/interview/${interview.publicId}`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleATSWebhook,
};
