import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Task } from '../models/task.model';

export type WsEvent = 
  | { type: 'task_created', task: Task }
  | { type: 'task_deleted', taskId: string }
  | { type: 'task_edited', taskId: string, changes: Partial<Task> }
  | { type: 'task_complete', taskId: string }
  | { type: 'task_incomplete', taskId: string }
  | { type: 'task_locked', taskId: string, editionId: string }
  | { type: 'task_released', taskId: string, editionId: string, wasUpdated: boolean };

@Injectable({
  providedIn: 'root'
})
export class WsService {
  connect(): Observable<WsEvent> {
    return webSocket<WsEvent>(environment.wsUrl)
      .pipe(retry({ count: Infinity, delay: 1000 }));
  }
}
