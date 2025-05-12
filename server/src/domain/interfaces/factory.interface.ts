import { Task, TaskData } from './task.interface';
import { TaskService } from './service.interface';

export interface TaskFactory {
  createByData(data: TaskData): Task;
  createByTitle(title: string): Task;
}

export interface TaskServiceFactory {
  createTaskService(): TaskService;
}
