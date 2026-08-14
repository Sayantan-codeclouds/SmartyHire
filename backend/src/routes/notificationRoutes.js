const express = require('express');
const router = express.Router();
const { getNotifications, markNotificationRead, getAuditLogs } = require('../controllers/notificationController');
const { protect } = require('../middlewares/auth');

router.get('/', protect, getNotifications);
router.put('/read-all', protect, markNotificationRead);
router.get('/audit-logs', protect, getAuditLogs);

module.exports = router;
