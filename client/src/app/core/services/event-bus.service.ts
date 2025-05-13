import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Task, TaskEvent } from '../models/task.model';

export enum EventTypes {
  TaskCreated = 'TASK_CREATED',
  TaskDeleted = 'TASK_DELETED',
  TaskCompleted = 'TASK_COMPLETED',
  TaskIncompleted = 'TASK_INCOMPLETED',
  TaskRenamed = 'TASK_RENAMED',
  HttpTaskCreated = 'HTTP_TASK_CREATED'
}

export interface AppEvent<T = any> {
  type: EventTypes;
  payload: T;
}

@Injectable({
  providedIn: 'root'
})
export class EventBusService {
  private eventSubject = new Subject<AppEvent>();
  public events$ = this.eventSubject.asObservable();

  /**
   * Emits an event to the event bus
   */
  emit<T>(type: EventTypes, payload: T): void {
    this.eventSubject.next({ type, payload });
  }

  /**
   * Returns an observable that emits only events of the specified type
   */
  on<T>(eventType: EventTypes): Observable<T> {
    return this.events$.pipe(
      filter(event => event.type === eventType),
      map(event => event.payload as T)
    );
  }

  // Convenience methods for task events
  emitTaskCreated(task: Task): void {
    this.emit(EventTypes.TaskCreated, task);
  }

  emitHttpTaskCreated(task: Task): void {
    this.emit(EventTypes.HttpTaskCreated, task);
  }

  emitTaskDeleted(taskEvent: TaskEvent): void {
    this.emit(EventTypes.TaskDeleted, taskEvent);
  }

  emitTaskCompleted(taskEvent: TaskEvent): void {
    this.emit(EventTypes.TaskCompleted, taskEvent);
  }

  emitTaskIncompleted(taskEvent: TaskEvent): void {
    this.emit(EventTypes.TaskIncompleted, taskEvent);
  }

  emitTaskRenamed(taskEvent: TaskEvent): void {
    this.emit(EventTypes.TaskRenamed, taskEvent);
  }
}
