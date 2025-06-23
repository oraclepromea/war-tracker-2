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