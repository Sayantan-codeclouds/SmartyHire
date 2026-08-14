const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
      index: true,
    },
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'Tab Switch',
        'Window Blur',
        'No Face Detected',
        'Multiple Faces',
        'Phone Usage',
        'Looking Away',
        'Background Noise',
        'Copy Paste Attempt',
        'Developer Tools Open',
        'Fullscreen Exit',
        'Camera Blocked / Lens Covered',
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    snapshotUrl: String,
    details: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Violation', violationSchema);
