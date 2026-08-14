const Company = require('../models/Company');
const User = require('../models/User');
const Interview = require('../models/Interview');
const Candidate = require('../models/Candidate');
const Report = require('../models/Report');
const Plan = require('../models/Plan');
const Payment = require('../models/Payment');
const logAuditAction = require('../utils/auditLogger');

// GET /api/admin/stats — Platform-wide KPIs
const getPlatformStats = async (req, res, next) => {
  try {
    const totalCompanies = await Company.countDocuments();
    const totalUsers = await User.countDocuments({ role: { $ne: 'Super Admin' } });
    const totalInterviews = await Interview.countDocuments();
    const totalCandidates = await Candidate.countDocuments();
    const totalReports = await Report.countDocuments();

    // MRR calculation from paid payments this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const paidPayments = await Payment.find({ status: 'paid', paidAt: { $gte: startOfMonth } });
    const mrr = paidPayments.reduce((sum, p) => sum + (p.amount / 100), 0);

    // Active vs Inactive companies
    const activeCompanies = await Company.countDocuments({ 'subscription.status': 'active' });

    // Plan distribution
    const planDist = await Company.aggregate([
      { $group: { _id: '$subscription.plan', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalCompanies,
        activeCompanies,
        totalUsers,
        totalInterviews,
        totalCandidates,
        totalReports,
        mrr,
        planDistribution: planDist,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/companies — All companies
const getAllCompanies = async (req, res, next) => {
  try {
    const companies = await Company.find()
      .sort({ createdAt: -1 })
      .lean();

    const companiesWithStats = await Promise.all(
      companies.map(async (c) => {
        const userCount = await User.countDocuments({ companyId: c._id });
        const candidateCount = await Candidate.countDocuments({ companyId: c._id });
        const interviewCount = await Interview.countDocuments({ companyId: c._id });
        return { ...c, userCount, candidateCount, interviewCount };
      })
    );

    res.status(200).json({ success: true, companies: companiesWithStats });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users — All users (except super admins)
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ role: { $ne: 'Super Admin' } })
      .populate('companyId', 'name slug')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/company/:id/plan — Override company plan
const overrideCompanyPlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { plan, quota } = req.body;

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    company.subscription.plan = plan;
    company.subscription.status = 'active';
    company.subscription.monthlyInterviewQuota = quota || company.subscription.monthlyInterviewQuota;
    company.subscription.subscriptionExpiresAt = expiresAt;
    await company.save();

    // Audit log plan override for the target company
    await logAuditAction({
      companyId: company._id,
      userId: req.user._id,
      userName: 'System Support',
      userRole: 'Support Admin',
      action: 'ADMIN_PLAN_OVERRIDE',
      entityType: 'Subscription',
      entityId: String(company._id),
      details: `Workspace plan updated to ${plan} (Quota: ${company.subscription.monthlyInterviewQuota} interviews)`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.status(200).json({ success: true, message: `Plan updated to ${plan} for ${company.name}`, company });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/user/:id/suspend — Suspend or activate a user
const toggleUserSuspend = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    user.isSuspended = !user.isSuspended;
    await user.save();

    if (user.companyId) {
      await logAuditAction({
        companyId: user.companyId,
        userId: req.user._id,
        userName: 'System Support',
        userRole: 'Support Admin',
        action: user.isSuspended ? 'USER_SUSPENDED' : 'USER_REACTIVATED',
        entityType: 'UserAccount',
        entityId: String(user._id),
        details: `Account ${user.isSuspended ? 'suspended' : 'reactivated'} for user ${user.email}`,
        ipAddress: req.ip || '127.0.0.1',
      });
    }

    res.status(200).json({
      success: true,
      message: `User ${user.isSuspended ? 'suspended' : 'reactivated'} successfully.`,
      isSuspended: user.isSuspended,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/plans — All plans (admin view)
const getAllPlans = async (req, res, next) => {
  try {
    const plans = await Plan.find().sort({ sortOrder: 1, price: 1 });
    res.status(200).json({ success: true, plans });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/plans — Create a plan
const createPlan = async (req, res, next) => {
  try {
    const { name, price, interviewQuota, features, isPopular, billingCycle, sortOrder } = req.body;
    const plan = await Plan.create({ name, price, interviewQuota, features, isPopular, billingCycle, sortOrder });
    res.status(201).json({ success: true, plan });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/plans/:id — Update a plan
const updatePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await Plan.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Plan not found.' });
    }
    res.status(200).json({ success: true, plan: updated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/plans/:id — Delete a plan
const deletePlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Plan.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Plan deleted.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/payments — Payment history
const getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await Payment.find({ status: 'paid' })
      .populate('companyId', 'name')
      .populate('planId', 'name')
      .sort({ paidAt: -1 })
      .limit(100)
      .lean();

    res.status(200).json({ success: true, payments });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/clear-data — Wipe candidates, interviews, and session data
const clearAllCandidatesAndInterviews = async (req, res, next) => {
  try {
    const Candidate = require('../models/Candidate');
    const Response = require('../models/Response');
    const Violation = require('../models/Violation');
    const Question = require('../models/Question');

    const candidatesDeleted = await Candidate.deleteMany({});
    const interviewsDeleted = await Interview.deleteMany({});
    const responsesDeleted = await Response.deleteMany({});
    const reportsDeleted = await Report.deleteMany({});
    const violationsDeleted = await Violation.deleteMany({});
    const questionsDeleted = await Question.deleteMany({ interviewId: { $ne: null } });

    await logAuditAction({
      companyId: req.user.companyId || req.user._id,
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'DATABASE_CLEARED',
      entityType: 'SystemDatabase',
      details: `Cleared ${candidatesDeleted.deletedCount} candidates and ${interviewsDeleted.deletedCount} interviews from MongoDB database`,
      ipAddress: req.ip || '127.0.0.1',
    });

    res.status(200).json({
      success: true,
      message: 'All candidates and interviews deleted from database.',
      summary: {
        candidatesDeleted: candidatesDeleted.deletedCount,
        interviewsDeleted: interviewsDeleted.deletedCount,
        responsesDeleted: responsesDeleted.deletedCount,
        reportsDeleted: reportsDeleted.deletedCount,
        violationsDeleted: violationsDeleted.deletedCount,
        questionsDeleted: questionsDeleted.deletedCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPlatformStats,
  getAllCompanies,
  getAllUsers,
  overrideCompanyPlan,
  toggleUserSuspend,
  getAllPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getPaymentHistory,
  clearAllCandidatesAndInterviews,
};
