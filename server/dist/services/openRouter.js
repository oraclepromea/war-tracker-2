"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openRouterService = void 0;
exports.analyzeEvent = analyzeEvent;
exports.generateSituationSummary = generateSituationSummary;
exports.predictThreatLevel = predictThreatLevel;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../utils/logger");
class OpenRouterService {
    constructor() {
        this.baseUrl = 'https://openrouter.ai/api/v1';
        this.apiKey = process.env.OPENROUTER_API_KEY || '';
        if (!this.apiKey) {
            logger_1.logger.warn('OpenRouter API key not configured');
        }
    }
    async analyzeNewsArticle(article) {
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
            const response = await axios_1.default.post(`${this.baseUrl}/chat/completions`, {
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
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://war-tracker.com',
                    'X-Title': 'War Tracker 2.0'
                }
            });
            const content = response.data.choices[0]?.message?.content;
            if (!content)
                return null;
            // Try to parse JSON response
            try {
                const analysis = JSON.parse(content);
                return analysis;
            }
            catch (parseError) {
                logger_1.logger.error('Failed to parse OpenRouter response:', parseError);
                return null;
            }
        }
        catch (error) {
            logger_1.logger.error('OpenRouter API error:', error);
            return null;
        }
    }
    async generateThreatAssessment(events) {
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
            const response = await axios_1.default.post(`${this.baseUrl}/chat/completions`, {
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
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://war-tracker.com',
                    'X-Title': 'War Tracker 2.0'
                }
            });
            return response.data.choices[0]?.message?.content || 'Assessment unavailable';
        }
        catch (error) {
            logger_1.logger.error('Threat assessment generation failed:', error);
            return 'Threat assessment system temporarily unavailable';
        }
    }
    async verifyEventCredibility(sources, content) {
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
            const response = await axios_1.default.post(`${this.baseUrl}/chat/completions`, {
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
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://war-tracker.com',
                    'X-Title': 'War Tracker 2.0'
                }
            });
            const score = parseFloat(response.data.choices[0]?.message?.content || '0.5');
            return Math.max(0, Math.min(1, score));
        }
        catch (error) {
            logger_1.logger.error('Credibility verification failed:', error);
            return 0.5; // Default to neutral score
        }
    }
    async analyzeConflict(conflictData) {
        // Implementation for conflict analysis
    }
    async predictEscalation(data) {
        // Implementation for escalation prediction
    }
    async generateInsights(data) {
        // Implementation for generating insights
    }
    async analyzeEvent(eventData) {
        // Implementation for event analysis
    }
}
exports.openRouterService = new OpenRouterService();
async function analyzeEvent(eventText) {
    // Keep only the first implementation, remove duplicates
}
async function generateSituationSummary(events) {
    // Keep only the first implementation, remove duplicates
}
async function predictThreatLevel(eventData) {
    // Keep only the first implementation, remove duplicates
}
//# sourceMappingURL=openRouter.js.map