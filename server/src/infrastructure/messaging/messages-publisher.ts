import { MessagesPublisher } from '../../domain/interfaces/infrastructure.interface';
import { Server as SocketIOServer } from 'socket.io';

export class DefaultMessagesPublisher implements MessagesPublisher {
  constructor(private _wsServer: SocketIOServer) {}
  
  async publish<TMsg>(msgType: string, msgPayload: TMsg): Promise<void> {
    this._wsServer.emit(msgType, msgPayload);
  }
}
