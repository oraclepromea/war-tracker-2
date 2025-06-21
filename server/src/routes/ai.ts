import express, { Request, Response } from 'express';
import { openRouterService } from '../services/openRouter';
import { Event } from '../models/Event';
import { logger } from '../utils/logger';

const router = express.Router();

// POST /api/ai/analyze - Analyze text for conflict events
router.post('/analyze', async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, source } = req.body;

    if (!text) {
      res.status(400).json({ success: false, error: 'Text is required' });
      return;
    }

    const analysis = await openRouterService.analyzeNewsArticle(text);
    
    if (!analysis) {
      res.json({ 
        success: true, 
        data: null, 
        message: 'Text does not appear to be conflict-related' 
      });
      return;
    }

    // Verify credibility if source provided
    let credibilityScore = 0.5;
    if (source) {
      credibilityScore = await openRouterService.verifyEventCredibility([source], text);
    }

    res.json({
      success: true,
      data: {
        ...analysis,
        credibilityScore,
        aiGenerated: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('AI analysis error:', error);
    res.status(500).json({ success: false, error: 'Analysis failed' });
  }
});

// GET /api/ai/threat-assessment - Get current threat assessment
router.get('/threat-assessment', async (req: Request, res: Response) => {
  try {
    const recentEvents = await Event.find({
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).sort({ timestamp: -1 }).limit(20);

    const assessment = await openRouterService.generateThreatAssessment(recentEvents);

    res.json({
      success: true,
      data: {
        assessment,
        basedOnEvents: recentEvents.length,
        generatedAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
      }
    });

  } catch (error) {
    logger.error('Threat assessment error:', error);
    res.status(500).json({ success: false, error: 'Threat assessment failed' });
  }
});

// POST /api/ai/verify - Verify event credibility
router.post('/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sources, content } = req.body;

    if (!sources || !content) {
      res.status(400).json({ 
        success: false, 
        error: 'Sources and content are required' 
      });
      return;
    }

    const credibilityScore = await openRouterService.verifyEventCredibility(sources, content);

    res.json({
      success: true,
      data: {
        credibilityScore,
        confidence: credibilityScore > 0.8 ? 'high' : 
                   credibilityScore > 0.6 ? 'medium' : 'low',
        verified: credibilityScore > 0.7,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Credibility verification error:', error);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

export default router;