import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Task } from '../../core/models/task.model';
import * as TasksActions from './tasks.actions';
import * as TasksSelectors from './tasks.selectors';
import { AppState } from '../app.state';

@Injectable({
  providedIn: 'root'
})
export class TasksFacade {
  tasks$ = this.store.select(TasksSelectors.selectAllTasks);
  loading$ = this.store.select(TasksSelectors.selectTasksLoading);
  error$ = this.store.select(TasksSelectors.selectTasksError);
  
  constructor(private store: Store<AppState>) {}

  loadTasks(includeComplete = false, page = 1): void {
    this.store.dispatch(TasksActions.loadTasks({ includeComplete, page }));
  }

  addTask(title: string): void {
    this.store.dispatch(TasksActions.addTask({ title }));
  }

  startEdit(taskId: string): void {
    this.store.dispatch(TasksActions.startEdit({ taskId }));
  }

  finishEdit(taskId: string, title: string, editionId: string): void {
    this.store.dispatch(TasksActions.finishEdit({ taskId, title, editionId }));
  }

  deleteTask(taskId: string): void {
    this.store.dispatch(TasksActions.deleteTask({ taskId }));
  }

  toggleCompletion(taskId: string, complete: boolean): void {
    this.store.dispatch(TasksActions.toggleCompletion({ taskId, complete }));
  }

  isEditing(taskId: string): Observable<boolean> {
    return this.store.select(TasksSelectors.selectIsEditing(taskId));
  }

  getTaskById(id: string): Observable<Task | undefined> {
    return this.store.select(TasksSelectors.selectTaskById(id));
  }
}
