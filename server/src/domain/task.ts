import { TaskData } from "./data/task.data";
import { EditionSession } from "./edition-session";
import { UnitOfWork } from "./unit-of-work";

export class Task {
  constructor(private data: TaskData, private uow: UnitOfWork) {
    // Check for expired lock on instantiation
    this.checkAndReleaseExpiredLock();
  }

  markComplete(value: boolean) {
    // Check for expired lock before allowing completion status change
    this.checkAndReleaseExpiredLock();
    
    this.data.complete = value;
    this.touch();
    this.uow.register(this);
  }

  /**
   * Checks if the task has an expired lock and releases it if necessary
   * @returns true if an expired lock was released, false otherwise
   */
  checkAndReleaseExpiredLock(): boolean {
    if (this.data.isLocked && this.data.lockExpiresAt && this.data.lockExpiresAt < new Date()) {
      // Lock has expired, release it automatically
      this.data.isLocked = false;
      this.data.lockedEditionId = undefined;
      this.data.lockExpiresAt = undefined;
      this.touch();
      this.uow.register(this);
      return true;
    }
    return false;
  }

  startEdition(): EditionSession {
    // First check if there's an expired lock that needs to be released
    this.checkAndReleaseExpiredLock();
    
    // Now check if the task is still locked (by a non-expired lock)
    if (this.data.isLocked && this.data.lockExpiresAt! > new Date()) {
      throw new Error("locked");
    }
    
    const session = new EditionSession();
    this.data.isLocked = true;
    this.data.lockedEditionId = session.id;
    this.data.lockExpiresAt = session.expiresAt;
    this.touch();
    this.uow.register(this);
    return session;
  }

  stopEdition(sessionId: string, newTitle?: string): boolean {
    // First check if there's an expired lock that needs to be released
    if (this.checkAndReleaseExpiredLock()) {
      // If we just released an expired lock, and it wasn't the session trying to stop the edition,
      // throw an error as the session is no longer valid
      if (this.data.lockedEditionId !== sessionId) {
        throw new Error("session expired");
      }
    }
    
    if (!this.data.isLocked || this.data.lockedEditionId !== sessionId) {
      throw new Error("locked");
    }
    
    let updated = false;
    if (newTitle !== undefined && newTitle !== this.data.title) {
      this.data.title = newTitle;
      updated = true;
    }
    this.data.isLocked = false;
    this.data.lockedEditionId = undefined;
    this.data.lockExpiresAt = undefined;
    this.touch();
    this.uow.register(this);
    return updated;
  }

  deleteSoft() {
    // Check for expired lock before allowing deletion
    this.checkAndReleaseExpiredLock();
    
    this.data.isDeleted = true;
    this.touch();
    this.uow.register(this);
  }

  static create(title: string, uow: UnitOfWork): Task {
    const now = new Date();
    const d: TaskData = {
      id: this.generateLogicalId(),
      title,
      complete: false,
      isDeleted: false,
      isLocked: false,
      createdAt: now,
      updatedAt: now
    };
    const task = new Task(d, uow);
    uow.register(task);
    return task;
  }

  private static generateLogicalId(): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    return `task-${timestamp}-${randomStr}`;
  }

  toDTO() {
    return {
      id: this.data.id,
      title: this.data.title,
      complete: this.data.complete,
      createdAt: this.data.createdAt,
      updatedAt: this.data.updatedAt,
      isLocked: this.data.isLocked
    };
  }

  getPersistable(): TaskData {
    return this.data;
  }

  private touch() {
    this.data.updatedAt = new Date();
  }
}
