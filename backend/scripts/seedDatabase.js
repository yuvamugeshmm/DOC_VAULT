const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const seedDatabase = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        if (!MONGODB_URI) {
            console.error('❌ MONGODB_URI is not defined in .env');
            return;
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing users
        console.log('Cleaning existing users...');
        await User.deleteMany({});

        const users = [
            {
                studentId: 'admin',
                password: 'admin123',
                name: 'Administrator',
                role: 'admin',
                email: 'admin@example.com'
            },
            {
                studentId: '714023205172',
                password: 'student123',
                name: 'Premium Student',
                role: 'student',
                email: 'student@example.com',
                yearOfJoining: '2023',
                department: 'Computer Science',
                year: '3rd Year'
            }
        ];

        console.log('Seeding initial users...');
        for (const userData of users) {
            // Password hashing is handled by the User model's pre-save hook
            const user = new User(userData);
            await user.save();
            console.log(`✅ Created ${userData.role}: ${userData.studentId}`);
        }

        console.log('✨ Database seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
