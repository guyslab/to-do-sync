import { Injectable } from '@angular/core';
import { Observable, Subject, merge, of, timer, throwError } from 'rxjs';
import { map, groupBy, mergeMap, take, takeUntil, share, catchError, tap } from 'rxjs/operators';
import { Task, TasksResponse, TaskEvent, EditionResponse } from '../../../core/models/task.model';
import { ApiService } from '../../../core/api/api.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { EventBusService, EventTypes } from '../../../core/services/event-bus.service';
import { API_ENDPOINTS } from '../../../core/api/endpoints';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  // Deduplicated task creation stream
  public taskCreated$ = this.createDeduplicated$();

  constructor(
    private apiService: ApiService,
    private webSocketService: WebSocketService,
    private eventBus: EventBusService
  ) {
    this.setupWebSocketListeners();
  }

  /**
   * Sets up listeners for WebSocket events
   */
  private setupWebSocketListeners(): void {
    this.webSocketService.messages$.subscribe(message => {
      switch (message.type) {
        case 'task_created':
          const task: Task = {
            id: message.payload.taskId,
            title: message.payload.title!,
            complete: false,
            createdAt: new Date().toISOString()
          };
          this.eventBus.emitTaskCreated(task);
          break;
        case 'task_deleted':
          this.eventBus.emitTaskDeleted(message.payload);
          break;
        case 'task_complete':
          this.eventBus.emitTaskCompleted(message.payload);
          break;
        case 'task_incomplete':
          this.eventBus.emitTaskIncompleted(message.payload);
          break;
        case 'task_renamed':
          this.eventBus.emitTaskRenamed(message.payload);
          break;
      }
    });
  }

  /**
   * Gets all tasks
   */
  getTasks(includeComplete: boolean = false): Observable<TasksResponse> {
    return this.apiService.get<TasksResponse>(API_ENDPOINTS.TASKS, { includeComplete });
  }

  /**
   * Creates a new task
   */
  createTask(title: string): Observable<Task> {
    return this.apiService.post<Task>(API_ENDPOINTS.TASKS, { title })
      .pipe(
        tap(task => {
          this.eventBus.emitHttpTaskCreated(task);
        })
      );
  }

  /**
   * Deletes a task
   */
  deleteTask(taskId: string): Observable<void> {
    return this.apiService.delete<void>(API_ENDPOINTS.TASK_BY_ID(taskId));
  }

  /**
   * Toggles task completion status
   */
  toggleTaskCompletion(taskId: string, complete: boolean): Observable<void> {
    return this.apiService.put<void>(API_ENDPOINTS.TASK_COMPLETION(taskId), { complete });
  }

  /**
   * Begins task edition
   */
  beginEdition(taskId: string): Observable<EditionResponse> {
    return this.apiService.post<EditionResponse>(API_ENDPOINTS.TASK_EDITIONS(taskId), {});
  }

  /**
   * Ends task edition
   */
  endEdition(taskId: string, editionId: string, title: string): Observable<void> {
    return this.apiService.put<void>(API_ENDPOINTS.TASK_EDITION_BY_ID(taskId, editionId), { title });
  }
  
  /**
   * Creates a deduplicated observable for task creation events
   */
  private createDeduplicated$(): Observable<Task> {
    // WebSocket source
    const wsSource$ = this.eventBus.on<Task>(EventTypes.TaskCreated);
    
    // HTTP source
    const httpSource$ = this.eventBus.on<Task>(EventTypes.HttpTaskCreated);
    
    // Merge both sources
    return merge(wsSource$, httpSource$).pipe(
      // Group by taskId
      groupBy(task => task.id),
      
      // For each taskId group
      mergeMap(group => {
        // Take only the first emission within 2 seconds
        return group.pipe(
          takeUntil(timer(2000).pipe(take(1))),
          take(1)
        );
      })
    );
  }
}
