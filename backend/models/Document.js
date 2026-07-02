const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  fileType: {
    type: String,
    enum: ['pdf', 'image', 'other'],
    default: 'other',
  },
  filePath: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
  },
  fileSize: {
    type: Number,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    enum: ['offer_letter', 'id_proof', 'contract', 'certificate', 'other'],
    default: 'other',
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Document', documentSchema);
