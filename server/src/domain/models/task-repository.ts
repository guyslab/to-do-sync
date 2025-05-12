import { TaskRepository } from '../interfaces/repository.interface';
import { Task, TaskData } from '../interfaces/task.interface';
import { DataCollectionQuerier } from '../interfaces/infrastructure.interface';
import { TaskFactory } from '../interfaces/factory.interface';

export class DefaultTaskRepository implements TaskRepository {
  private _collection: string;
  
  constructor(
    private _dataQuerier: DataCollectionQuerier,
    private _taskFactory: TaskFactory
  ) {
    this._collection = "task";
  }

  async getAll(includeComplete: boolean): Promise<Task[]> {
    const taskDataList = await this._dataQuerier.queryByLiteral<TaskData>(
      this._collection, 
      { deleted: false, complete: includeComplete }
    );
    return taskDataList.map(data => this._taskFactory.createByData(data));
  }

  async getById(id: string): Promise<Task | null> {
    const taskDataList = await this._dataQuerier.queryByLiteral<TaskData>(
      this._collection, 
      { deleted: false, id }
    );
    if (!taskDataList.length) return null;
    const taskData = taskDataList[0];
    if (!taskData) return null;
    return this._taskFactory.createByData(taskData);
  }
}
