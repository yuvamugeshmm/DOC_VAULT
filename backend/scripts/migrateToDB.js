const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const Document = require('../models/Document');
const User = require('../models/User');
require('dotenv').config();

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Migrate Documents
        const documents = await Document.find({ filePath: { $ne: 'DATABASE_STORED' } });
        console.log(`Found ${documents.length} documents to migrate`);

        for (const doc of documents) {
            try {
                const absolutePath = path.resolve(doc.filePath);
                const fileBuffer = await fs.readFile(absolutePath);

                doc.fileData = fileBuffer;
                doc.filePath = 'DATABASE_STORED';
                await doc.save();
                console.log(`Migrated document: ${doc.originalFilename}`);
            } catch (err) {
                console.error(`Failed to migrate document ${doc._id}: ${err.message}`);
            }
        }

        // 2. Migrate Profile Photos
        const users = await User.find({
            profilePhoto: { $exists: true, $ne: null, $ne: 'DATABASE_STORED' }
        });
        console.log(`Found ${users.length} profile photos to migrate`);

        for (const user of users) {
            try {
                const absolutePath = path.resolve(user.profilePhoto);
                const photoBuffer = await fs.readFile(absolutePath);

                // Guess mimetype from extension if possible, default to image/jpeg
                const ext = path.extname(user.profilePhoto).toLowerCase();
                let mimeType = 'image/jpeg';
                if (ext === '.png') mimeType = 'image/png';
                if (ext === '.gif') mimeType = 'image/gif';
                if (ext === '.webp') mimeType = 'image/webp';

                user.profilePhotoData = photoBuffer;
                user.profilePhotoMimeType = mimeType;
                user.profilePhoto = 'DATABASE_STORED';
                await user.save();
                console.log(`Migrated profile photo for student: ${user.studentId}`);
            } catch (err) {
                console.error(`Failed to migrate profile photo for student ${user.studentId}: ${err.message}`);
            }
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
