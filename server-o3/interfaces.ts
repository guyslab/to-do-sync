// Task Service
export interface TaskService {
    getAll(includeComplete: boolean): Promise<TaskDtoOut[]>
    complete(id: string): Promise<void>
    incomplete(id: string): Promise<void>
    beginEdition(id: string): Promise<TaskKeyDtoOut>
    endEdition(id: string, title: string, lockKey: string): Promise<void>
    delete(id: string): Promise<void>
    create(title: string): Promise<string>
}

// Task Repository
export interface TaskRepository {
    getAll(includeComplete: boolean): Promise<Task[]>
    getById(id: string): Promise<Task | null>
}

// Task Factory
export interface TaskFactory {
    createByData(data: TaskData): Task
    createByTitle(title: string): Task
}

// Task Domain Object
export interface Task {
    complete(): void
    incomplete(): void
    setTitle(title: string, lockKey: string): void
    delete(): void
    lockTitle(): TaskKey
    toDto(): TaskDtoOut
}

export interface TaskKey {
    key: string
    expiresAt: Date
}

export interface TaskContext {
    markComplete(complete: boolean): void
    setTitleData(title: string): void
    markDeleted(): void
    setKey(): TaskKey
    tryDisposeKey(key: string): boolean
}

export interface TaskState extends Task { }

// Task Data Object
export interface TaskData {
    id: string
    title: string
    lockKey?: string
    lockExpiresAt?: Date
    complete: boolean
    deleted: boolean
    createdAt: Date
}

export interface DataTransaction {
    register(typeName: string, id: string, data: any): void
    commit(): Promise<void>
}

export interface DataCollectionModifier {
    upsert<TData>(collection: string, id: string, data: TData): Promise<void>
}

export interface DataCollectionQuerier {
    queryByLiteral<TData>(collection: string, literal: any): Promise<TData[]>
}

// Messaging
export interface MessagesOutbox {
    register<TMsg>(msgType: string, msgPayload: TMsg): void
    commit(): Promise<void>
}

export interface MessagesPublisher {
    publish<TMsg>(msgType: string, msgPayload: TMsg): Promise<void>
}

// Unit of Work
export interface UnitOfWork {
    commit(): Promise<void>
}

// Interface for ID generation
export interface IdGenerator {
    create(): string;
}

// Example TaskDtoOut interface
export interface TaskDtoOut {
    id: string;
    title: string;
    complete: boolean;
    createdAt: Date;
}

// Example TaskKeyDtoOut interface
export interface TaskKeyDtoOut {
    key: string;
    expiresAt: Date;
}
