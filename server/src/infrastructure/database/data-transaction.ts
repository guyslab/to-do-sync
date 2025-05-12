import { DataTransaction, DataCollectionModifier } from '../../domain/interfaces/infrastructure.interface';

export class DefaultDataTransaction implements DataTransaction {
  private _changes: Map<string, Map<string, any>> = new Map();
  
  constructor(
    private _dataModifier: DataCollectionModifier
  ) {}

  register(typeName: string, id: string, data: any): void {
    if (!this._changes.has(typeName)) {
      this._changes.set(typeName, new Map());
    }
    this._changes.get(typeName)!.set(id, data);
  }

  async commit(): Promise<void> {
    for (const [typeName, entities] of this._changes.entries()) {
      for (const [id, data] of entities.entries()) {
        await this._dataModifier.upsert(typeName, id, data);
      }
    }
    this._changes.clear();
  }
}
