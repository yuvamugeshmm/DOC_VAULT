const mongoose = require('mongoose');

// Cached connection promise
let cachedPromise = null;

const connectDB = async () => {
    if (cachedPromise) {
        return cachedPromise;
    }

    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
        throw new Error('Please define the MONGODB_URI environment variable inside .env');
    }

    const opts = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        bufferCommands: false,
    };

    cachedPromise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
        console.log('✅ New MongoDB Connection Established');
        return mongoose;
    });

    try {
        const mongooseInstance = await cachedPromise;
        return mongooseInstance;
    } catch (e) {
        cachedPromise = null;
        throw e;
    }
};

module.exports = connectDB;
