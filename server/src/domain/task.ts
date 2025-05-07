import { TaskData } from "./data/task.data";
import { EditionSession } from "./edition-session";
import { UnitOfWork } from "./unit-of-work";

export class Task {
  constructor(private data: TaskData, private uow: UnitOfWork) {}

  /* Business operations ‑- they only mutate `data` internally and update UoW */
  markComplete(value: boolean) {
    this.data.complete = value;
    this.touch();
    this.uow.register(this);
  }

  startEdition(): EditionSession {
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

  stopEdition(sessionId: string, newTitle?: string): boolean /* wasUpdated */ {
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
    this.data.isDeleted = true;
    this.touch();
    this.uow.register(this);
  }

  /* Helper */
  static create(title: string, uow: UnitOfWork): Task {
    const now = new Date();
    const d: TaskData = {
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

  toDTO() {
    return {
      id: this.data._id,
      title: this.data.title,
      complete: this.data.complete,
      createdAt: this.data.createdAt,
      updatedAt: this.data.updatedAt,
      isLocked: this.data.isLocked
    };
  }

  /* INTERNAL UTILS */
  getPersistable(): TaskData {
    return this.data;
  }

  private touch() {
    this.data.updatedAt = new Date();
  }
}
