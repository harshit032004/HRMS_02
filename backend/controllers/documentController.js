const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');

// Helper: determine fileType from mimetype
const getFileType = (mimetype) => {
  if (mimetype === 'application/pdf') return 'pdf';
  if (mimetype.startsWith('image/')) return 'image';
  return 'other';
};

// @route   GET /api/employees/:id/documents
// @desc    List all documents for an employee
// @access  Private (admin, hr, or self)
const getDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdminOrHR = ['admin', 'hr'].includes(req.user.role);
    const isSelf = req.user.id === id;

    if (!isAdminOrHR && !isSelf) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const documents = await Document.find({ employee: id })
      .populate('uploadedBy', 'name')
      .sort({ uploadedAt: -1 });

    res.json({ success: true, count: documents.length, documents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route   POST /api/employees/:id/documents
// @desc    Upload a document for an employee
// @access  Private (admin, hr, or self)
const uploadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdminOrHR = ['admin', 'hr'].includes(req.user.role);
    const isSelf = req.user.id === id;

    if (!isAdminOrHR && !isSelf) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { name, category } = req.body;
    if (!name || !name.trim()) {
      // Remove uploaded file if validation fails
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ success: false, message: 'Document name is required' });
    }

    const document = await Document.create({
      employee: id,
      name: name.trim(),
      fileType: getFileType(req.file.mimetype),
      filePath: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      uploadedBy: req.user._id,
      category: category || 'other',
    });

    const populated = await Document.findById(document._id).populate('uploadedBy', 'name');

    res.status(201).json({ success: true, message: 'Document uploaded successfully', document: populated });
  } catch (err) {
    // Clean up file if DB save fails
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route   DELETE /api/documents/:docId
// @desc    Delete a document record and its file
// @access  Private (admin, hr only)
const deleteDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    const isAdminOrHR = ['admin', 'hr'].includes(req.user.role);

    if (!isAdminOrHR) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const document = await Document.findById(docId);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Delete physical file
    const filePath = path.join(__dirname, '../uploads/documents', document.filePath);
    fs.unlink(filePath, (err) => {
      if (err) console.warn('File not found for deletion:', filePath);
    });

    await Document.findByIdAndDelete(docId);

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route   GET /api/documents/:docId/download
// @desc    Stream document as attachment
// @access  Private (admin, hr, or owner)
const downloadDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    const isAdminOrHR = ['admin', 'hr'].includes(req.user.role);

    const document = await Document.findById(docId);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const isSelf = req.user.id === document.employee.toString();
    if (!isAdminOrHR && !isSelf) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const filePath = path.join(__dirname, '../uploads/documents', document.filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    res.download(filePath, document.originalName || document.name);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDocuments, uploadDocument, deleteDocument, downloadDocument };
