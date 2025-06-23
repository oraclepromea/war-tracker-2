import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Phone, 
  X, 
  Check, 
  CheckCheck,
  AlertCircle,
  Users
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface NotificationMessage {
  id: string;
  message: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  type: 'alert' | 'update' | 'warning';
  from: string;
}

interface MessagingIntegrationProps {
  events?: any[];
  isConnected?: boolean;
}

export function MessagingIntegration({ events = [], isConnected = false }: MessagingIntegrationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<NotificationMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Generate notification messages from events
  useEffect(() => {
    if (events.length > 0) {
      const latestEvent = events[0];
      if (latestEvent.classification?.escalationRisk === 'critical' || 
          latestEvent.classification?.escalationRisk === 'high') {
        
        const newMessage: NotificationMessage = {
          id: `msg-${Date.now()}`,
          message: `🚨 ${latestEvent.classification.escalationRisk.toUpperCase()} ALERT: ${latestEvent.title}`,
          timestamp: new Date(),
          status: 'delivered',
          type: latestEvent.classification.escalationRisk === 'critical' ? 'alert' : 'warning',
          from: 'War Tracker AI'
        };

        setMessages(prev => [newMessage, ...prev.slice(0, 9)]); // Keep last 10 messages
        setUnreadCount(prev => prev + 1);
      }
    }
  }, [events]);

  const markAsRead = () => {
    setUnreadCount(0);
    setMessages(prev => prev.map(msg => ({ ...msg, status: 'read' as const })));
  };

  const getStatusIcon = (status: NotificationMessage['status']) => {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3 text-tactical-muted" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-tactical-muted" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-400" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: NotificationMessage['type']) => {
    switch (type) {
      case 'alert':
        return 'border-l-red-500 bg-red-500/10';
      case 'warning':
        return 'border-l-orange-500 bg-orange-500/10';
      case 'update':
        return 'border-l-green-500 bg-green-500/10';
      default:
        return 'border-l-tactical-border bg-tactical-panel';
    }
  };

  return (
    <>
      {/* Floating Message Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) markAsRead();
          }}
          className="relative bg-neon-400 hover:bg-neon-500 text-black rounded-full p-4 shadow-lg shadow-neon-400/25 transition-all duration-200"
        >
          <MessageSquare className="h-6 w-6" />
          
          {/* Unread Badge */}
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Connection Status */}
          <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
        </button>
      </motion.div>

      {/* Message Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, x: 50 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 100, x: 50 }}
            className="fixed bottom-24 right-6 w-80 z-50"
          >
            <Card className="neon-border bg-tactical-dark/95 backdrop-blur-sm">
              <div className="flex items-center justify-between p-4 border-b border-tactical-border">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="h-5 w-5 text-neon-400" />
                    <span className="font-tactical text-neon-400">Intelligence Feed</span>
                  </div>
                  <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => window.open('tel:+1234567890', '_self')}
                    className="p-1 hover:bg-tactical-panel rounded transition-colors"
                    title="Emergency Contact"
                  >
                    <Phone className="h-4 w-4 text-tactical-muted hover:text-neon-400" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-tactical-panel rounded transition-colors"
                  >
                    <X className="h-4 w-4 text-tactical-muted hover:text-red-400" />
                  </button>
                </div>
              </div>

              <CardContent className="p-0 max-h-96 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="p-6 text-center text-tactical-muted">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No intelligence alerts</p>
                    <p className="text-xs">System monitoring for threats...</p>
                  </div>
                ) : (
                  <div className="space-y-2 p-2">
                    {messages.map((msg, index) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-3 rounded border-l-4 ${getTypeColor(msg.type)}`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-xs font-mono text-tactical-muted">{msg.from}</span>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-tactical-muted">
                              {msg.timestamp.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                            {getStatusIcon(msg.status)}
                          </div>
                        </div>
                        
                        <p className="text-sm text-tactical-text leading-relaxed">
                          {msg.message}
                        </p>
                        
                        {msg.type === 'alert' && (
                          <div className="mt-2 flex space-x-2">
                            <button className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors">
                              Acknowledge
                            </button>
                            <button className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors">
                              Details
                            </button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>

              {/* Status Bar */}
              <div className="p-2 border-t border-tactical-border bg-tactical-panel/50">
                <div className="flex items-center justify-between text-xs text-tactical-muted">
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>Command Center</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span>{isConnected ? 'Online' : 'Offline'}</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}