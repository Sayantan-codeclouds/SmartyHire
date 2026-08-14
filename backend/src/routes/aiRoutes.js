const express = require('express');
const router = express.Router();
const { getFollowUpQuestion, evaluateCandidateSession, answerCandidateQA } = require('../controllers/aiController');

router.post('/follow-up', getFollowUpQuestion);
router.post('/evaluate/:candidateId', evaluateCandidateSession);
router.post('/candidate-qa', answerCandidateQA);

module.exports = router;
