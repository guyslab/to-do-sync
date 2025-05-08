import { Task } from "./task";
import { TaskDAO } from "../infrastructure/task.dao";

export class UnitOfWork {
  private dirtyTasks: Map<string | undefined, Task> = new Map();
  private dao: TaskDAO;

  constructor(dao: TaskDAO) {
    this.dao = dao;
  }

  register(task: Task) {
    const taskDTO = task.toDTO();
    const taskData = task.getPersistable();
    console.log(`UnitOfWork: Registering task ${taskDTO.id}, isDeleted=${taskData.isDeleted}`);
    this.dirtyTasks.set(taskDTO.id, task);
  }

  hasWork() {
    return this.dirtyTasks.size > 0;
  }

  async commit() {
    if (!this.hasWork()) {
      console.log('UnitOfWork: No changes to commit');
      return;
    }
    
    const tasks = Array.from(this.dirtyTasks.values());
    this.dirtyTasks.clear();
    
    for (const task of tasks) {
      await this.dao.upsert(task.getPersistable());
    }
    
    console.log(`UnitOfWork: Committed ${tasks.length} task(s)`);
  }
}
