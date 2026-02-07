const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function checkSetup() {
  try {
    console.log('Checking setup...\n');
    
    // Check MongoDB connection
    console.log('1. Checking MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student_document_store', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ MongoDB connected\n');
    
    // Check for admin user
    console.log('2. Checking for admin user...');
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      console.log(`✓ Admin user found: ${admin.studentId}`);
    } else {
      console.log('✗ No admin user found. Run: node scripts/createUser.js');
    }
    
    // Check for students
    console.log('\n3. Checking for student users...');
    const students = await User.find({ role: 'student' });
    if (students.length > 0) {
      console.log(`✓ Found ${students.length} student(s)`);
      students.forEach(s => console.log(`  - ${s.studentId}`));
    } else {
      console.log('✗ No students found. Run: node scripts/createUser.js');
    }
    
    console.log('\n✓ Setup check complete!');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Setup check failed:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\nMake sure MongoDB is running!');
      console.error('  - Windows: MongoDB should start automatically if installed as service');
      console.error('  - Linux/Mac: Run "mongod" in a terminal');
      console.error('  - Or use MongoDB Atlas connection string in .env file');
    }
    process.exit(1);
  }
}

checkSetup();
