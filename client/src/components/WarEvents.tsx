import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Filter, 
  Search, 
  ExternalLink
} from 'lucide-react';

const mockEvents = [
	{
		id: 1,
		type: 'Air Strike',
		location: 'Gaza City, Gaza Strip',
		timestamp: '2024-01-15T14:32:00Z',
		severity: 'critical',
		casualties: 23,
		description: 'Israeli air force targets militant compound in northern Gaza',
		sources: ['Reuters', 'AP News'],
		coordinates: [31.5017, 34.4668],
	},
	{
		id: 2,
		type: 'Rocket Attack',
		location: 'Tel Aviv, Israel',
		timestamp: '2024-01-15T13:45:00Z',
		severity: 'high',
		casualties: 5,
		description: 'Multiple rockets intercepted by Iron Dome system',
		sources: ['Times of Israel', 'Haaretz'],
		coordinates: [32.0853, 34.7818],
	},
	{
		id: 3,
		type: 'Ground Operation',
		location: 'Khan Yunis, Gaza Strip',
		timestamp: '2024-01-15T12:18:00Z',
		severity: 'medium',
		casualties: 12,
		description: 'IDF ground forces advance into southern Gaza city',
		sources: ['Jerusalem Post', 'CNN'],
		coordinates: [31.3482, 34.3058],
	},
	{
		id: 4,
		type: 'Naval Intercept',
		location: 'Mediterranean Sea',
		timestamp: '2024-01-15T11:52:00Z',
		severity: 'low',
		casualties: 0,
		description: 'Israeli Navy intercepts suspicious vessel near coast',
		sources: ['IDF Spokesperson'],
		coordinates: [32.1, 34.3],
	},
];

