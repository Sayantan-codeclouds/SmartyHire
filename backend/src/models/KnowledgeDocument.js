const mongoose = require('mongoose');

const knowledgeDocumentSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Company Overview', 'Tech Stack & Architecture', 'Culture & Benefits', 'Interview Guidelines', 'Question Blueprints', 'General Policy'],
      default: 'Company Overview',
    },
    fileUrl: {
      type: String,
      default: '',
    },
    fileName: {
      type: String,
      default: '',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
      default: 'application/pdf',
    },
    extractedText: {
      type: String,
      required: true,
    },
    chunks: [
      {
        chunkIndex: Number,
        text: String,
      },
    ],
    keyTopics: [
      {
        type: String,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('KnowledgeDocument', knowledgeDocumentSchema);
