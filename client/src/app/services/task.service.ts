import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Task, TasksResponse, TaskEvent } from '../models/task.model';
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

  // Observables that components can subscribe to
  public taskCreated$ = this.taskCreatedSubject.asObservable();
  public taskDeleted$ = this.taskDeletedSubject.asObservable();
  public taskCompleted$ = this.taskCompletedSubject.asObservable();
  public taskIncompleted$ = this.taskIncompletedSubject.asObservable();
  public taskRenamed$ = this.taskRenamedSubject.asObservable();

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
    return this.http.post<Task>(`${this.apiUrl}/tasks`, { title });
  }

  deleteTask(taskId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tasks/${taskId}`);
  }

  toggleTaskCompletion(taskId: string, complete: boolean): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/tasks/${taskId}/completion`, { complete });
  }
}
