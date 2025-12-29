import mongoose from 'mongoose';
import { MONGO_URI } from './config.js';

const connectDB = async () => {
    try {
        // Remove deprecated options
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

export default connectDB;
