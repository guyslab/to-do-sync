import { MessagesOutbox, MessagesPublisher } from '../../domain/interfaces/infrastructure.interface';

export class DefaultMessagesOutbox implements MessagesOutbox {
  private _messages: Map<string, any[]> = new Map();
  
  constructor(
    private _publisher: MessagesPublisher
  ) {}

  register<TMsg>(msgType: string, msgPayload: TMsg): void {
    if (!this._messages.has(msgType)) {
      this._messages.set(msgType, []);
    }
    this._messages.get(msgType)!.push(msgPayload);
  }

  async commit(): Promise<void> {
    for (const [msgType, payloads] of this._messages.entries()) {
      for (const payload of payloads) {
        await this._publisher.publish(msgType, payload);
      }
    }
    this._messages.clear();
  }
}
