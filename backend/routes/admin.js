const express = require('express');
const { body, validationResult } = require('express-validator');
const Document = require('../models/Document');
const User = require('../models/User');
const { auth, requireAdmin } = require('../middleware/auth');
const { logAction } = require('../utils/auditLogger');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(auth);
router.use(requireAdmin);

// Get all documents
router.get('/documents', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const studentId = req.query.studentId || '';

    const query = {};

    if (category) {
      query.category = category;
    }

    if (studentId) {
      query.studentId = { $regex: studentId, $options: 'i' };
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
    console.error('Admin get documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Delete any document
router.delete('/documents/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const fs = require('fs').promises;
    try {
      await fs.unlink(document.filePath);
    } catch (error) {
      console.error('File deletion error:', error);
    }

    await Document.findByIdAndDelete(req.params.id);

    await logAction(req.user.studentId, 'delete', {
      documentId: document._id,
      filename: document.originalFilename,
      studentId: document.studentId,
      deletedBy: 'admin'
    }, req);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Admin delete error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Reset student password
router.post('/reset-password', [
  body('studentId').trim().notEmpty().withMessage('Student ID is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { studentId, newPassword } = req.body;

    const user = await User.findOne({ studentId, role: 'student' });
    if (!user) {
      return res.status(404).json({ error: 'Student not found' });
    }

    user.password = newPassword;
    await user.save();

    await logAction(req.user.studentId, 'password_reset', {
      targetStudentId: studentId
    }, req);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Get all students
router.get('/students', async (req, res) => {
  try {
    const search = req.query.search || '';
    const query = { role: 'student' };

    if (search) {
      query.$or = [
        { studentId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await User.find(query)
      .select('studentId name email createdAt department year')
      .sort({ createdAt: -1 });

    res.json({ students });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Create new student
router.post('/students', [
  body('studentId').trim().notEmpty().withMessage('Student ID is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email'),
  body('department').optional({ checkFalsy: true }).trim(),
  body('year').optional({ checkFalsy: true }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { studentId, password, name, email, department, year } = req.body;

    // Check if student ID already exists
    const existingUser = await User.findOne({ studentId });
    if (existingUser) {
      return res.status(400).json({ error: 'Student ID already exists' });
    }

    const newUser = new User({
      studentId,
      password,
      name,
      email,
      department,
      year,
      role: 'student'
    });

    await newUser.save();

    await logAction(req.user.studentId, 'create_user', {
      targetStudentId: studentId,
      name
    }, req);

    res.status(201).json({
      message: 'Student created successfully',
      user: {
        studentId: newUser.studentId,
        name: newUser.name
      }
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// Delete student and all associated data
router.get('/students/:id/delete-verification', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'student') {
      return res.status(404).json({ error: 'Student not found' });
    }
    const docCount = await Document.countDocuments({ studentId: user.studentId });
    res.json({ studentId: user.studentId, name: user.name, documentCount: docCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify student deletion' });
  }
});

router.delete('/students/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (user.role !== 'student') {
      return res.status(403).json({ error: 'Only student accounts can be deleted' });
    }

    const fs = require('fs').promises;
    const path = require('path');

    // 1. Get and delete all student documents
    const documents = await Document.find({ studentId: user.studentId });

    for (const doc of documents) {
      try {
        if (doc.filePath) {
          const absolutePath = path.resolve(doc.filePath);
          await fs.unlink(absolutePath).catch(err => console.error(`Failed to delete file: ${absolutePath}`, err));
        }
      } catch (err) {
        console.error(`Error processing file deletion for ${doc._id}:`, err);
      }
    }

    await Document.deleteMany({ studentId: user.studentId });

    // 2. Delete profile photo if exists
    if (user.profilePhoto) {
      try {
        const absolutePhotoPath = path.resolve(user.profilePhoto);
        await fs.unlink(absolutePhotoPath).catch(err => console.error(`Failed to delete profile photo: ${absolutePhotoPath}`, err));
      } catch (err) {
        console.error(`Error processing profile photo deletion for student ${user.studentId}:`, err);
      }
    }

    // 3. Delete the student record
    await User.findByIdAndDelete(req.params.id);

    // 4. Log the action
    await logAction(req.user.studentId, 'delete_student', {
      deletedStudentId: user.studentId,
      deletedStudentName: user.name,
      documentCount: documents.length
    }, req);

    res.json({
      message: 'Student and all associated data deleted successfully',
      deletedStudent: user.studentId
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Failed to delete student and associated data' });
  }
});

module.exports = router;
