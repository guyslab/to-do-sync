import { TaskContext, TaskDtoOut, TaskKey, TaskState } from '../../interfaces/task.interface';

export class EditingTitleTaskState implements TaskState { 
  constructor(private _ctx: TaskContext) { }

  complete(): void { throw new Error("locked"); }
  incomplete(): void { throw new Error("locked"); }
  
  setTitle(title: string, lockKey: string): void {
    if (this._ctx.tryDisposeKey(lockKey))
      this._ctx.setTitleData(title);
    else 
      throw new Error("locked");
  }
  
  delete(): void { throw new Error("locked"); }
  lockTitle(): TaskKey { throw new Error("locked"); }
  toDto(): TaskDtoOut { throw new Error("Method not implemented."); }
}
