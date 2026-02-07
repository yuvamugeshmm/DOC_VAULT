const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { logAction } = require('../utils/auditLogger');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured. Please set it in .env file');
  }
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Student Login
router.post('/login', [
  body('studentId').trim().notEmpty().withMessage('Student ID is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  console.log('Login route hit for ID:', req.body.studentId);
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { studentId, password } = req.body;

    const user = await User.findOne({ studentId });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 3600000, // 1 hour
      path: '/'
    });

    // Log login
    await logAction(user.studentId, 'login', { role: user.role }, req);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        studentId: user.studentId,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Admin Login
router.post('/admin/login', [
  body('studentId').trim().notEmpty().withMessage('Admin ID is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { studentId, password } = req.body;

    const user = await User.findOne({ studentId, role: 'admin' });
    if (!user) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const token = generateToken(user._id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 3600000,
      path: '/'
    });

    await logAction(user.studentId, 'login', { role: 'admin' }, req);

    res.json({
      message: 'Admin login successful',
      user: {
        id: user._id,
        studentId: user.studentId,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
});

// Get current user
router.get('/me', auth, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      studentId: req.user.studentId,
      role: req.user.role,
      name: req.user.name,
      email: req.user.email,
      profilePhoto: req.user.profilePhoto,
      yearOfJoining: req.user.yearOfJoining,
      dateOfBirth: req.user.dateOfBirth,
      department: req.user.department,
      year: req.user.year
    }
  });
});

// Register new student
router.post('/register', [
  body('studentId').trim().notEmpty().withMessage('Student ID is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { studentId, password, name, email } = req.body;

    const existingUser = await User.findOne({ studentId });
    if (existingUser) {
      return res.status(400).json({ error: 'Student ID already exists' });
    }

    const newUser = new User({
      studentId,
      password,
      name,
      email,
      role: 'student'
    });

    await newUser.save();

    // Log registration
    await logAction(studentId, 'register', { role: 'student' }, req);

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: newUser._id,
        studentId: newUser.studentId,
        role: newUser.role,
        name: newUser.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;
