const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const upload = require('../middlewares/upload');
const { protect } = require('../middlewares/auth');
const {
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
} = require('../controllers/candidateController');

// Rate limiter for public candidate-facing endpoints (prevents abuse)
const candidateSessionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 120, // max 120 requests per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

router.post('/register', candidateSessionLimiter, upload.single('resume'), registerCandidate);
router.post('/recording/:candidateId', upload.single('video'), uploadVideoRecording);
router.get('/session/:candidateId', candidateSessionLimiter, startCandidateSession);
router.post('/response', candidateSessionLimiter, submitAnswerResponse);
router.post('/violation', candidateSessionLimiter, recordViolation);
router.post('/complete/:candidateId', candidateSessionLimiter, completeCandidateInterview);

// Protected SaaS endpoints
router.get('/', protect, getCompanyCandidates);
router.post('/invite', protect, addAndInviteCandidate);
router.get('/:id', protect, getCandidateDetail);
router.put('/:id/expire', protect, toggleExpireCandidate);
router.put('/:id/status', protect, updateCandidateStatus);
router.post('/:id/notes', protect, addCandidateNote);

module.exports = router;
