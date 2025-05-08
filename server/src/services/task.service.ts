import { TaskRepository } from "../repositories/task.repository";
import { UnitOfWork } from "../domain/unit-of-work";
import { Task } from "../domain/task";
import EventPublisher from "../infrastructure/event.publisher";

export class TaskService {
  constructor(private repo: TaskRepository, private uow: UnitOfWork) {}

  async list(includeComplete: boolean, page: number) {
    const { tasks, total } = await this.repo.query(includeComplete, page);
    return {
      tasks: tasks.map((t) => t.toDTO()),
      total
    };
  }

  async create(title: string) {
    const task = Task.create(title, this.uow);
    await this.uow.commit();
    const taskDTO = task.toDTO();
    EventPublisher.emit("task_created", { task: taskDTO });
    return taskDTO;
  }

  async delete(id: string) {
    const task = await this.repo.byId(id);
    if (!task) throw new Error("not-found");
    task.deleteSoft();
    await this.uow.commit();
    EventPublisher.emit("task_deleted", { taskId: id });
  }

  async markComplete(id: string, complete: boolean) {
    const task = await this.repo.byId(id);
    if (!task) throw new Error("not-found");
    task.markComplete(complete);
    await this.uow.commit();
    EventPublisher.emit(
      complete ? "task_complete" : "task_incomplete",
      { taskId: id }
    );
  }

  async startEdition(id: string) {
    const task = await this.repo.byId(id);
    if (!task) throw new Error("not-found");
    try {
      const session = task.startEdition();
      await this.uow.commit();
      EventPublisher.emit("task_locked", {
        taskId: id,
        editionId: session.id
      });
      return session;
    } catch {
      throw new Error("locked");
    }
  }

  async stopEdition(id: string, editionId: string, newTitle: string) {
    const task = await this.repo.byId(id);
    if (!task) throw new Error("not-found");
    let wasUpdated: boolean;
    try {
      wasUpdated = task.stopEdition(editionId, newTitle);
      await this.uow.commit();
    } catch {
      throw new Error("locked");
    }
    EventPublisher.emit("task_released", {
      taskId: id,
      editionId,
      wasUpdated
    });
    if (wasUpdated) {
      EventPublisher.emit("task_edited", {
        taskId: id,
        changes: { title: newTitle }
      });
    }
    return wasUpdated;
  }
}
