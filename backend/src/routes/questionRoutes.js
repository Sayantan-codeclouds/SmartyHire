const express = require('express');
const router = express.Router();
const {
  getQuestionBank,
  createQuestionBlueprint,
  updateQuestionBlueprint,
  deleteQuestionBlueprint,
  generateAIQuestionBlueprints,
} = require('../controllers/questionBankController');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.get('/bank', getQuestionBank);
router.post('/bank', createQuestionBlueprint);
router.put('/bank/:id', updateQuestionBlueprint);
router.delete('/bank/:id', deleteQuestionBlueprint);
router.post('/bank/generate-ai', generateAIQuestionBlueprints);

module.exports = router;
