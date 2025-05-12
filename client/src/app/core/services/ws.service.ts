import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task } from '../models/task.model';
import { io, Socket } from 'socket.io-client';

export type WsEvent = 
  | { type: 'task_created', task: Task }
  | { type: 'task_deleted', taskId: string }
  | { type: 'task_renamed', taskId: string, changes: Partial<Task> }
  | { type: 'task_complete', taskId: string }
  | { type: 'task_incomplete', taskId: string };

@Injectable({
  providedIn: 'root'
})
export class WsService {
  private socket: Socket | null = null;
  private events$ = new Subject<WsEvent>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(): Observable<WsEvent> {
    if (!this.socket) {
      console.log('Connecting to WebSocket server at:', environment.wsUrl);
      
      this.socket = io(environment.wsUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        autoConnect: true,
        forceNew: true
      });

      // Set up event listeners
      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server with ID:', this.socket?.id);
        this.reconnectAttempts = 0;
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected from WebSocket server:', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('Max reconnection attempts reached. Giving up.');
        }
      });

      // Listen for all task events
      this.socket.on('task_created', (task: Task) => {
        this.events$.next({ type: 'task_created', task });
      });

      this.socket.on('task_deleted', (taskId: string) => {
        this.events$.next({ type: 'task_deleted', taskId });
      });

      this.socket.on('task_renamed', (data: { taskId: string, changes: Partial<Task> }) => {
        this.events$.next({ type: 'task_renamed', taskId: data.taskId, changes: data.changes });
      });

      this.socket.on('task_complete', (taskId: string) => {
        this.events$.next({ type: 'task_complete', taskId });
      });

      this.socket.on('task_incomplete', (taskId: string) => {
        this.events$.next({ type: 'task_incomplete', taskId });
      });
    }

    return this.events$.asObservable();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
