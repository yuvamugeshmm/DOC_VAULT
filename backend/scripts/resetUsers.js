const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function resetUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student_document_store');
    console.log('Connected to MongoDB\n');

    // Delete existing users
    console.log('Deleting existing admin and student users...');
    await User.deleteMany({ studentId: { $in: ['admin', '714023205119'] } });
    console.log('✓ Existing users deleted\n');

    // Create admin user
    console.log('Creating admin user...');
    const admin = new User({
      studentId: 'admin',
      password: 'admin123', // Will be hashed automatically
      role: 'admin',
      name: 'Administrator'
    });
    await admin.save();
    console.log('✓ Admin user created');

    // Create sample student
    console.log('Creating student user...');
    const student = new User({
      studentId: '714023205119',
      password: 'student123',
      role: 'student',
      name: 'John Doe',
      email: 'john@example.com'
    });
    await student.save();
    console.log('✓ Student user created\n');

    console.log('═══════════════════════════════════════');
    console.log('  DEFAULT LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('ADMIN LOGIN:');
    console.log('  ID:       admin');
    console.log('  Password: admin123');
    console.log('');
    console.log('STUDENT LOGIN:');
    console.log('  ID:       714023205119');
    console.log('  Password: student123');
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('⚠️  Please change these passwords in production!');
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('Error resetting users:', error);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n✗ MongoDB connection failed!');
      console.error('Make sure MongoDB is running.');
    }
    process.exit(1);
  }
}

resetUsers();
