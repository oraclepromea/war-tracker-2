export declare class NewsAggregatorJob {
    private static readonly parser;
    private static readonly sources;
    static fetchAndIngest(): Promise<{
        news: number;
        events: number;
    }>;
    private static fetchFromAPI;
    private static fetchFromRSS;
    private static isWarRelated;
    private static isHighSeverityNews;
    private static generateArticleId;
    private static extractTags;
    private static extractLocation;
    private static calculateNewsSeverity;
    static fetchRSSFeed(source: any): Promise<any[]>;
    static enhancedFetchAndIngest(): Promise<any>;
}
