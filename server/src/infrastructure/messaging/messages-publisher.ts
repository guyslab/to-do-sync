import { MessagesPublisher } from '../../domain/interfaces/infrastructure.interface';
import { WebSocketManager } from './websocket-manager';

export class DefaultMessagesPublisher implements MessagesPublisher {
  private _wsManager: WebSocketManager;
  
  constructor() {
    this._wsManager = WebSocketManager.getInstance();
  }
  
  async publish<TMsg>(msgType: string, msgPayload: TMsg): Promise<void> {
    console.log(`Publishing message: ${msgType}`, msgPayload);
    this._wsManager.broadcast(msgType, msgPayload);
  }
}
