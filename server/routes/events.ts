import express from 'express';
import { EnhancedDataSourceManager } from '../src/services/enhancedDataSources';

const router = express.Router();
const dataSourceManager = EnhancedDataSourceManager.getInstance();

// Get AI-enhanced events with classification and analysis
router.get('/', async (req, res) => {
  try {
    const enhancedEvents = await dataSourceManager.fetchAllSources();
    res.json(enhancedEvents);
  } catch (error) {
    console.error('Error fetching AI-enhanced events:', error);
    res.status(500).json({ error: 'Failed to fetch AI-enhanced events' });
  }
});

// Get conflict predictions for all regions
router.get('/predictions', async (req, res) => {
  try {
    const predictions = await dataSourceManager.getRegionalPredictions('global');
    res.json({ success: true, predictions });
  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch conflict predictions' });
  }
});

// Get conflict prediction for specific region
router.get('/predictions/:region', async (req, res) => {
  try {
    const { region } = req.params;
    const predictions = await dataSourceManager.getRegionalPredictions(region);
    res.json({ success: true, predictions });
  } catch (error) {
    console.error('Regional predictions error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : String(error) });
  }
});

// Get data sources configuration
router.get('/sources', async (req, res) => {
  try {
    const sources = dataSourceManager.getDataSources();
    res.json(sources);
  } catch (error) {
    console.error('Error fetching data sources:', error);
    res.status(500).json({ error: 'Failed to fetch data sources' });
  }
});

// Update data source configuration
router.put('/sources/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const success = dataSourceManager.updateDataSource(id, updates);
    
    if (success) {
      res.json({ message: 'Data source updated successfully' });
    } else {
      res.status(404).json({ error: 'Data source not found' });
    }
  } catch (error) {
    console.error('Error updating data source:', error);
    res.status(500).json({ error: 'Failed to update data source' });
  }
});

export default router;

export interface Event {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  source: string;
  confidence: number;
  location: { latitude: number; longitude: number } | string;
  type: 'news' | 'government' | 'social' | 'telegram' | 'multilang';
  classification?: {
    category?: string;
    confidence?: number;
    sentiment?: string;
    escalationRisk?: string;
    similarEvents?: string[];
  };
  language?: string;
  link?: string;
  category?: string;
  severity?: number;
}