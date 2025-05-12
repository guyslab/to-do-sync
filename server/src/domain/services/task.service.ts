import { TaskService } from '../interfaces/service.interface';
import { TaskDtoOut, TaskKeyDtoOut } from '../interfaces/task.interface';
import { TaskRepository } from '../interfaces/repository.interface';
import { TaskFactory } from '../interfaces/factory.interface';
import { MessagesOutbox, UnitOfWork } from '../interfaces/infrastructure.interface';

export class DefaultTaskService implements TaskService {
  constructor(
    private _taskRepository: TaskRepository,
    private _taskFactory: TaskFactory,
    private _unitOfWork: UnitOfWork,
    private _outbox: MessagesOutbox
  ) {}

  async getAll(includeComplete: boolean): Promise<TaskDtoOut[]> {
    const tasks = await this._taskRepository.getAll(includeComplete);
    return tasks.map(task => task.toDto());
  }

  async complete(id: string): Promise<void> {
    const task = await this._taskRepository.getById(id);
    if (!task) throw new Error("notFound");
    task.complete();
    this._outbox.register('task_complete', { taskId: id });
    await this._unitOfWork.commit();
  }

  async incomplete(id: string): Promise<void> {
    const task = await this._taskRepository.getById(id);
    if (!task) throw new Error("notFound");
    task.incomplete();
    this._outbox.register('task_incomplete', { taskId: id });
    await this._unitOfWork.commit();
  }

  async beginEdition(id: string): Promise<TaskKeyDtoOut> {
    const task = await this._taskRepository.getById(id);
    if (!task) throw new Error("notFound");
    const key = task.lockTitle();
    await this._unitOfWork.commit();
    return {
      key: key.key,
      expiresAt: key.expiresAt
    };
  }

  async endEdition(id: string, title: string, lockKey: string): Promise<void> {
    const task = await this._taskRepository.getById(id);
    if (!task) throw new Error("notFound");
    task.setTitle(title, lockKey);
    this._outbox.register('task_renamed', { taskId: id, title });
    await this._unitOfWork.commit();
  }

  async delete(id: string): Promise<void> {
    const task = await this._taskRepository.getById(id);
    if (!task) throw new Error("notFound");
    task.delete();
    this._outbox.register('task_deleted', { taskId: id });
    await this._unitOfWork.commit();
  }

  async create(title: string): Promise<string> {
    const task = this._taskFactory.createByTitle(title);
    const id = task.toDto().id;
    this._outbox.register('task_created', { taskId: id, title });
    await this._unitOfWork.commit();
    return id;
  }
}
