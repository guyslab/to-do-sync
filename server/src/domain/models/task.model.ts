import { 
  Task, 
  TaskContext, 
  TaskState, 
  TaskData, 
  TaskKey, 
  TaskDtoOut 
} from '../interfaces/task.interface';
import { DataTransaction, IdGenerator } from '../interfaces/infrastructure.interface';
import { EditingTitleTaskState } from './task-states/editing-title.state';
import { NotEditingTaskState } from './task-states/not-editing.state';

// Configuration object
const config = {
  edition: {
    expirationMinutes: Number(process.env.EDITION_EXPIRATION_MINUTES) || 3
  }
};

export class DefaultTask implements Task, TaskContext {
  private _state: TaskState;
  private readonly _expirationMinutes: number;

  constructor(
    private _data: TaskData,
    private _dataTx: DataTransaction,
    private _idGenerator: IdGenerator,
    isNew: boolean
  ) {
    this._state = this.createInitialState();
    this._expirationMinutes = config.edition.expirationMinutes;
    if (isNew) 
      this._dataTx.register('task', this._data.id, this._data);
  }    
  
  complete(): void { this._state.complete(); }
  incomplete(): void { this._state.incomplete(); }
  setTitle(title: string, lockKey: string): void { this._state.setTitle(title, lockKey); }
  delete(): void { this._state.delete(); }
  lockTitle(): TaskKey { return this._state.lockTitle(); }
  
  toDto(): TaskDtoOut {
    return {
      id: this._data.id,
      title: this._data.title,
      complete: this._data.complete,
      createdAt: this._data.createdAt
    };
  }

  // task context
  markComplete(complete: boolean): void {
    this._data.complete = complete;
    this._dataTx.register('task', this._data.id, this._data);
  }
  
  setTitleData(title: string): void {
    this._data.title = title;
    this._dataTx.register('task', this._data.id, this._data);
  }
  
  markDeleted(): void {
    this._data.deleted = true;
    this._dataTx.register('task', this._data.id, this._data);
  }
  
  setKey(): TaskKey {
    const newKey = this.createNewKey();
    this._data.lockKey = newKey.key;
    this._data.lockExpiresAt = newKey.expiresAt;
    this._dataTx.register('task', this._data.id, this._data);
    this._state = this.createInitialState();
    return newKey;
  }
  
  tryDisposeKey(key: string): boolean {
    if (this._data.lockKey != key) return false;
    this.clearLockKey();
    return true;
  }
  
  isReleased(): boolean {
    return !this._data.lockKey || (this._data.lockExpiresAt as Date) < new Date();
  }
  
  private clearLockKey(): void {
    this._data.lockKey = undefined;
    this._data.lockExpiresAt = undefined;
    this._dataTx.register('task', this._data.id, this._data);
    this._state = this.createInitialState();
  }
  
  private createInitialState(): TaskState {
    if (this.isReleased()) return new NotEditingTaskState(this);
    return new EditingTitleTaskState(this);
  }
  
  private createNewKey(): TaskKey {
    return {
      key: this._idGenerator.create(),
      expiresAt: new Date(Date.now() + this._expirationMinutes * 60 * 1000)
    };
  }
}
