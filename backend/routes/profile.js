const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { ensureDirectory } = require('../utils/fileUtils');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|bmp|svg|ico/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /^image\//.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// ... existing GET / route ...

// Upload profile photo
router.post('/photo', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo provided' });
    }

    const user = await User.findById(req.user._id);

    // Delete old photo if it was on disk
    if (user.profilePhoto && user.profilePhoto !== 'DATABASE_STORED') {
      try {
        await fs.unlink(user.profilePhoto);
      } catch (err) {
        console.error('Error deleting old photo:', err);
      }
    }

    // Update user with new photo data
    user.profilePhoto = 'DATABASE_STORED';
    user.profilePhotoData = req.file.buffer;
    user.profilePhotoMimeType = req.file.mimetype;
    await user.save();

    res.json({
      message: 'Profile photo uploaded successfully',
      profilePhoto: user.profilePhoto
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ error: 'Failed to upload profile photo' });
  }
});

// Get profile photo
router.get('/photo', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.profilePhotoData) {
      res.setHeader('Content-Type', user.profilePhotoMimeType || 'image/jpeg');
      return res.send(user.profilePhotoData);
    }

    if (user.profilePhoto && user.profilePhoto !== 'DATABASE_STORED') {
      try {
        await fs.access(user.profilePhoto);
        return res.sendFile(path.resolve(user.profilePhoto));
      } catch {
        return res.status(404).json({ error: 'Photo file not found on disk' });
      }
    }

    res.status(404).json({ error: 'Profile photo not found' });
  } catch (error) {
    console.error('Get photo error:', error);
    res.status(500).json({ error: 'Failed to get profile photo' });
  }
});

module.exports = router;
