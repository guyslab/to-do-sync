import { IncomingMessage } from 'http';
import * as WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';

export interface WebSocketClient {
  id: string;
  socket: WebSocket;
}

export class WebSocketManager {
  private static _instance: WebSocketManager;
  private _wss: WebSocket.Server | null = null;
  private _clients: Map<string, WebSocketClient> = new Map();

  private constructor() {}

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager._instance) {
      WebSocketManager._instance = new WebSocketManager();
    }
    return WebSocketManager._instance;
  }

  public initialize(server: any): void {
    this._wss = new WebSocket.Server({ server });
    
    this._wss.on('connection', (socket: WebSocket, request: IncomingMessage) => {
      const clientId = uuidv4();
      const client: WebSocketClient = { id: clientId, socket };
      
      this._clients.set(clientId, client);
      console.log(`Client connected: ${clientId}`);
      
      socket.on('message', (message: string) => {
        console.log(`Received message from ${clientId}: ${message}`);
        // Handle incoming messages if needed
      });
      
      socket.on('close', () => {
        this._clients.delete(clientId);
        console.log(`Client disconnected: ${clientId}`);
      });
      
      socket.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this._clients.delete(clientId);
      });
    });
  }

  public broadcast<T>(eventType: string, payload: T): void {
    if (!this._wss) {
      console.error('WebSocket server not initialized');
      return;
    }
    
    const message = JSON.stringify({
      type: eventType,
      payload
    });
    
    this._clients.forEach((client) => {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(message);
      }
    });
  }

  public sendToClient<T>(clientId: string, eventType: string, payload: T): boolean {
    const client = this._clients.get(clientId);
    if (!client || client.socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    
    const message = JSON.stringify({
      type: eventType,
      payload
    });
    
    client.socket.send(message);
    return true;
  }
}
