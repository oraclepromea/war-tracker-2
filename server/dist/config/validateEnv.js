"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnvironment = validateEnvironment;
exports.getConfig = getConfig;
function validateEnvironment() {
    const required = [
        'DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_NAME',
        'ACLED_API_KEY', 'ACLED_EMAIL', 'NEWSAPI_KEY'
    ];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`);
        console.log('💡 Create a .env file with the required variables for full functionality');
        // Don't throw error - allow app to run with limited functionality
    }
    else {
        console.log('✅ Environment validation passed');
    }
}
function getConfig() {
    return {
        database: {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            username: process.env.DB_USERNAME || 'war_tracker',
            password: process.env.DB_PASSWORD || 'your_password',
            name: process.env.DB_NAME || 'war_tracker_db'
        },
        redis: {
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        },
        apis: {
            acled: {
                key: process.env.ACLED_API_KEY,
                email: process.env.ACLED_EMAIL
            },
            newsapi: {
                key: process.env.NEWSAPI_KEY
            },
            guardian: {
                key: process.env.GUARDIAN_API_KEY
            }
        },
        app: {
            nodeEnv: process.env.NODE_ENV || 'development',
            port: parseInt(process.env.PORT || '3001'),
            frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
        },
        jobs: {
            enabled: process.env.ENABLE_JOBS === 'true',
            concurrency: parseInt(process.env.JOB_CONCURRENCY || '3')
        }
    };
}
//# sourceMappingURL=validateEnv.js.map