import { TaskContext, TaskDtoOut, TaskKey, TaskState } from '../../interfaces/task.interface';

export class NotEditingTaskState implements TaskState { 
  constructor(private _ctx: TaskContext) { }

  complete(): void { this._ctx.markComplete(true); }
  incomplete(): void { this._ctx.markComplete(false); }
  setTitle(title: string, lockKey: string): void { throw new Error("unlocked"); }
  delete(): void { this._ctx.markDeleted(); }
  
  lockTitle(): TaskKey { 
    if (this._ctx.isReleased && !this._ctx.isReleased())
      throw new Error('locked');
    return this._ctx.setKey();
  }
  
  toDto(): TaskDtoOut { throw new Error("Method not implemented."); }
}
