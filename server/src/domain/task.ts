import { TaskData } from "./data/task.data";
import { EditionSession } from "./edition-session";

export class Task {
  constructor(private data: TaskData) {}

  /* Business operations ‑- they only mutate `data` internally */
  markComplete(value: boolean) {
    this.data.complete = value;
    this.touch();
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
    return updated;
  }

  deleteSoft() {
    this.data.isDeleted = true;
    this.touch();
  }

  /* Helper */
  static create(title: string): Task {
    const now = new Date();
    const d: TaskData = {
      title,
      complete: false,
      isDeleted: false,
      isLocked: false,
      createdAt: now,
      updatedAt: now
    };
    return new Task(d);
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
