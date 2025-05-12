import { IdGenerator } from '../../domain/interfaces/infrastructure.interface';
import { v4 as uuidv4 } from 'uuid';

export class UuidGenerator implements IdGenerator {
  create(): string {
    return uuidv4();
  }
}
