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
    createByData(data: TaskData) : Task
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
interface DataCollectionModifier
{
    upsert<TData>(collection: string, id: string, data: TData): Promise<void>
}
interface DataCollectionQuerier
{
    queryByLiteral<TData>(collection: string, literal: any): Promise<TData[]>
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
        this._expirationMinutes = config.edition.expirationMinutes;
        if (isNew) 
            this._dataTx.register('task', this._data.id, this._data);
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

class DefaultTaskService implements TaskService {
    constructor(
        private _taskRepository: TaskRepository,
        private _taskFactory: TaskFactory,
        private _unitOfWork: UnitOfWork
    ) {}

    async getAll(includeComplete: boolean): Promise<TaskDtoOut[]> {
        const tasks = await this._taskRepository.getAll(includeComplete);
        return tasks.map(task => task.toDto());
    }

    async complete(id: string): Promise<void> {
        const task = await this._taskRepository.getById(id);
        if (!task) throw new Error("notFound");
        task.complete();
        await this._unitOfWork.commit();
    }

    async incomplete(id: string): Promise<void> {
        const task = await this._taskRepository.getById(id);
        if (!task) throw new Error("notFound");
        task.incomplete();
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
        if (!task) throw new Error("notiFound");
        task.setTitle(title, lockKey);
        await this._unitOfWork.commit();
    }

    async delete(id: string): Promise<void> {
        const task = await this._taskRepository.getById(id);
        if (!task) throw new Error("notFound");
        task.delete();
        await this._unitOfWork.commit();
    }

    async create(title: string): Promise<string> {
        const task = this._taskFactory.createByTitle(title);
        await this._unitOfWork.commit();
        return task.toDto().id;
    }
   }
}

class DefaultTaskRepository implements TaskRepository {
    private _collection: string;
    constructor(
        private _dataQuerier: DataCollectionQuerier
    ) {
        _collection = "task";
    }

    async getAll(includeComplete: boolean): Promise<Task[]> {
        const taskDataList = await _dataQuerier.getByLiteral(_collection, { deleted: false, complete: includeComplete});
        return taskDataList.map(data => this._taskFactory.createByData(data));
    }

    async getById(id: string): Promise<Task | null> {
        const taskDataList = await _dataQuerier.getByLiteral(_collection, { deleted: false, id });
        if (!taskDataList.length) return null;
        const taskData = taskDataList[0];
        if (!taskData) return null;
        return this._taskFactory.createByData(taskData);
    }
}

class DefaultTaskFactory implements TaskFactory {
    constructor(
        private _tx: DataTransaction,
        private _idGenerator: IdGenerator)
    { }

    createByData(data: TaskData): Task {
        return new DefaultTask(data, _tx, false);
    }

    createByTitle(title: string): Task {
        const data: TaskData = {
            id: _idGenerator.create(),
            title: title,
            complete: false,
            deleted: false,
            createdAt: new Date()
        };
        return new DefaultTask(data, _tx, true);
    }
}

class DefaultUnitOfWork implements UnitOfWork {
    constructor(
        private _tx: DataTransaction,
        //private _msgPub: MessagesPublisher
    ) {}

    async commit(): Promise<void> {
        await _tx.commit();
        // await _msgPub.commit();
    }
}

class DefaultDataTransaction implements DataTransaction {
    private _changes: Map<string, Map<string, any>> = new Map();
    constructor(
        private _dataModifier: DataCollectionModifier
    ) {}

    register(typeName: string, id: string, data: any): void {
        if (!this._changes.has(typeName)) {
            this._changes.set(typeName, new Map());
        }
        this._changes.get(typeName)!.set(id, data);
    }

    async commit(): Promise<void> {
        for (const [typeName, entities] of this._changes.entries()) {
            for (const [id, data] of entities.entries())
                await _dataModifier.upsert(typeName, id, data);        
    }
}

class DefaultDataCollectionModifier implements DataCollectionModifier {
    constructor(private _db: any) {} 
    async upsert<TData>(collection: string, id: string, data: TData): Promise<void> {
        await this._db.collection(collection).updateOne(
            { id },
            { $set: data },
            { upsert: true });
    }
}

class DefaultDataCollectionQuerier implements DataCollectionQuerier {
    constructor(private _db: any) {} 
    async queryByLiteral<TData>(collection: string, literal: any): Promise<TData[]> {
        return await this._db.collection(collection).find(literal).toArray();
    }
   }
}
