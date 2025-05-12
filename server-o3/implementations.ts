import {
    Task,
    TaskContext,
    TaskState,
    TaskData,
    DataTransaction,
    TaskKey,
    TaskDtoOut,
    TaskRepository,
    TaskFactory,
    UnitOfWork,
    MessagesOutbox,
    DataCollectionQuerier,
    DataCollectionModifier,
    MessagesPublisher,
    IdGenerator,
    TaskService,
    TaskKeyDtoOut
} from './interfaces';

// Configuration object
export const config = {
    edition: {
        expirationMinutes: 3
    }
};

// Implementations
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

export class NotEditingTaskState implements TaskState { 
    constructor(private _ctx: TaskContext) { }

    complete(): void { this._ctx.markComplete(true); }
    incomplete(): void { this._ctx.markComplete(false); }
    setTitle(title: string, lockKey: string): void { throw new Error("unlocked"); }
    delete(): void { this._ctx.markDeleted(); }
    lockTitle(): TaskKey { return this._ctx.setKey(); }
    toDto(): TaskDtoOut { throw new Error("Method not implemented."); }
}

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

export class DefaultTaskRepository implements TaskRepository {
    private _collection: string;
    
    constructor(
        private _dataQuerier: DataCollectionQuerier,
        private _taskFactory: TaskFactory
    ) {
        this._collection = "task";
    }

    async getAll(includeComplete: boolean): Promise<Task[]> {
        const taskDataList = await this._dataQuerier.queryByLiteral(this._collection, { deleted: false, complete: includeComplete}) as TaskData[];
        return taskDataList.map(data => this._taskFactory.createByData(data));
    }

    async getById(id: string): Promise<Task | null> {
        const taskDataList = await this._dataQuerier.queryByLiteral(this._collection, { deleted: false, id }) as TaskData[];
        if (!taskDataList.length) return null;
        const taskData = taskDataList[0];
        if (!taskData) return null;
        return this._taskFactory.createByData(taskData);
    }
}

export class DefaultTaskFactory implements TaskFactory {
    constructor(
        private _tx: DataTransaction,
        private _idGenerator: IdGenerator
    ) { }

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

export class DefaultUnitOfWork implements UnitOfWork {
    constructor(
        private _tx: DataTransaction,
        private _outbox: MessagesOutbox
    ) {}

    async commit(): Promise<void> {
        await this._tx.commit();
        await this._outbox.commit();
    }
}

export class DefaultDataTransaction implements DataTransaction {
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
            for (const [id, data] of entities.entries()) {
                await this._dataModifier.upsert(typeName, id, data);
            }
        }
        this._changes.clear();
    }
}

export class DefaultDataCollectionModifier implements DataCollectionModifier {
    constructor(private _db: any) {} 
    
    async upsert<TData>(collection: string, id: string, data: TData): Promise<void> {
        await this._db.collection(collection).updateOne(
            { id },
            { $set: data },
            { upsert: true });
    }
}

export class DefaultDataCollectionQuerier implements DataCollectionQuerier {
    constructor(private _db: any) {} 
    
    async queryByLiteral<TData>(collection: string, literal: any): Promise<TData[]> {
        return await this._db.collection(collection).find(literal).toArray();
    }
}

export class DefaultMessagesOutbox implements MessagesOutbox {
    private _messages: Map<string, any[]> = new Map();
    
    constructor(
        private _publisher: MessagesPublisher
    ) {}

    register<TMsg>(msgType: string, msgPayload: TMsg): void {
        if (!this._messages.has(msgType)) {
            this._messages.set(msgType, []);
        }
        this._messages.get(msgType)!.push(msgPayload);
    }

    async commit(): Promise<void> {
        for (const [msgType, payloads] of this._messages.entries()) {
            for (const payload of payloads) {
                await this._publisher.publish(msgType, payload);
            }
        }
        this._messages.clear();
    }
}

export class DefaultMessagesPublisher implements MessagesPublisher {
    constructor(private _wsServer: any) { } 
    
    async publish<TMsg>(msgType: string, msgPayload: TMsg): Promise<void> {
        await this._wsServer.emit(msgType, msgPayload);
    }
}

export class UuidGenerator implements IdGenerator {
    create(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}
