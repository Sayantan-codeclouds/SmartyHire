const express = require('express');
const router = express.Router();
const { protect, requireSuperAdmin } = require('../middlewares/auth');
const {
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
} = require('../controllers/adminController');

// All admin routes require authentication + Super Admin role
router.use(protect, requireSuperAdmin);

router.get('/stats', getPlatformStats);
router.get('/companies', getAllCompanies);
router.get('/users', getAllUsers);
router.put('/company/:id/plan', overrideCompanyPlan);
router.put('/user/:id/suspend', toggleUserSuspend);
router.get('/plans', getAllPlans);
router.post('/plans', createPlan);
router.put('/plans/:id', updatePlan);
router.delete('/plans/:id', deletePlan);
router.get('/payments', getPaymentHistory);
router.delete('/clear-data', clearAllCandidatesAndInterviews);

module.exports = router;
