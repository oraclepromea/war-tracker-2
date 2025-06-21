import mongoose, { Document, Schema } from 'mongoose';

interface IEvent extends Document {
  title: string;
  description: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    country: string;
    city: string;
    coordinates: number[]; // [longitude, latitude]
  };
  casualties: number;
  source: string;
  url?: string;
  credibilityScore: number;
  verified: boolean;
  timestamp: Date;
  aiAnalyzed: boolean;
  rawContent?: string;
  tags: string[];
  relatedEvents: mongoose.Types.ObjectId[];
}

// ...existing code...

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  eventType: { type: String, required: true },
  severity: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'], 
    required: true 
  },
  location: {
    country: { type: String, required: true },
    city: { type: String, required: true },
    coordinates: [{ type: Number }] // [longitude, latitude]
  },
  casualties: { type: Number, default: 0 },
  source: { type: String, required: true },
  url: { type: String },
  credibilityScore: { type: Number, min: 0, max: 1, default: 0.5 },
  verified: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
  aiAnalyzed: { type: Boolean, default: false },
  rawContent: { type: String },
  tags: [{ type: String }],
  relatedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
EventSchema.index({ timestamp: -1 });
EventSchema.index({ severity: 1 });
EventSchema.index({ 'location.country': 1 });
EventSchema.index({ credibilityScore: -1 });
EventSchema.index({ verified: 1 });

// Virtual for time ago
EventSchema.virtual('timeAgo').get(function(this: IEvent) {
  const now = new Date();
  const diffMs = now.getTime() - this.timestamp.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return `${Math.floor(diffMins / 1440)}d ago`;
});

// Virtual for calculating risk score
EventSchema.virtual('riskScore').get(function(this: IEvent) {
  const severityWeights = { low: 1, medium: 2, high: 3, critical: 4 };
  return severityWeights[this.severity] || 1;
});

// Add a method to calculate event severity score
EventSchema.methods.calculateSeverityScore = function(this: IEvent): number {
  const severityWeights = { low: 1, medium: 2, high: 3, critical: 4 };
  return severityWeights[this.severity as keyof typeof severityWeights] || 1;
};

export const Event = mongoose.model<IEvent>('Event', EventSchema);