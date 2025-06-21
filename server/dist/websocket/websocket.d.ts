import WebSocket from 'ws';
import { Server } from 'socket.io';
export declare function setupWebSocket(wss: WebSocket.Server): void;
export declare const initializeWebSocket: (socketServer: Server) => void;
export declare function broadcastUpdate(data: any): void;
