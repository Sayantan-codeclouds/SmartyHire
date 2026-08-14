const express = require('express');
const router = express.Router();
const { getDashboardStats, updateCompanySettings, regenerateApiKey, updateSubscription } = require('../controllers/companyController');
const { handleATSWebhook } = require('../controllers/atsWebhookController');
const { protect } = require('../middlewares/auth');

router.get('/dashboard', protect, getDashboardStats);
router.get('/stats', protect, getDashboardStats); // alias used by DashboardOverview
router.put('/settings', protect, updateCompanySettings);
router.post('/api-key', protect, regenerateApiKey);
router.put('/subscription', protect, updateSubscription);

// ATS Webhook Public Ingestion Endpoint
router.post('/webhooks/ats/:apiKey', handleATSWebhook);

module.exports = router;
