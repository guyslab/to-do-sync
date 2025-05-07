import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task } from '../models/task.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getTasks(includeComplete = false, page = 1): Observable<{ tasks: Task[] }> {
    return this.http.get<{ tasks: Task[] }>(`${this.apiUrl}/tasks`, {
      params: { includeComplete: includeComplete.toString(), page: page.toString() }
    });
  }

  createTask(title: string): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/tasks`, { title });
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tasks/${id}`);
  }

  toggleCompletion(id: string, complete: boolean): Observable<Task> {
    return this.http.patch<Task>(`${this.apiUrl}/tasks/${id}`, { complete });
  }

  startEdition(id: string): Observable<{ editionId: string, expires: string }> {
    return this.http.post<{ editionId: string, expires: string }>(`${this.apiUrl}/tasks/${id}/editions`, {});
  }

  finishEdition(id: string, editionId: string, title: string): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/tasks/${id}`, { title }, {
      headers: { 'X-Edition-ID': editionId }
    });
  }
}