export function WarEvents() {
	const [filteredEvents] = useState(mockEvents);
	const [selectedEvent, setSelectedEvent] = useState(mockEvents[0]);

	const getSeverityColor = (severity: string) => {
		switch (severity) {
			case 'critical':
				return 'text-red-400 border-red-400';
			case 'high':
				return 'text-orange-400 border-orange-400';
			case 'medium':
				return 'text-yellow-400 border-yellow-400';
			case 'low':
				return 'text-green-400 border-green-400';
			default:
				return 'text-tactical-muted border-tactical-border';
		}
	};

	const formatTimeAgo = (timestamp: string) => {
		const now = new Date();
		const eventTime = new Date(timestamp);
		const diffInMinutes = Math.floor(
			(now.getTime() - eventTime.getTime()) / (1000 * 60)
		);

		if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
		if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
		return `${Math.floor(diffInMinutes / 1440)}d ago`;
	};

	return (
		<div className="space-y-6 p-6 max-w-7xl mx-auto">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-tactical font-bold text-neon-400">
					War Events Timeline
				</h2>
				<div className="flex items-center space-x-2">
					<Button variant="outline" size="sm">
						<Filter className="h-4 w-4 mr-2" />
						Filter
					</Button>
					<Button variant="outline" size="sm">
						<Search className="h-4 w-4 mr-2" />
						Search
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Events List */}
				<div className="lg:col-span-2">
					<Card className="neon-border">
						<CardHeader>
							<CardTitle className="flex items-center space-x-2">
								<Calendar className="h-5 w-5" />
								<span>Recent Events</span>
								<div className="ml-auto text-xs text-tactical-muted font-mono">
									{filteredEvents.length} events
								</div>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3 max-h-96 overflow-y-auto">
								{filteredEvents.map((event, index) => (
									<motion.div
										key={event.id}
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: index * 0.1 }}
										className={`tactical-panel p-4 rounded cursor-pointer transition-all border-l-4 ${
											getSeverityColor(event.severity)
										} ${
											selectedEvent.id === event.id
												? 'bg-neon-950/30 border border-neon-400'
												: 'hover:bg-tactical-bg'
										}`}
										onClick={() => setSelectedEvent(event)}
									>
										<div className="flex items-center justify-between mb-2">
											<div className="flex items-center space-x-2">
												<AlertTriangle
													className={`h-4 w-4 ${getSeverityColor(
														event.severity
													).split(' ')[0]}`}
												/>
												<span className="font-tactical text-neon-400">
													{event.type}
												</span>
												<span className="text-xs text-tactical-muted font-mono uppercase">
													{event.severity}
												</span>
											</div>
											<div className="flex items-center space-x-2 text-xs text-tactical-muted">
												<Clock className="h-3 w-3" />
												<span>{formatTimeAgo(event.timestamp)}</span>
											</div>
										</div>

										<div className="flex items-center space-x-2 mb-2">
											<MapPin className="h-4 w-4 text-tactical-muted" />
											<span className="text-sm text-tactical-text">
												{event.location}
											</span>
										</div>

										<p className="text-sm text-tactical-muted line-clamp-2">
											{event.description}
										</p>

										{event.casualties > 0 && (
											<div className="mt-2 flex items-center space-x-2">
												<span className="text-xs text-red-400 font-mono">
													CASUALTIES: {event.casualties}
												</span>
											</div>
										)}
									</motion.div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Event Details */}
				<div>
					<Card className="neon-border">
						<CardHeader>
							<CardTitle className="flex items-center space-x-2">
								<MapPin className="h-5 w-5" />
								<span>Event Details</span>
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="tactical-panel p-3 rounded">
								<div className="text-tactical-muted text-xs font-mono mb-1">
									EVENT TYPE
								</div>
								<div className="text-neon-400 font-tactical">
									{selectedEvent.type}
								</div>
							</div>

							<div className="tactical-panel p-3 rounded">
								<div className="text-tactical-muted text-xs font-mono mb-1">
									LOCATION
								</div>
								<div className="text-tactical-text text-sm">
									{selectedEvent.location}
								</div>
							</div>

							<div className="tactical-panel p-3 rounded">
								<div className="text-tactical-muted text-xs font-mono mb-1">
									TIMESTAMP
								</div>
								<div className="text-tactical-text text-sm font-mono">
									{new Date(selectedEvent.timestamp).toLocaleString()}
								</div>
							</div>

							<div className="tactical-panel p-3 rounded">
								<div className="text-tactical-muted text-xs font-mono mb-1">
									SEVERITY
								</div>
								<div
									className={`font-tactical uppercase ${getSeverityColor(
										selectedEvent.severity
									).split(' ')[0]}`}
								>
									{selectedEvent.severity}
								</div>
							</div>

							{selectedEvent.casualties > 0 && (
								<div className="tactical-panel p-3 rounded">
									<div className="text-tactical-muted text-xs font-mono mb-1">
										CASUALTIES
									</div>
									<div className="text-red-400 font-tactical">
										{selectedEvent.casualties}
									</div>
								</div>
							)}

							<div className="tactical-panel p-3 rounded">
								<div className="text-tactical-muted text-xs font-mono mb-1">
									DESCRIPTION
								</div>
								<div className="text-tactical-text text-sm">
									{selectedEvent.description}
								</div>
							</div>

							<div className="tactical-panel p-3 rounded">
								<div className="text-tactical-muted text-xs font-mono mb-1">
									SOURCES
								</div>
								<div className="space-y-1">
									{selectedEvent.sources.map((source: string, index: number) => (
										<div
											key={index}
											className="flex items-center space-x-2"
										>
											<ExternalLink className="h-3 w-3 text-neon-400" />
											<span className="text-neon-400 text-sm cursor-pointer hover:underline">
												{source}
											</span>
										</div>
									))}
								</div>
							</div>

							<div className="tactical-panel p-3 rounded">
								<div className="text-tactical-muted text-xs font-mono mb-1">
									COORDINATES
								</div>
								<div className="text-tactical-text text-sm font-mono">
									{selectedEvent.coordinates[0]}, {selectedEvent.coordinates[1]}
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}