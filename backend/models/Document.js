const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    index: true
  },
  filename: {
    type: String,
    required: true
  },
  originalFilename: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index for efficient queries
documentSchema.index({ studentId: 1, uploadedAt: -1 });
documentSchema.index({ studentId: 1, category: 1 });

module.exports = mongoose.model('Document', documentSchema);
