const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['Interview Started', 'Interview Completed', 'New Candidate', 'AI Finished Evaluation', 'Violation Alert', 'System'],
      default: 'System',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    link: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
