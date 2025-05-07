import { Task } from "./task";

export class UnitOfWork {
  private dirtyTasks: Map<string | undefined, Task> = new Map();

  register(task: Task) {
    this.dirtyTasks.set(task.toDTO().id, task);
  }

  pullTasks() {
    const tasks = Array.from(this.dirtyTasks.values());
    this.dirtyTasks.clear();
    return tasks;
  }

  hasWork() {
    return this.dirtyTasks.size > 0;
  }
}
