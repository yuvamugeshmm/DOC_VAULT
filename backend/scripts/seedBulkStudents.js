const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function seedStudents() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student_document_store');
        console.log('Connected to MongoDB');

        console.log('Starting bulk user creation (714023205119 to 714023205174)...');

        let createdCount = 0;
        let skippedCount = 0;

        for (let i = 714023205119; i <= 714023205174; i++) {
            const studentId = i.toString();

            const existing = await User.findOne({ studentId });
            if (!existing) {
                const student = new User({
                    studentId,
                    password: 'student123',
                    role: 'student',
                    name: `Student ${i}`,
                    email: `student${i}@example.com`
                });
                await student.save();
                createdCount++;
            } else {
                skippedCount++;
            }

            if (createdCount % 20 === 0 && createdCount > 0) console.log(`Processed ${createdCount} users...`);
        }

        console.log('\n--- Seeding Complete ---');
        console.log(`Created: ${createdCount} new students`);
        console.log(`Skipped: ${skippedCount} existing students`);
        console.log('Default Password for all: student123');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    }
}

seedStudents();
