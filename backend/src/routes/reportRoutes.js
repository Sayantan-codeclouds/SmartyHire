const express = require('express');
const router = express.Router();
const { getReportByCandidate, downloadPDFReport } = require('../controllers/reportController');
const { protect } = require('../middlewares/auth');

router.get('/candidate/:candidateId', protect, getReportByCandidate);
router.get('/candidate/:candidateId/pdf', downloadPDFReport);

module.exports = router;
