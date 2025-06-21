import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/war-tracker';
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    
    logger.info('Connected to MongoDB successfully');
  } catch (error) {
    logger.warn('MongoDB connection failed - running in offline mode:', error);
    // Don't exit the process, just log the warning
    // The app can still run without database for demo purposes
  }
};