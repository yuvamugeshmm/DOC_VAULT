const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Document = require('../models/Document');
const { auth } = require('../middleware/auth');
const { validateFile, generateFilename, ensureDirectory } = require('../utils/fileUtils');
const { logAction } = require('../utils/auditLogger');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Upload document
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const validation = validateFile(req.file);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { category } = req.body;
    if (!category || !category.trim()) {
      return res.status(400).json({ error: 'Category is required' });
    }

    const studentId = req.user.studentId;
    const uploadDir = path.join(__dirname, '../uploads', studentId, category.trim());
    await ensureDirectory(uploadDir);

    const filename = generateFilename(req.file.originalname, studentId);
    const filePath = path.join(uploadDir, filename);

    // Write file to disk
    await fs.writeFile(filePath, req.file.buffer);

    // Save document metadata
    const document = await Document.create({
      studentId,
      filename,
      originalFilename: req.file.originalname,
      filePath,
      category: category.trim(),
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });

    await logAction(studentId, 'upload', {
      documentId: document._id,
      filename: document.originalFilename,
      category: document.category
    }, req);

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        id: document._id,
        originalFilename: document.originalFilename,
        category: document.category,
        fileSize: document.fileSize,
        uploadedAt: document.uploadedAt
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Get own documents with pagination, search, and filter
router.get('/my-documents', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';

    const query = { studentId: req.user.studentId };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { originalFilename: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const documents = await Document.find(query)
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-filePath');

    const total = await Document.countDocuments(query);

    res.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get categories for current user
router.get('/categories', auth, async (req, res) => {
  try {
    const categories = await Document.distinct('category', {
      studentId: req.user.studentId
    });
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// View document (inline - for viewing in browser)
router.get('/view/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Verify ownership
    if (document.studentId !== req.user.studentId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if file exists
    try {
      await fs.access(document.filePath);
    } catch {
      return res.status(404).json({ error: 'File not found on server' });
    }

    await logAction(req.user.studentId, 'download', {
      documentId: document._id,
      filename: document.originalFilename,
      action: 'view'
    }, req);

    // Set headers for inline viewing
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${document.originalFilename}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    const fileBuffer = await fs.readFile(document.filePath);
    res.send(fileBuffer);
  } catch (error) {
    console.error('View error:', error);
    res.status(500).json({ error: 'Failed to view document' });
  }
});

// Download document (with ownership verification)
router.get('/download/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Verify ownership
    if (document.studentId !== req.user.studentId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if file exists
    try {
      await fs.access(document.filePath);
    } catch {
      return res.status(404).json({ error: 'File not found on server' });
    }

    await logAction(req.user.studentId, 'download', {
      documentId: document._id,
      filename: document.originalFilename
    }, req);

    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalFilename}"`);

    const fileBuffer = await fs.readFile(document.filePath);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

// Delete own document
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Verify ownership (students can only delete their own)
    if (document.studentId !== req.user.studentId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete file from disk
    try {
      await fs.unlink(document.filePath);
    } catch (error) {
      console.error('File deletion error:', error);
    }

    await Document.findByIdAndDelete(req.params.id);

    await logAction(req.user.studentId, 'delete', {
      documentId: document._id,
      filename: document.originalFilename,
      studentId: document.studentId
    }, req);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Get document statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const studentId = req.user.studentId;

    // Total documents count
    const totalDocuments = await Document.countDocuments({ studentId });

    // Total storage used (sum of fileSizes)
    const stats = await Document.aggregate([
      { $match: { studentId } },
      { $group: { _id: null, totalBytes: { $sum: "$fileSize" } } }
    ]);
    const totalBytes = stats.length > 0 ? stats[0].totalBytes : 0;

    // Recent uploads (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUploads = await Document.countDocuments({
      studentId,
      uploadedAt: { $gte: sevenDaysAgo }
    });

    res.json({
      totalDocuments,
      totalBytes,
      recentUploads,
      storageLimit: 100 * 1024 * 1024 // 100MB limit for now
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
