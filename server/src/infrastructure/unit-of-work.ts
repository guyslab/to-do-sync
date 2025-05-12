import { UnitOfWork, DataTransaction, MessagesOutbox } from '../domain/interfaces/infrastructure.interface';

export class DefaultUnitOfWork implements UnitOfWork {
  constructor(
    private _tx: DataTransaction,
    private _outbox: MessagesOutbox
  ) {}

  async commit(): Promise<void> {
    await this._tx.commit();
    await this._outbox.commit();
  }
}
