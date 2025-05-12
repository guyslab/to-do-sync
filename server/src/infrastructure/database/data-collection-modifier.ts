import { DataCollectionModifier } from '../../domain/interfaces/infrastructure.interface';
import { getDb } from './mongodb';

export class DefaultDataCollectionModifier implements DataCollectionModifier {
  async upsert<TData>(collection: string, id: string, data: TData): Promise<void> {
    const db = getDb();
    await db.collection(collection).updateOne(
      { id },
      { $set: data },
      { upsert: true }
    );
  }
}
