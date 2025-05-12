import { DataCollectionQuerier } from '../../domain/interfaces/infrastructure.interface';
import { getDb } from './mongodb';

export class DefaultDataCollectionQuerier implements DataCollectionQuerier {
  async queryByLiteral<TData>(collection: string, literal: any): Promise<TData[]> {
    const db = getDb();
    return await db.collection(collection).find(literal).toArray() as TData[];
  }
}
