import { Task } from "../domain/task";
import { TaskDAO } from "../infrastructure/task.dao";
import { UnitOfWork } from "../domain/unit-of-work";

export class TaskRepository {
  constructor(private dao: TaskDAO, private uow: UnitOfWork) {}

  async byId(id: string): Promise<Task | null> {
    const data = await this.dao.findById(id);
    if (!data) return null;
    return new Task(data);
  }

  track(task: Task) {
    this.uow.register(task);
  }

  async query(includeComplete: boolean, page: number) {
    const result = await this.dao.query(includeComplete, page);
    return {
      tasks: result.tasks.map((d) => new Task(d)),
      total: result.total
    };
  }
}
