"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = exports.AppDataSource = void 0;
exports.initializeDatabase = initializeDatabase;
require("reflect-metadata");
const mongoose_1 = __importDefault(require("mongoose"));
const typeorm_1 = require("typeorm");
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("../utils/logger");
const Event_1 = require("../models/Event");
const Attack_1 = require("../models/Attack");
const Weapon_1 = require("../models/Weapon");
const NewsItem_1 = require("../models/NewsItem");
dotenv_1.default.config();
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'war_tracker',
    password: process.env.DB_PASSWORD || 'your_password',
    database: process.env.DB_NAME || 'war_tracker_db',
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development',
    entities: [Event_1.Event, Attack_1.Attack, Weapon_1.Weapon, NewsItem_1.NewsItem],
    migrations: ['src/migrations/*.ts'],
    subscribers: ['src/subscribers/*.ts'],
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
const connectDatabase = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/war-tracker';
        await mongoose_1.default.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        });
        logger_1.logger.info('Connected to MongoDB successfully');
    }
    catch (error) {
        logger_1.logger.warn('MongoDB connection failed - running in offline mode:', error);
        // Don't exit the process, just log the warning
        // The app can still run without database for demo purposes
    }
};
exports.connectDatabase = connectDatabase;
async function initializeDatabase() {
    try {
        await exports.AppDataSource.initialize();
        console.log('✅ Database connection established');
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        throw error;
    }
}
//# sourceMappingURL=database.js.map