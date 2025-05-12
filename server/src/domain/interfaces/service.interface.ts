import { TaskDtoOut, TaskKeyDtoOut } from './task.interface';

export interface TaskService {
  getAll(includeComplete: boolean): Promise<TaskDtoOut[]>;
  complete(id: string): Promise<void>;
  incomplete(id: string): Promise<void>;
  beginEdition(id: string): Promise<TaskKeyDtoOut>;
  endEdition(id: string, title: string, lockKey: string): Promise<void>;
  delete(id: string): Promise<void>;
  create(title: string): Promise<string>;
}
