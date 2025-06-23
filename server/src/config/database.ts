import 'reflect-metadata';
import mongoose from 'mongoose';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';
import { Event } from '../models/Event';
import { Attack } from '../models/Attack';
import { Weapon } from '../models/Weapon';
import { NewsItem } from '../models/NewsItem';

dotenv.config();

const validateEnvVars = () => {
  const required = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_NAME'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    console.log('💡 Create a .env file in the server directory with these variables');
    process.exit(1);
  }
};

validateEnvVars();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'war_tracker',
  password: process.env.DB_PASSWORD || 'your_password',
  database: process.env.DB_NAME || 'war_tracker_db',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [Event, Attack, Weapon, NewsItem],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

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

export async function initializeDatabase(): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}