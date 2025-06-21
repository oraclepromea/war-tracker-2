"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const validateEnv_1 = require("./config/validateEnv");
const index_1 = __importDefault(require("./routes/index"));
const newsAggregator_1 = require("./jobs/newsAggregator");
dotenv_1.default.config();
async function startServer() {
    // Validate environment
    (0, validateEnv_1.validateEnvironment)();
    const config = (0, validateEnv_1.getConfig)();
    const app = (0, express_1.default)();
    // Middleware
    app.use((0, cors_1.default)({
        origin: config.app.frontendUrl,
        credentials: true
    }));
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true }));
    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: config.app.nodeEnv
        });
    });
    // API routes
    app.use('/api', index_1.default);
    // Test job endpoint (for development)
    app.post('/api/jobs/news', async (req, res) => {
        try {
            const result = await newsAggregator_1.NewsAggregatorJob.fetchAndIngest();
            res.json({
                success: true,
                message: 'News aggregation job completed',
                result
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    try {
        // Initialize database
        await (0, database_1.initializeDatabase)();
        // Run initial news sync if jobs are enabled
        if (config.jobs.enabled) {
            console.log('🔄 Running initial news sync...');
            setTimeout(async () => {
                try {
                    await newsAggregator_1.NewsAggregatorJob.fetchAndIngest();
                }
                catch (error) {
                    console.warn('Initial news sync failed:', error);
                }
            }, 5000); // Wait 5 seconds after server start
        }
        // Start server
        app.listen(config.app.port, () => {
            console.log(`🚀 Server running on port ${config.app.port}`);
            console.log(`📊 Environment: ${config.app.nodeEnv}`);
            console.log(`🌐 Frontend URL: ${config.app.frontendUrl}`);
            console.log(`⚙️  Jobs enabled: ${config.jobs.enabled}`);
            console.log(`📡 API endpoints available at http://localhost:${config.app.port}/api`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
startServer();
//# sourceMappingURL=index.js.map