const Report = require('../models/Report');
const Candidate = require('../models/Candidate');
const Interview = require('../models/Interview');
const Company = require('../models/Company');
const Response = require('../models/Response');
const Violation = require('../models/Violation');
const { generateCandidatePDFReport } = require('../services/pdfService');
const { evaluateCandidateResponses } = require('../services/groqService');

// Get Report by Candidate ID
const getReportByCandidate = async (req, res, next) => {
  try {
    let report = await Report.findOne({ candidateId: req.params.candidateId }).populate({
      path: 'candidateId',
      populate: { path: 'interviewId' },
    });

    // If report doesn't exist yet, auto-evaluate on the fly!
    if (!report) {
      const candidate = await Candidate.findById(req.params.candidateId).populate('interviewId');
      if (candidate) {
        const responses = await Response.find({ candidateId: req.params.candidateId });
        const violations = await Violation.find({ candidateId: req.params.candidateId });

        // Call Groq Evaluation Engine
        const evalData = await evaluateCandidateResponses({
          candidateName: candidate.name,
          jobTitle: candidate.interviewId?.title || 'Engineer',
          responses,
          violations,
          assignedQuestions: candidate.assignedQuestions || [],
        });

        report = await Report.create({
          candidateId: candidate._id,
          interviewId: candidate.interviewId._id,
          companyId: candidate.companyId,
          ...evalData,
          proctoringReport: {
            totalViolations: violations.length,
            trustScore: Math.max(0, 100 - violations.length * 10),
            flaggedBehavior: violations.map((v) => v.type),
          },
        });

        candidate.overallScore = report.overallScore;
        candidate.recommendation = report.recommendation;
        candidate.violationsCount = violations.length;
        if (candidate.interviewState !== 'Completed') {
          candidate.interviewState = 'Completed';
          candidate.isExpired = true;
          candidate.completedAt = new Date();
        }
        await candidate.save();

        report = await Report.findById(report._id).populate({
          path: 'candidateId',
          populate: { path: 'interviewId' },
        });
      }
    }

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.status(200).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// Download Candidate PDF Report
const downloadPDFReport = async (req, res, next) => {
  try {
    const { candidateId } = req.params;

    const report = await Report.findOne({ candidateId });
    const candidate = await Candidate.findById(candidateId);
    const interview = await Interview.findById(candidate.interviewId);
    const company = await Company.findById(candidate.companyId);

    if (!report || !candidate || !interview) {
      return res.status(404).json({ success: false, message: 'Assessment records incomplete' });
    }

    const pdfBuffer = await generateCandidatePDFReport(candidate, report, interview, company);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=SmartyHire_Report_${candidate.name.replace(/\s+/g, '_')}.pdf`);
    res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReportByCandidate,
  downloadPDFReport,
};
