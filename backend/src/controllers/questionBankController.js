const Question = require('../models/Question');
const groqService = require('../services/groqService');
const logAuditAction = require('../utils/auditLogger');

// Get all question blueprints for company
const getQuestionBank = async (req, res, next) => {
  try {
    const questions = await Question.find({ companyId: req.user.companyId }).sort({ createdAt: -1 });

    // Seed sample blueprints if company bank is currently empty
    if (questions.length === 0) {
      const defaultSamples = [
        {
          companyId: req.user.companyId,
          title: 'React 19 Server Actions & Optimistic Mutations',
          questionText: 'Walk me through how React 19 Server Actions operate compared to traditional REST API endpoints, and explain how useOptimistic prevents UI jank.',
          type: 'Technical',
          difficulty: 'Senior',
          competency: 'Frontend Architecture',
          expectedAnswerKeyPoints: ['Server Actions run on server context', 'useOptimistic updates UI immediately', 'Automatic rollback on error'],
        },
        {
          companyId: req.user.companyId,
          title: 'WebSocket Latency & Frame Throttle',
          questionText: 'In a real-time multiplayer application, how do you handle WebSocket packet bursts and prevent main-thread UI frame drops?',
          type: 'Scenario',
          difficulty: 'Senior',
          competency: 'Performance',
          expectedAnswerKeyPoints: ['Debounce/throttle incoming state diffs', 'Use requestAnimationFrame batching', 'Offload parsing to Web Workers'],
        },
        {
          companyId: req.user.companyId,
          title: 'Cross-functional Technical Conflict',
          questionText: 'Describe a situation where engineering priorities conflicted with tight product launch deadlines. How did you resolve the trade-offs?',
          type: 'Behavioral',
          difficulty: 'Mid-Level',
          competency: 'Leadership',
          expectedAnswerKeyPoints: ['Identify MVP scope vs technical debt', 'Transparent stakeholder communication', 'Post-launch refactoring plan'],
        },
        {
          companyId: req.user.companyId,
          title: 'Low-Latency LLM RAG Pipeline Architecture',
          questionText: 'How would you architect a low-latency Retrieval-Augmented Generation (RAG) system using vector embeddings and high-speed LLM completion endpoints?',
          type: 'Technical',
          difficulty: 'Lead',
          competency: 'AI Infrastructure',
          expectedAnswerKeyPoints: ['Embedding chunking & cosine similarity', 'Pinecone / Qdrant vector retrieval', 'Streaming tokens via WebSockets'],
        },
      ];

      const seeded = await Question.insertMany(defaultSamples);
      return res.status(200).json({ success: true, questions: seeded });
    }

    res.status(200).json({ success: true, questions });
  } catch (error) {
    next(error);
  }
};

// Create a new question blueprint manually
const createQuestionBlueprint = async (req, res, next) => {
  try {
    const { title, questionText, type, difficulty, competency, expectedAnswerKeyPoints } = req.body;

    if (!title || !questionText) {
      return res.status(400).json({ success: false, message: 'Please provide both question title and question text.' });
    }

    const question = await Question.create({
      companyId: req.user.companyId,
      title,
      questionText,
      type: type || 'Technical',
      difficulty: difficulty || 'Mid-Level',
      competency: competency || 'Problem Solving',
      expectedAnswerKeyPoints: expectedAnswerKeyPoints || [],
    });

    await logAuditAction(
      req,
      'QUESTION_BANK_ADDED',
      'QuestionBank',
      `Added question blueprint "${title}" (${type || 'Technical'}) to workspace Question Bank`,
      { entityId: question._id }
    );

    res.status(201).json({ success: true, question });
  } catch (error) {
    next(error);
  }
};

// Update an existing question blueprint
const updateQuestionBlueprint = async (req, res, next) => {
  try {
    const question = await Question.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question blueprint not found.' });
    }

    const { title, questionText, type, difficulty, competency, expectedAnswerKeyPoints } = req.body;

    if (title) question.title = title;
    if (questionText) question.questionText = questionText;
    if (type) question.type = type;
    if (difficulty) question.difficulty = difficulty;
    if (competency) question.competency = competency;
    if (expectedAnswerKeyPoints) question.expectedAnswerKeyPoints = expectedAnswerKeyPoints;

    await question.save();

    res.status(200).json({ success: true, question });
  } catch (error) {
    next(error);
  }
};

// Delete a question blueprint
const deleteQuestionBlueprint = async (req, res, next) => {
  try {
    const question = await Question.findOneAndDelete({ _id: req.params.id, companyId: req.user.companyId });
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question blueprint not found.' });
    }

    await logAuditAction(
      req,
      'QUESTION_BANK_DELETED',
      'QuestionBank',
      `Deleted question blueprint "${question.title}" from Question Bank`,
      { entityId: question._id }
    );

    res.status(200).json({ success: true, message: 'Question blueprint deleted.' });
  } catch (error) {
    next(error);
  }
};

// Generate Question Blueprints using Groq AI
const generateAIQuestionBlueprints = async (req, res, next) => {
  try {
    const { role, department } = req.body;

    const generated = await groqService.generateQuestionsFromJD({
      jobTitle: role || 'Full Stack Engineer',
      department: department || 'Engineering',
      experience: 'Senior',
      skills: [],
      jobDescription: `${role || 'Full Stack Engineer'} technical interview questions`,
      questionCount: 3,
    });

    const newQuestions = generated.map((q) => ({
      companyId: req.user.companyId,
      title: q.title || `${role} Assessment`,
      questionText: q.questionText,
      type: q.type || 'Technical',
      difficulty: q.difficulty || 'Senior',
      competency: q.competency || 'Domain Knowledge',
      expectedAnswerKeyPoints: q.expectedAnswerKeyPoints || [],
    }));

    const saved = await Question.insertMany(newQuestions);

    await logAuditAction(
      req,
      'QUESTION_BANK_AI_GENERATED',
      'QuestionBank',
      `Generated ${saved.length} AI question blueprints for role "${role || 'Full Stack Engineer'}" in Question Bank`
    );

    res.status(201).json({ success: true, questions: saved });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQuestionBank,
  createQuestionBlueprint,
  updateQuestionBlueprint,
  deleteQuestionBlueprint,
  generateAIQuestionBlueprints,
};
