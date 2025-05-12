import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, switchMap, catchError, exhaustMap, tap } from 'rxjs/operators';
import { TaskApiService } from '../../core/services/task-api.service';
import { WsService } from '../../core/services/ws.service';
import { NotificationService } from '../../core/services/notification.service';
import * as TasksActions from './tasks.actions';

@Injectable()
export class TasksEffects {
  
  // Load Tasks
  loadTasks$ = createEffect(() => this.actions$.pipe(
    ofType(TasksActions.loadTasks),
    switchMap(({ includeComplete, page }) =>
      this.api.getTasks(includeComplete, page).pipe(
        map(res => TasksActions.loadTasksSuccess({ tasks: res.tasks })),
        catchError(error => of(TasksActions.loadTasksFailure({ 
          error: error.message || 'Failed to load tasks' 
        })))
      )
    )
  ));

  // Add Task
  addTask$ = createEffect(() => this.actions$.pipe(
    ofType(TasksActions.addTask),
    switchMap(({ title }) =>
      this.api.createTask(title).pipe(
        map(task => TasksActions.addTaskSuccess({ task })),
        catchError(error => of(TasksActions.addTaskFailure({ 
          error: error.message || 'Failed to add task' 
        })))
      )
    )
  ));

  // Start Edit
  startEdit$ = createEffect(() => this.actions$.pipe(
    ofType(TasksActions.startEdit),
    exhaustMap(({ taskId }) =>
      this.api.startEdition(taskId).pipe(
        map(({ editionId, expires }) => 
          TasksActions.startEditSuccess({ taskId, editionId, expires })),
        catchError(error => {
          // Handle 409 Conflict specifically
          if (error.status === 409) {
            this.notification.showError('This task is currently being edited by someone else');
            // Return failure but with empty error to prevent duplicate notifications
            return of(TasksActions.startEditFailure({ taskId, error: '' }));
          }
          return of(TasksActions.startEditFailure({ 
            taskId, 
            error: error.message || 'Failed to start editing' 
          }));
        })
      )
    )
  ));

  // Finish Edit
  finishEdit$ = createEffect(() => this.actions$.pipe(
    ofType(TasksActions.finishEdit),
    exhaustMap(({ taskId, title, editionId }) =>
      this.api.finishEdition(taskId, editionId, title).pipe(
        map(task => TasksActions.finishEditSuccess({ task })),
        catchError(error => {
          // Handle 409 Conflict specifically
          if (error.status === 409) {
            this.notification.showError('This task is currently being edited by someone else');
            // Return failure but with empty error to prevent duplicate notifications
            return of(TasksActions.finishEditFailure({ taskId, error: '' }));
          }
          return of(TasksActions.finishEditFailure({ 
            taskId, 
            error: error.message || 'Failed to save changes' 
          }));
        })
      )
    )
  ));

  // Delete Task
  deleteTask$ = createEffect(() => this.actions$.pipe(
    ofType(TasksActions.deleteTask),
    switchMap(({ taskId }) =>
      this.api.deleteTask(taskId).pipe(
        map(() => TasksActions.deleteTaskSuccess({ taskId })),
        catchError(error => {
          // Handle 409 Conflict specifically
          if (error.status === 409) {
            this.notification.showError('This task is currently being edited by someone else');
            // Return failure but with empty error to prevent duplicate notifications
            return of(TasksActions.deleteTaskFailure({ taskId, error: '' }));
          }
          return of(TasksActions.deleteTaskFailure({ 
            taskId, 
            error: error.message || 'Failed to delete task' 
          }));
        })
      )
    )
  ));

  // Toggle Completion
  toggleCompletion$ = createEffect(() => this.actions$.pipe(
    ofType(TasksActions.toggleCompletion),
    switchMap(({ taskId, complete }) =>
      this.api.toggleCompletion(taskId, complete).pipe(
        map(() => TasksActions.toggleCompletionSuccess({ taskId, complete })),
        catchError(error => {
          // Handle 409 Conflict specifically
          if (error.status === 409) {
            this.notification.showError('This task is currently being edited by someone else');
            // Return failure but with empty error to prevent duplicate notifications
            return of(TasksActions.toggleCompletionFailure({ taskId, error: '' }));
          }
          return of(TasksActions.toggleCompletionFailure({ 
            taskId, 
            error: error.message || 'Failed to update task status' 
          }));
        })
      )
    )
  ));

  // WebSocket Connection
  wsConnect$ = createEffect(() => this.ws.connect().pipe(
    map(event => {
      switch (event.type) {
        case 'task_created':
          return TasksActions.wsTaskCreated({ task: event.task });
        case 'task_deleted':
          return TasksActions.wsTaskDeleted({ taskId: event.taskId });
        case 'task_renamed':
          return TasksActions.wsTaskRenamed({ 
            taskId: event.taskId, 
            changes: event.changes 
          });
        case 'task_complete':
          return TasksActions.wsTaskComplete({ taskId: event.taskId });
        case 'task_incomplete':
          return TasksActions.wsTaskIncomplete({ taskId: event.taskId });
        default:
          const _exhaustiveCheck: never = event;
          return { type: 'UNKNOWN_WS_EVENT' };
      }
    })
  ));

  // Error Notifications
  showErrors$ = createEffect(() => this.actions$.pipe(
    ofType(
      TasksActions.loadTasksFailure,
      TasksActions.addTaskFailure,
      TasksActions.startEditFailure,
      TasksActions.finishEditFailure,
      TasksActions.deleteTaskFailure,
      TasksActions.toggleCompletionFailure
    ),
    tap(action => {
      // Only show error notification if error is not empty
      if ('error' in action && action.error) {
        this.notification.showError(action.error);
      }
    })
  ), { dispatch: false });

  constructor(
    private actions$: Actions,
    private api: TaskApiService,
    private ws: WsService,
    private notification: NotificationService
  ) {}
}
