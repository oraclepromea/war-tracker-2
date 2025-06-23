import { Router } from 'express';

const router = Router();

// This route is no longer needed since RSS functionality moved to backend/server.js
// All news API endpoints are now handled by the main backend server
router.get('/', (req, res) => {
  res.json({ 
    message: 'News routes moved to backend/server.js',
    redirectTo: 'Use the main backend API at /api/news'
  });
});

export default router;