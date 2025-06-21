import axios from 'axios';
import { logger } from '../utils/logger';

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

interface EventAnalysis {
  severity: 'low' | 'medium' | 'high' | 'critical';
  casualties: number;
  location: {
    country: string;
    city: string;
    coordinates: [number, number];
  };
  eventType: string;
  verified: boolean;
  summary: string;
}

interface NewsAnalysis {
  title: string;
  description: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    country: string;
    city: string;
    coordinates?: number[];
  };
  casualties: number;
  timestamp: Date;
}

interface ThreatAssessment {
  overallLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  factors: string[];
  recommendations: string[];
  confidence: number;
}

class OpenRouterService {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      logger.warn('OpenRouter API key not configured');
    }
  }

  async analyzeNewsArticle(article: string): Promise<EventAnalysis | null> {
    try {
      const prompt = `
        Analyze this Middle East conflict-related news article and extract structured data.
        Focus on Israel, Palestine, Gaza, Lebanon, Iran, and surrounding regions.
        
        Article: "${article}"
        
        Return a JSON object with:
        - severity: "low", "medium", "high", or "critical"
        - casualties: number (0 if none mentioned)
        - location: {country, city, coordinates: [lat, lng]}
        - eventType: brief description of event type
        - verified: boolean (based on source credibility)
        - summary: 2-sentence summary
        
        If this is not a Middle East conflict event, return null.
      `;

      const response = await axios.post<OpenRouterResponse>(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            {
              role: 'system',
              content: 'You are a military intelligence analyst specializing in Middle East conflicts. Return only valid JSON or null.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.1
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://war-tracker.com',
            'X-Title': 'War Tracker 2.0'
          }
        }
      );

      const content = response.data.choices[0]?.message?.content;
      if (!content) return null;

      // Try to parse JSON response
      try {
        const analysis = JSON.parse(content);
        return analysis;
      } catch (parseError) {
        logger.error('Failed to parse OpenRouter response:', parseError);
        return null;
      }

    } catch (error) {
      logger.error('OpenRouter API error:', error);
      return null;
    }
  }

  async generateThreatAssessment(events: any[]): Promise<string> {
    try {
      const prompt = `
        Based on these recent Middle East conflict events, generate a tactical threat assessment:
        
        Events: ${JSON.stringify(events.slice(0, 10))}
        
        Provide a brief military-style assessment covering:
        1. Current threat level
        2. Key escalation indicators
        3. Predicted developments (next 24-48 hours)
        
        Keep it under 200 words, use tactical language.
      `;

      const response = await axios.post<OpenRouterResponse>(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            {
              role: 'system',
              content: 'You are a military intelligence officer providing tactical assessments.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://war-tracker.com',
            'X-Title': 'War Tracker 2.0'
          }
        }
      );

      return response.data.choices[0]?.message?.content || 'Assessment unavailable';

    } catch (error) {
      logger.error('Threat assessment generation failed:', error);
      return 'Threat assessment system temporarily unavailable';
    }
  }

  async verifyEventCredibility(sources: string[], content: string): Promise<number> {
    try {
      const prompt = `
        Analyze the credibility of this conflict event based on sources and content:
        
        Sources: ${sources.join(', ')}
        Content: "${content}"
        
        Return a credibility score from 0.0 to 1.0 based on:
        - Source reputation
        - Content specificity
        - Corroboration likelihood
        - Typical misinformation patterns
        
        Return only the number.
      `;

      const response = await axios.post<OpenRouterResponse>(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            {
              role: 'system',
              content: 'You are a fact-checking AI. Return only a decimal number between 0.0 and 1.0.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 10,
          temperature: 0.1
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://war-tracker.com',
            'X-Title': 'War Tracker 2.0'
          }
        }
      );

      const score = parseFloat(response.data.choices[0]?.message?.content || '0.5');
      return Math.max(0, Math.min(1, score));

    } catch (error) {
      logger.error('Credibility verification failed:', error);
      return 0.5; // Default to neutral score
    }
  }

  async analyzeConflict(conflictData: any) {
    // Implementation for conflict analysis
  }

  async predictEscalation(data: any) {
    // Implementation for escalation prediction
  }

  async generateInsights(data: any) {
    // Implementation for generating insights
  }

  async analyzeEvent(eventData: any) {
    // Implementation for event analysis
  }
}

export const openRouterService = new OpenRouterService();

export async function analyzeEvent(eventText: string) {
  // Keep only the first implementation, remove duplicates
}

export async function generateSituationSummary(events: any[]) {
  // Keep only the first implementation, remove duplicates
}

export async function predictThreatLevel(eventData: any) {
  // Keep only the first implementation, remove duplicates
}