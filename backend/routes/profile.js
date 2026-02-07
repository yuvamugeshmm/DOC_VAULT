const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { ensureDirectory } = require('../utils/fileUtils');

const router = express.Router();

// Configure multer for profile photo
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads', 'profiles');
    await ensureDirectory(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.user.studentId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB - increased for better quality images
  fileFilter: (req, file, cb) => {
    // Accept all common image formats
    const allowedTypes = /jpeg|jpg|png|gif|webp|bmp|svg|ico/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /^image\//.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WEBP, BMP, SVG, ICO)'));
  }
});

// Get profile
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update profile
router.put('/', auth, async (req, res) => {
  try {
    const { name, email, yearOfJoining, dateOfBirth, department, year } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (yearOfJoining) updateData.yearOfJoining = yearOfJoining;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (department) updateData.department = department;
    if (year) updateData.year = year;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Upload profile photo
router.post('/photo', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo provided' });
    }

    const user = await User.findById(req.user._id);
    
    // Delete old photo if exists
    if (user.profilePhoto) {
      try {
        await fs.unlink(user.profilePhoto);
      } catch (err) {
        console.error('Error deleting old photo:', err);
      }
    }

    // Update user with new photo path
    user.profilePhoto = req.file.path;
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
    
    if (!user || !user.profilePhoto) {
      return res.status(404).json({ error: 'Profile photo not found' });
    }

    try {
      await fs.access(user.profilePhoto);
    } catch {
      return res.status(404).json({ error: 'Photo file not found' });
    }

    res.sendFile(path.resolve(user.profilePhoto));
  } catch (error) {
    console.error('Get photo error:', error);
    res.status(500).json({ error: 'Failed to get profile photo' });
  }
});

module.exports = router;
