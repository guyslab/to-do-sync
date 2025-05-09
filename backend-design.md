# Task Service
interface TaskService
{
    getAll(includeComplete: boolean): Promise<TaskDtoOut[]>
    complete(id: string): Promise<void>
    incomplete(id: string): Promise<void>
    beginEdition(id: string) : Promise<TaskKeyDtoOut>
    endEdition(id: string, title: string, lockKey: string): Promise<void>
    delete(id: string): Promise<void>
    create(title: string): Promise<string>
}

# Task Repository
interface TaskRepository
{
    getAll(includeComplete: boolean): Promise<Task[]>
    getById(id: string): Promise<Task | null>
}

# Task Factory
interface TaskFactory
{
    createByData(data: TaskData, dataTx: DataTransaction) : Task
    createByTitle(title: string): Task
}

# Task Domain Object

interface Task
{
    complete(): void
    incomplete(): void
    setTitle(title: string, lockKey: string): void
    delete(): void
    lockTitle(): TaskKey
    toDto(): TaskDtoOut
}
interface TaskKey 
{
    key: string
    expiresAt: Date
}
interface TaskContext
{
    markComplete(complete: boolean): void
    setTitleData(title: string): void
    markDeleted(): void
    setKey(): TaskKey
    tryDisposeKey(key: string): boolean
}
interface TaskState extends Task { }

# Task Data Object
interface TaskData
{
    id: string
    title: string
    lockKey?: string
    lockExpiresAt?: Date
    complete: boolean
    deleted: boolean
    createdAt: Date
}
interface DataTransaction
{
    register(typeName: string, id: string, data: any): void
    commit(): Promise<void>
}
interface DataCollectionUpserter
{
    upsert<TData>(collection: string, id?: string, data: TData): void
}
interface DataCollectionQuerier
{
    queryByLiteral(collection: string, literal: any): TData
}

# Unit of Work
interface UnitOfWork
{
    commit(): Promise<void>
}

# Implementations
class DefaultTask implements Task, TaskContext
{
    private readonly _state: TaskState
    private readonly _expirationMinutes: number

    constructor(
        private _data: TaskData,
        private _dataTx: DataTransaction,
        isNew: boolean)
    {
        this._state = this.createInitialState();
        this._expirationMinutes = config.edition.expirationMinutes,
    }    
    complete(): void => this._state.complete();
    incomplete(): void => this._state.incomplete();
    setTitle(title: string, lockKey: string): void => this._state.setTitle(title, lockKey);
    delete(): void => this._state.delete();
    lockTitle(): TaskKey => this._state.lockTitle();

    // task context
    markComplete(complete: boolean): void {
        this._data.complete = complete;
        this._dataTx.add('task', this._data.id, this._data);
    }
    setTitleData(title: string): void {
        this._data.title = title;
        this._dataTx.add('task', this._data.id, this._data);
    }
    markDeleted(): void {
        this._data.deleted = true;
        this._dataTx.add('task', this._data.id, this._data);
    }
    setKey(): TaskKey {
        var newKey = this.createNewKey();
        this._data.lockKey = newKey;
        this._data.lockExpiresAt = new Date(Date.now() + this._expirationMinutes * 60 * 1000);
        this._dataTx.add('task', this._data.id, this._data);
    }
    tryDisposeKey(key: string): boolean {
        if (this._data.lockKey != key) return false;
        this.clearLockKey();
        return true;
    }
    private isReleased(): boolean => !this._data.lockKey || this._data.lockExpiresAt > new Date();
    private clearLockKey(): void {
        this._data.lockKey = undefined;
        this._data.lockExpiresAt = undefined;
        this._dataTx.add('task', this._data.id, this._data);
    }
    private createInitialState() : TaskState {
        if (this.isReleased()) return new NotEditingTaskState(this as TaskContext);
        return new EditingTaskState(this as TaskContext);
    }
}
    
class EditingTitleTaskState implements TaskState { 
    constrctor(
        private _ctx: TaskContext) { }

    complete(): void => throw new Error("locked");
    incomplete(): void => throw new Error("locked");
    setTitle(title: string, lockKey: string): void {
        if (_ctx.tryDisposeKey(lockKey))
            _ctx.setTitleData(title);
        else 
            throw new Error("locked");
    }
    delete(): void => throw new Error("locked");
    lockTitle(): TaskKey => throw new Error("locked");
}
class NotEditingTaskState implements TaskState { 
    constrctor(
        private _ctx: TaskContext) { }

    complete(): void => _ctx.markComplete(true);
    incomplete(): void =>  _ctx.markComplete(false);
    setTitle(title: string, lockKey: string): void => throw new Error("unlocked");
    delete(): void => _ctx.markDeleted();
    lockTitle(): TaskKey => _ctx.setKey();
}
