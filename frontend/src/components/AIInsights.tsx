import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Globe, 
  Target,
  Zap,
  BarChart3,
  Languages
} from 'lucide-react';

interface ConflictPrediction {
  region: string;
  prediction: {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    factors: string[];
    trend: 'escalating' | 'stable' | 'de-escalating';
  };
}

interface AIInsightsProps {
  events?: any[];
  predictions?: ConflictPrediction[];
}

export function AIInsights({ events = [], predictions = [] }: AIInsightsProps) {
  const [aiStats, setAiStats] = useState({
    totalAnalyzed: 0,
    categorized: 0,
    duplicatesFound: 0,
    languages: 0,
    highRiskEvents: 0
  });

  useEffect(() => {
    if (events.length > 0) {
      const stats = {
        totalAnalyzed: events.length,
        categorized: events.filter(e => e.classification?.category).length,
        duplicatesFound: events.reduce((sum, e) => sum + (e.classification?.similarEvents?.length || 0), 0),
        languages: new Set(events.map(e => e.language)).size,
        highRiskEvents: events.filter(e => 
          e.classification?.escalationRisk === 'high' || 
          e.classification?.escalationRisk === 'critical'
        ).length
      };
      setAiStats(stats);
    }
  }, [events]);

  const getCategoryColor = (category: string) => {
    const colors = {
      military: 'text-red-400 bg-red-500/20 border-red-500',
      diplomatic: 'text-blue-400 bg-blue-500/20 border-blue-500',
      humanitarian: 'text-green-400 bg-green-500/20 border-green-500',
      economic: 'text-yellow-400 bg-yellow-500/20 border-yellow-500',
      cyber: 'text-purple-400 bg-purple-500/20 border-purple-500',
      terrorist: 'text-orange-400 bg-orange-500/20 border-orange-500'
    };
    return colors[category as keyof typeof colors] || 'text-tactical-muted bg-tactical-panel border-tactical-border';
  };

  const getRiskColor = (risk: string) => {
    const colors = {
      critical: 'text-red-400 bg-red-500/30',
      high: 'text-orange-400 bg-orange-500/30',
      medium: 'text-yellow-400 bg-yellow-500/30',
      low: 'text-green-400 bg-green-500/30'
    };
    return colors[risk as keyof typeof colors] || 'text-tactical-muted bg-tactical-panel';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'escalating': return '📈';
      case 'de-escalating': return '📉';
      default: return '➡️';
    }
  };

  const categoryStats = events.reduce((acc, event) => {
    const category = event.classification?.category;
    if (category) {
      acc[category] = (acc[category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* AI INSIGHTS HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-tactical font-bold text-neon-400 flex items-center space-x-2">
          <Brain className="h-6 w-6" />
          <span>AI Intelligence Analysis</span>
        </h2>
        <div className="text-sm text-tactical-muted font-mono">
          Real-time AI Processing
        </div>
      </div>

      {/* AI STATISTICS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="neon-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-neon-400" />
              <span className="text-xs text-tactical-muted font-mono">ANALYZED</span>
            </div>
            <div className="text-2xl font-tactical text-neon-400 mt-1">{aiStats.totalAnalyzed}</div>
          </CardContent>
        </Card>

        <Card className="neon-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-tactical-muted font-mono">CATEGORIZED</span>
            </div>
            <div className="text-2xl font-tactical text-blue-400 mt-1">{aiStats.categorized}</div>
          </CardContent>
        </Card>

        <Card className="neon-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-xs text-tactical-muted font-mono">HIGH RISK</span>
            </div>
            <div className="text-2xl font-tactical text-red-400 mt-1">{aiStats.highRiskEvents}</div>
          </CardContent>
        </Card>

        <Card className="neon-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Languages className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-tactical-muted font-mono">LANGUAGES</span>
            </div>
            <div className="text-2xl font-tactical text-purple-400 mt-1">{aiStats.languages}</div>
          </CardContent>
        </Card>

        <Card className="neon-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-orange-400" />
              <span className="text-xs text-tactical-muted font-mono">DUPLICATES</span>
            </div>
            <div className="text-2xl font-tactical text-orange-400 mt-1">{aiStats.duplicatesFound}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* EVENT CATEGORIZATION */}
        <Card className="neon-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Event Classification</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(categoryStats).map(([category, count]) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 rounded border ${getCategoryColor(category)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-tactical text-sm capitalize">{category}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm">{count as number}</span>
                      <div className="w-16 bg-tactical-panel rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-current"
                          style={{ width: `${((count as number) / aiStats.totalAnalyzed) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CONFLICT PREDICTIONS */}
        <Card className="neon-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Regional Predictions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {predictions.map((pred, index) => (
                <motion.div
                  key={pred.region}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="tactical-panel p-3 rounded"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-tactical-muted" />
                      <span className="font-tactical text-tactical-text">{pred.region}</span>
                      <span className="text-lg">{getTrendIcon(pred.prediction.trend)}</span>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-mono ${getRiskColor(pred.prediction.riskLevel)}`}>
                      {pred.prediction.riskLevel.toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="text-xs text-tactical-muted mb-2">
                    Confidence: {Math.round(pred.prediction.confidence * 100)}% | 
                    Trend: {pred.prediction.trend}
                  </div>
                  
                  <div className="space-y-1">
                    {pred.prediction.factors.slice(0, 2).map((factor, i) => (
                      <div key={i} className="text-xs text-tactical-muted flex items-center">
                        <span className="w-1 h-1 rounded-full bg-neon-400 mr-2" />
                        {factor}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RECENT AI ANALYSIS */}
      <Card className="neon-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>Recent AI Analysis</span>
            <div className="ml-auto text-xs text-tactical-muted font-mono">
              Last {Math.min(events.length, 5)} events
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events.slice(0, 5).map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="tactical-panel p-4 rounded border-l-4 border-neon-400"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-tactical text-neon-400 text-sm line-clamp-1">
                    {event.title}
                  </h4>
                  <div className="flex items-center space-x-2 ml-2">
                    {event.classification && (
                      <>
                        <span className={`text-xs px-2 py-1 rounded font-mono ${getCategoryColor(event.classification.category)}`}>
                          {event.classification.category}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded font-mono ${getRiskColor(event.classification.escalationRisk)}`}>
                          {event.classification.escalationRisk}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                {event.classification && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-tactical-muted">Confidence:</span>
                      <div className="font-mono text-neon-400">
                        {Math.round(event.classification.confidence * 100)}%
                      </div>
                    </div>
                    <div>
                      <span className="text-tactical-muted">Sentiment:</span>
                      <div className={`font-mono ${
                        event.classification.sentiment === 'positive' ? 'text-green-400' :
                        event.classification.sentiment === 'negative' ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {event.classification.sentiment}
                      </div>
                    </div>
                    <div>
                      <span className="text-tactical-muted">Language:</span>
                      <div className="font-mono text-purple-400">{event.language?.toUpperCase()}</div>
                    </div>
                    <div>
                      <span className="text-tactical-muted">Source:</span>
                      <div className="font-mono text-tactical-text truncate">{event.source}</div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}