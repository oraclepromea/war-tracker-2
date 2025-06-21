"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeWebSocket = void 0;
exports.setupWebSocket = setupWebSocket;
exports.broadcastUpdate = broadcastUpdate;
const ws_1 = __importDefault(require("ws"));
const logger_1 = require("../utils/logger");
let websocketServer = null;
let io = null;
function setupWebSocket(wss) {
    websocketServer = wss;
    wss.on('connection', (ws) => {
        logger_1.logger.info('New WebSocket connection established');
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message.toString());
                logger_1.logger.debug('Received WebSocket message:', data);
                // Handle different message types
                switch (data.type) {
                    case 'subscribe':
                        // Handle subscription to specific data feeds
                        break;
                    case 'ping':
                        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
                        break;
                    default:
                        logger_1.logger.warn('Unknown WebSocket message type:', data.type);
                }
            }
            catch (error) {
                logger_1.logger.error('Error parsing WebSocket message:', error);
            }
        });
        ws.on('close', () => {
            logger_1.logger.info('WebSocket connection closed');
        });
        ws.on('error', (error) => {
            logger_1.logger.error('WebSocket error:', error);
        });
        // Send initial connection confirmation
        ws.send(JSON.stringify({
            type: 'connection_established',
            timestamp: new Date().toISOString()
        }));
    });
}
const initializeWebSocket = (socketServer) => {
    io = socketServer;
    logger_1.logger.info('WebSocket service initialized');
};
exports.initializeWebSocket = initializeWebSocket;
function broadcastUpdate(data) {
    // Broadcast via Socket.IO if available
    if (io) {
        io.emit('update', data);
        logger_1.logger.debug('Broadcasted update via Socket.IO');
    }
    // Broadcast via WebSocket if available
    if (websocketServer) {
        const message = JSON.stringify(data);
        websocketServer.clients.forEach((client) => {
            if (client.readyState === ws_1.default.OPEN) {
                client.send(message);
            }
        });
        logger_1.logger.debug('Broadcasted update to WebSocket clients:', data.type);
    }
    if (!io && !websocketServer) {
        logger_1.logger.warn('No WebSocket connections available for broadcast');
    }
}
//# sourceMappingURL=websocket.js.map