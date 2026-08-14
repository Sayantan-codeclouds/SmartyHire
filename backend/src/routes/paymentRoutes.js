const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { getPlans, createOrder, verifyPayment, getSubscriptionStatus } = require('../controllers/paymentController');

router.get('/plans', getPlans); // Public — all active plans
router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/status', protect, getSubscriptionStatus);

module.exports = router;
