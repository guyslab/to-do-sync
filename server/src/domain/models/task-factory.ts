import { TaskFactory } from '../interfaces/factory.interface';
import { Task, TaskData } from '../interfaces/task.interface';
import { DataTransaction, IdGenerator } from '../interfaces/infrastructure.interface';
import { DefaultTask } from './task.model';

export class DefaultTaskFactory implements TaskFactory {
  constructor(
    private _tx: DataTransaction,
    private _idGenerator: IdGenerator
  ) {}

  createByData(data: TaskData): Task {
    return new DefaultTask(data, this._tx, this._idGenerator, false);
  }

  createByTitle(title: string): Task {
    const data: TaskData = {
      id: this._idGenerator.create(),
      title: title,
      complete: false,
      deleted: false,
      createdAt: new Date()
    };
    return new DefaultTask(data, this._tx, this._idGenerator, true);
  }
}
