export interface TaskDtoOut {
  id: string;
  title: string;
  complete: boolean;
  createdAt: Date;
}

export interface TaskKeyDtoOut {
  key: string;
  expiresAt: Date;
}

export interface TaskData {
  id: string;
  title: string;
  lockKey?: string;
  lockExpiresAt?: Date;
  complete: boolean;
  deleted: boolean;
  createdAt: Date;
}

export interface TaskKey {
  key: string;
  expiresAt: Date;
}

export interface TaskContext {
  markComplete(complete: boolean): void;
  setTitleData(title: string): void;
  markDeleted(): void;
  setKey(): TaskKey;
  tryDisposeKey(key: string): boolean;
  isReleased(): boolean;
}

export interface Task {
  complete(): void;
  incomplete(): void;
  setTitle(title: string, lockKey: string): void;
  delete(): void;
  lockTitle(): TaskKey;
  toDto(): TaskDtoOut;
}

export interface TaskState extends Task { }
