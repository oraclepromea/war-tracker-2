import WebSocket from 'ws';
import { logger } from '../utils/logger';
import { Server } from 'socket.io';

let websocketServer: WebSocket.Server | null = null;
let io: Server | null = null;

export function setupWebSocket(wss: WebSocket.Server): void {
  websocketServer = wss;
  
  wss.on('connection', (ws: WebSocket) => {
    logger.info('New WebSocket connection established');
    
    ws.on('message', (message: WebSocket.Data) => {
      try {
        const data = JSON.parse(message.toString());
        logger.debug('Received WebSocket message:', data);
        
        // Handle different message types
        switch (data.type) {
          case 'subscribe':
            // Handle subscription to specific data feeds
            break;
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
            break;
          default:
            logger.warn('Unknown WebSocket message type:', data.type);
        }
      } catch (error) {
        logger.error('Error parsing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      logger.info('WebSocket connection closed');
    });
    
    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
    });
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: 'connection_established',
      timestamp: new Date().toISOString()
    }));
  });
}

export const initializeWebSocket = (socketServer: Server) => {
  io = socketServer;
  logger.info('WebSocket service initialized');
};

export function broadcastUpdate(data: any): void {
  // Broadcast via Socket.IO if available
  if (io) {
    io.emit('update', data);
    logger.debug('Broadcasted update via Socket.IO');
  }

  // Broadcast via WebSocket if available
  if (websocketServer) {
    const message = JSON.stringify(data);
    
    websocketServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
    
    logger.debug('Broadcasted update to WebSocket clients:', data.type);
  }

  if (!io && !websocketServer) {
    logger.warn('No WebSocket connections available for broadcast');
  }
}