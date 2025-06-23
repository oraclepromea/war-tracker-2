// AI-Powered Event Classification and Analysis Service
import fetch from 'node-fetch';

export interface EventClassification {
  category: 'military' | 'diplomatic' | 'humanitarian' | 'economic' | 'cyber' | 'terrorist';
  confidence: number;
  keywords: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  escalationRisk: 'low' | 'medium' | 'high' | 'critical';
  similarEvents: string[];
}

export interface EnhancedEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  timestamp: string;
  date: string;
  source: string;
  type: string;
  verified: boolean;
  link?: string;
  classification?: EventClassification;
  language: string;
  originalText?: string;
}

export class AIEventAnalyzer {
  private static instance: AIEventAnalyzer;
  private eventHistory: EnhancedEvent[] = [];
  
  // Classification keywords for different event types
  private categoryKeywords = {
    military: ['airstrike', 'bombing', 'artillery', 'troops', 'attack', 'battle', 'combat', 'offensive', 'invasion', 'missile'],
    diplomatic: ['negotiation', 'talks', 'treaty', 'agreement', 'embassy', 'ambassador', 'sanctions', 'summit', 'ceasefire'],
    humanitarian: ['aid', 'refugee', 'civilian', 'hospital', 'school', 'evacuation', 'relief', 'food', 'medical'],
    economic: ['sanctions', 'trade', 'oil', 'gas', 'economy', 'embargo', 'market', 'currency', 'financial'],
    cyber: ['cyber', 'hack', 'digital', 'infrastructure', 'internet', 'network', 'data', 'breach'],
    terrorist: ['terrorist', 'extremist', 'suicide', 'bomb', 'radical', 'insurgent', 'militia']
  };

  // Sentiment analysis keywords
  private sentimentKeywords = {
    positive: ['peace', 'agreement', 'aid', 'help', 'support', 'cooperation', 'success', 'progress', 'victory'],
    negative: ['killed', 'dead', 'wounded', 'destroyed', 'attack', 'explosion', 'crisis', 'conflict', 'war', 'violence'],
    neutral: ['reported', 'announced', 'stated', 'meeting', 'discussion', 'planned']
  };

  // Escalation indicators
  private escalationKeywords = {
    critical: ['nuclear', 'chemical', 'biological', 'invasion', 'declaration of war', 'mobilization'],
    high: ['massive', 'large-scale', 'hundreds', 'thousands', 'strategic', 'major offensive'],
    medium: ['increased', 'escalating', 'tensions', 'clashes', 'skirmishes'],
    low: ['minor', 'isolated', 'limited', 'sporadic', 'single']
  };

  public static getInstance(): AIEventAnalyzer {
    if (!AIEventAnalyzer.instance) {
      AIEventAnalyzer.instance = new AIEventAnalyzer();
    }
    return AIEventAnalyzer.instance;
  }

  /**
   * Classify and analyze an event using AI-powered techniques
   */
  public async classifyEvent(event: any): Promise<EnhancedEvent> {
    // PRESERVE original RSS content - don't override with generic descriptions
    const enhancedEvent: EnhancedEvent = {
      ...event,
      // Keep original title and description from RSS feed
      title: event.title || 'No title',
      description: event.description || 'No description',
      classification: {
        category: this.classifyEventCategory(event.title + ' ' + event.description),
        confidence: this.calculateConfidence(event.title + ' ' + event.description, this.classifyEventCategory(event.title + ' ' + event.description)),
        keywords: this.extractKeywords(event.title + ' ' + event.description),
        sentiment: this.analyzeSentiment(event.description),
        sentimentScore: this.calculateSentimentScore(event.description),
        escalationRisk: this.assessEscalationRisk(event.title + ' ' + event.description),
        similarEvents: this.findSimilarEvents(event)
      },
      language: event.language || 'en',
      sourceType: event.sourceType || 'unknown'
    };

    console.log(`🤖 AI Enhanced event: "${enhancedEvent.title}" from ${enhancedEvent.source}`);
    return enhancedEvent;
  }

  /**
   * Classify event into categories based on content analysis
   */
  private classifyEventCategory(text: string): EventClassification['category'] {
    const scores: Record<string, number> = {};
    
    Object.entries(this.categoryKeywords).forEach(([category, keywords]) => {
      scores[category] = keywords.reduce((score, keyword) => {
        const regex = new RegExp(keyword, 'gi');
        const matches = text.match(regex);
        return score + (matches ? matches.length : 0);
      }, 0);
    });

    // Return category with highest score
    const topCategory = Object.entries(scores).reduce((a, b) => 
      scores[a[0]] > scores[b[0]] ? a : b
    )[0];

    return topCategory as EventClassification['category'];
  }

