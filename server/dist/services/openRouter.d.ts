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
declare class OpenRouterService {
    private apiKey;
    private baseUrl;
    constructor();
    analyzeNewsArticle(article: string): Promise<EventAnalysis | null>;
    generateThreatAssessment(events: any[]): Promise<string>;
    verifyEventCredibility(sources: string[], content: string): Promise<number>;
    analyzeConflict(conflictData: any): Promise<void>;
    predictEscalation(data: any): Promise<void>;
    generateInsights(data: any): Promise<void>;
    analyzeEvent(eventData: any): Promise<void>;
}
export declare const openRouterService: OpenRouterService;
export declare function analyzeEvent(eventText: string): Promise<void>;
export declare function generateSituationSummary(events: any[]): Promise<void>;
export declare function predictThreatLevel(eventData: any): Promise<void>;
export {};
