const express = require('express');
const router = express.Router();
const {
  createInterview,
  getInterviews,
  getInterviewById,
  getPublicInterview,
  sendCandidateInvite,
  updateInterviewStatus,
  deleteInterview,
} = require('../controllers/interviewController');
const { protect } = require('../middlewares/auth');

// Public route for candidate interview landing page
router.get('/public/:publicId', getPublicInterview);

// Protected workspace routes
router.use(protect);
router.route('/').get(getInterviews).post(createInterview);
router.route('/:id').get(getInterviewById).delete(deleteInterview);
router.post('/:id/invite', sendCandidateInvite);
router.put('/:id/status', updateInterviewStatus);

module.exports = router;