  /**
   * Calculate confidence score for classification
   */
  private calculateConfidence(text: string, category: string): number {
    const keywords = this.categoryKeywords[category as keyof typeof this.categoryKeywords];
    const matchCount = keywords.reduce((count, keyword) => {
      return count + (text.includes(keyword) ? 1 : 0);
    }, 0);
    
    return Math.min(matchCount / keywords.length, 1.0);
  }

  /**
   * Extract relevant keywords from text
   */
  private extractKeywords(text: string): string[] {
    const allKeywords = Object.values(this.categoryKeywords).flat();
    return allKeywords.filter(keyword => text.includes(keyword));
  }

  /**
   * Analyze sentiment of the event
   */
  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveScore = this.sentimentKeywords.positive.reduce((score, word) => 
      score + (text.includes(word) ? 1 : 0), 0);
    
    const negativeScore = this.sentimentKeywords.negative.reduce((score, word) => 
      score + (text.includes(word) ? 1 : 0), 0);

    if (negativeScore > positiveScore) return 'negative';
    if (positiveScore > negativeScore) return 'positive';
    return 'neutral';
  }

  /**
   * Calculate numerical sentiment score (-1 to 1)
   */
  private calculateSentimentScore(text: string): number {
    const positiveScore = this.sentimentKeywords.positive.reduce((score, word) => 
      score + (text.includes(word) ? 1 : 0), 0);
    
    const negativeScore = this.sentimentKeywords.negative.reduce((score, word) => 
      score + (text.includes(word) ? 1 : 0), 0);

    const totalScore = positiveScore + negativeScore;
    if (totalScore === 0) return 0;
    
    return (positiveScore - negativeScore) / totalScore;
  }

  /**
   * Assess escalation risk based on content
   */
  private assessEscalationRisk(text: string): 'low' | 'medium' | 'high' | 'critical' {
    for (const [level, keywords] of Object.entries(this.escalationKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return level as 'low' | 'medium' | 'high' | 'critical';
      }
    }
    return 'low';
  }

  /**
   * Find similar events for duplicate detection
   */
  private findSimilarEvents(event: any): string[] {
    const similarEvents: string[] = [];
    const eventText = (event.title + ' ' + event.description).toLowerCase();
    
    this.eventHistory.forEach(historicalEvent => {
      if (historicalEvent.id === event.id) return;
      
      const historicalText = (historicalEvent.title + ' ' + historicalEvent.description).toLowerCase();
      const similarity = this.calculateTextSimilarity(eventText, historicalText);
      
      // Consider events similar if they have >70% similarity and same location
      if (similarity > 0.7 && historicalEvent.location === event.location) {
        similarEvents.push(historicalEvent.id);
      }
    });

    return similarEvents;
  }

  /**
   * Calculate text similarity using simple word overlap
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(' ').filter(w => w.length > 3));
    const words2 = new Set(text2.split(' ').filter(w => w.length > 3));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Simple language detection based on character patterns
   */
  private detectLanguage(text: string): string {
    // Arabic detection
    if (/[\u0600-\u06FF]/.test(text)) return 'ar';
    
    // Hebrew detection
    if (/[\u0590-\u05FF]/.test(text)) return 'he';
    
    // Cyrillic (Russian/Ukrainian) detection
    if (/[\u0400-\u04FF]/.test(text)) return 'ru';
    
    // Default to English
    return 'en';
  }

  /**
   * Generate conflict prediction based on recent events
   */
  public generateConflictPrediction(region: string): {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    factors: string[];
    trend: 'escalating' | 'stable' | 'de-escalating';
  } {
    const recentEvents = this.eventHistory
      .filter(e => e.location.toLowerCase().includes(region.toLowerCase()))
      .filter(e => Date.now() - new Date(e.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000); // Last 7 days

    if (recentEvents.length === 0) {
      return {
        riskLevel: 'low',
        confidence: 0.1,
        factors: ['No recent events'],
        trend: 'stable'
      };
    }

    // Calculate risk factors
    const criticalEvents = recentEvents.filter(e => e.classification?.escalationRisk === 'critical').length;
    const highRiskEvents = recentEvents.filter(e => e.classification?.escalationRisk === 'high').length;
    const militaryEvents = recentEvents.filter(e => e.classification?.category === 'military').length;
    
    // Determine trend
    const firstHalf = recentEvents.slice(0, Math.floor(recentEvents.length / 2));
    const secondHalf = recentEvents.slice(Math.floor(recentEvents.length / 2));
    
    const firstHalfSeverity = firstHalf.reduce((sum, e) => sum + this.severityToNumber(e.severity), 0) / firstHalf.length;
    const secondHalfSeverity = secondHalf.reduce((sum, e) => sum + this.severityToNumber(e.severity), 0) / secondHalf.length;
    
    let trend: 'escalating' | 'stable' | 'de-escalating' = 'stable';
    if (secondHalfSeverity > firstHalfSeverity * 1.2) trend = 'escalating';
    else if (secondHalfSeverity < firstHalfSeverity * 0.8) trend = 'de-escalating';

    // Calculate risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (criticalEvents > 0) riskLevel = 'critical';
    else if (highRiskEvents > 2 || militaryEvents > 5) riskLevel = 'high';
    else if (militaryEvents > 2 || recentEvents.length > 10) riskLevel = 'medium';

    const factors = [];
    if (criticalEvents > 0) factors.push(`${criticalEvents} critical escalation events`);
    if (highRiskEvents > 0) factors.push(`${highRiskEvents} high-risk events`);
    if (militaryEvents > 0) factors.push(`${militaryEvents} military operations`);
    if (trend === 'escalating') factors.push('Escalating trend detected');

    return {
      riskLevel,
      confidence: Math.min(recentEvents.length / 10, 1.0),
      factors,
      trend
    };
  }

  private severityToNumber(severity: string): number {
    const map = { low: 1, medium: 2, high: 3, critical: 4 };
    return map[severity as keyof typeof map] || 1;
  }

  private generateAlerts(events: EnhancedEvent[]): string[] {
    const alerts: string[] = [];
    
    events.forEach(event => {
      if (event.classification?.escalationRisk === 'high') {
        alerts.push(`High escalation risk detected: ${event.title}`);
        alerts.push(`Location: ${event.location}`);
        alerts.push(`Confidence: ${Math.round((event.classification.confidence || 0) * 100)}%`);
        alerts.push('Escalating trend detected');
      }
    });

    return alerts;
  }

  /**
   * Generate AI insights for the event
   */
  private generateInsights(event: any): string[] {
    const insights: string[] = [];
    const text = (event.title + ' ' + event.description).toLowerCase();
    
    if (text.includes('civilian') || text.includes('hospital') || text.includes('school')) {
      insights.push('Humanitarian impact detected');
    }
    
    if (text.includes('escalat') || text.includes('intensif')) {
      insights.push('Potential escalation indicators');
    }
    
    if (text.includes('diplomatic') || text.includes('negotiat')) {
      insights.push('Diplomatic activity noted');
    }
    
    return insights;
  }

  /**
   * Extract named entities from text
   */
  private extractEntities(text: string): string[] {
    const entities: string[] = [];
    const locations = ['Gaza', 'Ukraine', 'Russia', 'Israel', 'Syria', 'Lebanon', 'Iraq', 'Yemen'];
    const organizations = ['NATO', 'UN', 'EU', 'Hamas', 'IDF', 'Pentagon'];
    
    locations.forEach(location => {
      if (text.toLowerCase().includes(location.toLowerCase())) {
        entities.push(location);
      }
    });
    
    organizations.forEach(org => {
      if (text.toLowerCase().includes(org.toLowerCase())) {
        entities.push(org);
      }
    });
    
    return entities;
  }

  /**
   * Enhance location information
   */
  private enhanceLocation(location: string | any): any {
    if (typeof location === 'string') {
      const locationMap: Record<string, { lat: number; lng: number }> = {
        'Gaza': { lat: 31.5, lng: 34.5 },
        'Ukraine': { lat: 49.0, lng: 32.0 },
        'Russia': { lat: 55.8, lng: 37.6 },
        'Israel': { lat: 31.5, lng: 34.8 },
        'Syria': { lat: 35.0, lng: 38.0 },
        'Lebanon': { lat: 33.9, lng: 35.5 }
      };
      
      const coords = locationMap[location];
      return coords ? { name: location, ...coords } : location;
    }
    
    return location;
  }

  /**
   * Calculate severity based on content
   */
  private calculateSeverity(text: string): 'critical' | 'high' | 'medium' | 'low' {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('killed') || lowerText.includes('dead') || lowerText.includes('casualties')) {
      return 'critical';
    } else if (lowerText.includes('injured') || lowerText.includes('wounded') || lowerText.includes('attack')) {
      return 'high';
    } else if (lowerText.includes('military') || lowerText.includes('operation')) {
      return 'medium';
    }
    return 'low';
  }
}