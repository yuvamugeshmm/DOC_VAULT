const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function testLogin() {
  try {
    console.log('Testing login setup...\n');
    
    // Check MongoDB connection
    console.log('1. Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student_document_store');
    console.log('✓ MongoDB connected\n');
    
    // Check JWT_SECRET
    console.log('2. Checking JWT_SECRET...');
    if (!process.env.JWT_SECRET) {
      console.log('✗ JWT_SECRET is not set in .env file!');
      console.log('  Add: JWT_SECRET=your_super_secret_jwt_key_change_this_in_production\n');
    } else {
      console.log('✓ JWT_SECRET is set\n');
    }
    
    // Test student login
    console.log('3. Testing student login...');
    const student = await User.findOne({ studentId: 'STU001' });
    if (student) {
      const isMatch = await student.comparePassword('student123');
      if (isMatch) {
        console.log('✓ Student login credentials are correct\n');
      } else {
        console.log('✗ Student password does not match!\n');
      }
    } else {
      console.log('✗ Student user (STU001) not found!');
      console.log('  Run: node scripts/createUser.js\n');
    }
    
    // Test admin login
    console.log('4. Testing admin login...');
    const admin = await User.findOne({ studentId: 'admin', role: 'admin' });
    if (admin) {
      const isMatch = await admin.comparePassword('admin123');
      if (isMatch) {
        console.log('✓ Admin login credentials are correct\n');
      } else {
        console.log('✗ Admin password does not match!\n');
      }
    } else {
      console.log('✗ Admin user (admin) not found!');
      console.log('  Run: node scripts/createUser.js\n');
    }
    
    console.log('═══════════════════════════════════════');
    console.log('  QUICK FIXES:');
    console.log('═══════════════════════════════════════');
    console.log('If users are missing:');
    console.log('  node scripts/createUser.js');
    console.log('');
    console.log('If JWT_SECRET is missing:');
    console.log('  Add to backend/.env:');
    console.log('  JWT_SECRET=your_super_secret_jwt_key_change_this_in_production');
    console.log('═══════════════════════════════════════\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\nMake sure MongoDB is running!');
    }
    process.exit(1);
  }
}

testLogin();
