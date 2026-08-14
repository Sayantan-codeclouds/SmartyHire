const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const KnowledgeDocument = require('../models/KnowledgeDocument');
const { chunkText } = require('../services/chunkingService');
const logAuditAction = require('../utils/auditLogger');

// Upload & Process PDF / Text Knowledge Document
const uploadKnowledgeDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a PDF or Text document to upload.' });
    }

    const { title, category } = req.body;
    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const fileSize = req.file.size;
    const mimeType = req.file.mimetype;

    let extractedText = '';

    if (mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
      const dataBuffer = fs.readFileSync(filePath);
      const parsed = await pdfParse(dataBuffer);
      extractedText = parsed.text || '';
    } else {
      // Plain text / Markdown / JSON
      extractedText = fs.readFileSync(filePath, 'utf8');
    }

    // Relative public URL
    const fileUrl = `/uploads/documents/${path.basename(filePath)}`;
    const textContent = extractedText.trim();
    const documentChunks = chunkText(textContent);

    const doc = await KnowledgeDocument.create({
      companyId: req.companyId,
      createdBy: req.user?._id,
      title: title || fileName.replace(/\.[^/.]+$/, ''),
      category: category || 'Company Overview',
      fileName,
      fileSize,
      mimeType,
      fileUrl,
      extractedText: textContent,
      chunks: documentChunks,
      keyTopics: (category || 'Company Overview').split(' '),
    });

    await logAuditAction(
      req,
      'KNOWLEDGE_DOC_UPLOADED',
      'KnowledgeVault',
      `Uploaded knowledge document "${doc.title}" (${fileName}, ${documentChunks.length} RAG chunks generated)`,
      { entityId: doc._id }
    );

    res.status(201).json({
      success: true,
      message: 'Knowledge document uploaded and parsed for RAG successfully!',
      document: doc,
    });
  } catch (error) {
    console.error('[Knowledge Upload Error]', error);
    next(error);
  }
};

// Add Text/Markdown Knowledge Document directly
const createTextKnowledgeDocument = async (req, res, next) => {
  try {
    const { title, category, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and document content are required.' });
    }

    const doc = await KnowledgeDocument.create({
      companyId: req.companyId,
      createdBy: req.user?._id,
      title,
      category: category || 'Company Overview',
      fileName: `${title.toLowerCase().replace(/\s+/g, '_')}.txt`,
      fileSize: Buffer.byteLength(content, 'utf8'),
      mimeType: 'text/plain',
      extractedText: content,
      chunks: chunkText(content),
      keyTopics: (category || 'Company Overview').split(' '),
    });

    await logAuditAction(
      req,
      'KNOWLEDGE_ENTRY_CREATED',
      'KnowledgeVault',
      `Created knowledge base entry "${title}" (${doc.category})`,
      { entityId: doc._id }
    );

    res.status(201).json({
      success: true,
      message: 'Knowledge entry created successfully!',
      document: doc,
    });
  } catch (error) {
    next(error);
  }
};

// Get All Company Knowledge Documents
const getKnowledgeDocuments = async (req, res, next) => {
  try {
    const documents = await KnowledgeDocument.find({ companyId: req.companyId }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Knowledge Document
const deleteKnowledgeDocument = async (req, res, next) => {
  try {
    const doc = await KnowledgeDocument.findOneAndDelete({ _id: req.params.id, companyId: req.companyId });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    await logAuditAction(
      req,
      'KNOWLEDGE_DOC_DELETED',
      'KnowledgeVault',
      `Deleted knowledge document "${doc.title}"`,
      { entityId: doc._id }
    );

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadKnowledgeDocument,
  createTextKnowledgeDocument,
  getKnowledgeDocuments,
  deleteKnowledgeDocument,
};
