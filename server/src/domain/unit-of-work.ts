import { Task } from "./task";
import { TaskDAO } from "../infrastructure/task.dao";

export class UnitOfWork {
  private dirtyTasks: Map<string | undefined, Task> = new Map();
  private dao: TaskDAO;

  constructor(dao: TaskDAO) {
    this.dao = dao;
  }

  register(task: Task) {
    this.dirtyTasks.set(task.toDTO().id, task);
  }

  hasWork() {
    return this.dirtyTasks.size > 0;
  }

  async commit() {
    if (!this.hasWork()) return;
    
    const tasks = Array.from(this.dirtyTasks.values());
    this.dirtyTasks.clear();
    
    for (const task of tasks) {
      await this.dao.upsert(task.getPersistable());
    }
  }
}
