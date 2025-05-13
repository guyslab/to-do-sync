import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, merge, of, timer, throwError } from 'rxjs';
import { map, groupBy, mergeMap, take, takeUntil, share, catchError } from 'rxjs/operators';
import { Task, TasksResponse, TaskEvent, EditionResponse } from '../models/task.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = environment.apiUrl;
  private wsUrl = environment.wsUrl;
  private socket: WebSocket | null = null;
  
  // Subjects for WebSocket events
  private taskCreatedSubject = new Subject<TaskEvent>();
  private taskDeletedSubject = new Subject<TaskEvent>();
  private taskCompletedSubject = new Subject<TaskEvent>();
  private taskIncompletedSubject = new Subject<TaskEvent>();
  private taskRenamedSubject = new Subject<TaskEvent>();
  
  // Subject for HTTP task creation responses
  private httpTaskCreatedSubject = new Subject<Task>();

  // Observables that components can subscribe to
  public taskDeleted$ = this.taskDeletedSubject.asObservable();
  public taskCompleted$ = this.taskCompletedSubject.asObservable();
  public taskIncompleted$ = this.taskIncompletedSubject.asObservable();
  public taskRenamed$ = this.taskRenamedSubject.asObservable();
  
  // Deduplicated task creation stream
  public taskCreated$ = this.createDeduplicated$();

  constructor(private http: HttpClient) {
    this.connectWebSocket();
  }

  private connectWebSocket(): void {
    this.socket = new WebSocket(this.wsUrl);

    this.socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'task_created':
          this.taskCreatedSubject.next(data.payload);
          break;
        case 'task_deleted':
          this.taskDeletedSubject.next(data.payload);
          break;
        case 'task_complete':
          this.taskCompletedSubject.next(data.payload);
          break;
        case 'task_incomplete':
          this.taskIncompletedSubject.next(data.payload);
          break;
        case 'task_renamed':
          this.taskRenamedSubject.next(data.payload);
          break;
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
      // Attempt to reconnect after a delay
      setTimeout(() => this.connectWebSocket(), 5000);
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.socket?.close();
    };
  }

  getTasks(includeComplete: boolean = false): Observable<TasksResponse> {
    return this.http.get<TasksResponse>(`${this.apiUrl}/tasks?includeComplete=${includeComplete}`);
  }

  createTask(title: string): Observable<Task> {
    const request = this.http.post<Task>(`${this.apiUrl}/tasks`, { title });
    
    // Share the HTTP response to avoid multiple HTTP requests
    const sharedRequest = request.pipe(share());
    
    // Emit the HTTP response to our subject
    sharedRequest.subscribe(task => {
      this.httpTaskCreatedSubject.next(task);
    });
    
    return sharedRequest;
  }

  deleteTask(taskId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tasks/${taskId}`);
  }

  toggleTaskCompletion(taskId: string, complete: boolean): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/tasks/${taskId}/completion`, { complete });
  }

  beginEdition(taskId: string): Observable<EditionResponse> {
    return this.http.post<EditionResponse>(`${this.apiUrl}/tasks/${taskId}/editions`, {})
      .pipe(
        catchError(error => {
          if (error.status === 409) {
            return throwError(() => new Error('RENAMING_LOCKED'));
          }
          return throwError(() => error);
        })
      );
  }

  endEdition(taskId: string, editionId: string, title: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/tasks/${taskId}/editions/${editionId}`, { title });
  }
  
  private createDeduplicated$(): Observable<Task> {
    // Convert WebSocket TaskEvent to a format that can be compared with HTTP Task
    const wsSource$ = this.taskCreatedSubject.asObservable();
    
    // HTTP source is already in Task format
    const httpSource$ = this.httpTaskCreatedSubject.asObservable();
    
    // Merge both sources
    return merge(
      wsSource$.pipe(map(event => ({ 
        id: event.taskId, 
        title: event.title!,
        complete: false,
        createdAt: new Date().toISOString() 
      }))),
      
      httpSource$.pipe(map(task => ({ 
        ...task, 
      })))
    ).pipe(
      // Group by taskId
      groupBy(item => item.id),
      
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
