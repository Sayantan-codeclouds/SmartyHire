const Razorpay = require('razorpay');
const crypto = require('crypto');
const Plan = require('../models/Plan');
const Payment = require('../models/Payment');
const Company = require('../models/Company');
const logAuditAction = require('../utils/auditLogger');

const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return null;
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// GET /api/payments/plans — List all active plans
const getPlans = async (req, res, next) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ sortOrder: 1, price: 1 });
    res.status(200).json({ success: true, plans });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/create-order — Create Razorpay order for a plan
const createOrder = async (req, res, next) => {
  try {
    const { planId } = req.body;
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found.' });
    }

    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Payment gateway not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env',
      });
    }

    const amountInPaise = plan.price * 100;
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `smartyhire_${req.companyId}_${Date.now()}`,
      notes: {
        companyId: req.companyId.toString(),
        planId: plan._id.toString(),
        planName: plan.name,
      },
    });

    // Record payment as created
    await Payment.create({
      companyId: req.companyId,
      planId: plan._id,
      planName: plan.name,
      amount: amountInPaise,
      razorpayOrderId: order.id,
      status: 'created',
    });

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      planName: plan.name,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/verify — Verify signature and activate plan
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, planId } = req.body;

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(503).json({ success: false, message: 'Payment gateway not configured.' });
    }

    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId },
        { status: 'failed', razorpayPaymentId, razorpaySignature }
      );
      return res.status(400).json({ success: false, message: 'Invalid payment signature. Payment verification failed.' });
    }

    // Activate plan on company
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found.' });
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const company = await Company.findByIdAndUpdate(
      req.companyId,
      {
        'subscription.plan': plan.name,
        'subscription.status': 'active',
        'subscription.monthlyInterviewQuota': plan.interviewQuota,
        'subscription.usedInterviewsThisMonth': 0, // Reset usage counter for new billing month
        'subscription.lastPaymentId': razorpayPaymentId,
        'subscription.subscriptionExpiresAt': expiresAt,
      },
      { new: true }
    );

    await Payment.findOneAndUpdate(
      { razorpayOrderId },
      {
        status: 'paid',
        razorpayPaymentId,
        razorpaySignature,
        paidAt: new Date(),
      }
    );

    // Audit log plan upgrade
    await logAuditAction(
      req,
      'PLAN_UPGRADE',
      'Subscription',
      `Upgraded subscription to ${plan.name} plan (Quota: ${plan.interviewQuota} interviews, Amount: ₹${plan.price})`,
      { entityId: plan._id }
    );

    res.status(200).json({
      success: true,
      message: `Successfully upgraded to ${plan.name} plan!`,
      company,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/payments/status — Current subscription + quota
const getSubscriptionStatus = async (req, res, next) => {
  try {
    const company = await Company.findById(req.companyId);
    const payments = await Payment.find({ companyId: req.companyId, status: 'paid' })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.status(200).json({
      success: true,
      subscription: company.subscription,
      recentPayments: payments,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPlans, createOrder, verifyPayment, getSubscriptionStatus };
