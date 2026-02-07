const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function createUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student_document_store');
    console.log('Connected to MongoDB');

    // Create admin user
    const existingAdmin = await User.findOne({ studentId: 'admin' });
    if (!existingAdmin) {
      const admin = new User({
        studentId: 'admin',
        password: 'admin123', // Will be hashed automatically
        role: 'admin',
        name: 'Administrator'
      });
      await admin.save();
      console.log('Admin user created - ID: admin, Password: admin123');
    } else {
      console.log('Admin user already exists');
    }

    // Create sample student
    const existingStudent = await User.findOne({ studentId: '714023205119' });
    if (!existingStudent) {
      const student = new User({
        studentId: '714023205119',
        password: 'student123',
        role: 'student',
        name: 'John Doe',
        email: 'john@example.com'
      });
      await student.save();
      console.log('Student user created - ID: 714023205119, Password: student123');
    } else {
      console.log('Student user already exists');
    }

    console.log('\nDefault credentials:');
    console.log('Admin - ID: admin, Password: admin123');
    console.log('Student - ID: 714023205119, Password: student123');
    console.log('\n⚠️  Please change these passwords in production!');

    process.exit(0);
  } catch (error) {
    console.error('Error creating users:', error);
    process.exit(1);
  }
}

createUser();
