import { Task } from './task.interface';

export interface TaskRepository {
  getAll(includeComplete: boolean): Promise<Task[]>;
  getById(id: string): Promise<Task | null>;
}
