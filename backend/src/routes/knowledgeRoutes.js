const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  uploadKnowledgeDocument,
  createTextKnowledgeDocument,
  getKnowledgeDocuments,
  deleteKnowledgeDocument,
} = require('../controllers/knowledgeController');
const { protect } = require('../middlewares/auth');
const { requireProPlan } = require('../middlewares/planGuard');

// Setup multer storage for document uploads
const uploadDir = path.join(__dirname, '../../uploads/documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `doc-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max PDF
});

// All knowledge / RAG routes require authenticated user + Pro/Enterprise plan
router.use(protect);
router.use(requireProPlan);

router.get('/', getKnowledgeDocuments);
router.post('/upload', upload.single('document'), uploadKnowledgeDocument);
router.post('/text', createTextKnowledgeDocument);
router.delete('/:id', deleteKnowledgeDocument);

module.exports = router;
