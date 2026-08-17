const Company = require('../models/Company');

/**
 * Normalizes plan name to a canonical form for tier comparison
 * @param {string} plan
 * @returns {string}
 */
const normalizePlan = (plan) => {
  if (!plan) return 'Free';
  const p = plan.toString().trim().toLowerCase();
  if (p === 'pro' || p === 'professional') return 'Pro';
  if (p === 'starter') return 'Starter';
  if (p === 'enterprise') return 'Enterprise';
  return 'Free';
};

/**
 * Middleware factory to enforce plan tiers
 * @param {Array<string>} allowedPlans - List of allowed plan names e.g. ['Pro', 'Enterprise']
 */
const requirePlan = (allowedPlans = ['Pro', 'Enterprise']) => {
  const normalizedAllowed = allowedPlans.map((p) => normalizePlan(p));

  return async (req, res, next) => {
    try {
      const companyId = req.companyId || req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ success: false, message: 'Company workspace context required.' });
      }

      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({ success: false, message: 'Workspace not found.' });
      }

      const currentPlan = normalizePlan(company.subscription?.plan);

      if (!normalizedAllowed.includes(currentPlan)) {
        return res.status(403).json({
          success: false,
          isUpgradeRequired: true,
          message: `This feature is available on ${allowedPlans.join(' / ')} plans only. Your workspace is currently on the ${company.subscription?.plan || 'Free'} plan.`,
          currentPlan: company.subscription?.plan || 'Free',
          requiredPlans: allowedPlans,
        });
      }

      req.company = company;
      next();
    } catch (err) {
      next(err);
    }
  };
};

// Convenience middleware specifically for Pro / Enterprise features like Knowledge Vault RAG
const requireProPlan = requirePlan(['Pro', 'Enterprise']);

module.exports = {
  normalizePlan,
  requirePlan,
  requireProPlan,
};
