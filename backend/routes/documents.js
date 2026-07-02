const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const {
  getDocuments,
  uploadDocument,
  deleteDocument,
  downloadDocument,
} = require('../controllers/documentController');

// ── Multer config ──────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/documents'));
  },
  filename: (req, file, cb) => {
    // Sanitize: strip special chars, keep extension
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_\-]/g, '_')
      .slice(0, 60);
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Supported: PDF, images, Word, Excel, text files.'), false);
    }
  },
});

// Employee-scoped document routes
router.get('/employees/:id/documents', protect, getDocuments);
router.post('/employees/:id/documents', protect, upload.single('file'), uploadDocument);

// Document-level routes
router.delete('/documents/:docId', protect, deleteDocument);
router.get('/documents/:docId/download', protect, downloadDocument);

module.exports = router;
