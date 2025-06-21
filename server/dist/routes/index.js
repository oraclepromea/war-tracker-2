"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const events_1 = require("../controllers/events");
const news_1 = require("../controllers/news");
const newsAggregator_1 = require("../jobs/newsAggregator");
const router = (0, express_1.Router)();
// Events routes
router.get('/events', events_1.EventsController.getEvents);
router.get('/events/recent', events_1.EventsController.getRecentEvents);
router.get('/events/:id', events_1.EventsController.getEventById);
// News routes  
router.get('/news', news_1.NewsController.getNews);
router.get('/news/latest', news_1.NewsController.getLatestNews);
// Job routes (for development/testing)
router.post('/jobs/news', async (req, res) => {
    try {
        const result = await newsAggregator_1.NewsAggregatorJob.fetchAndIngest();
        res.json({
            success: true,
            message: 'News aggregation completed',
            data: result
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'NEWS_AGGREGATION_ERROR',
                message: error.message || 'Failed to run news aggregation'
            }
        });
    }
});
// Health check for API
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map