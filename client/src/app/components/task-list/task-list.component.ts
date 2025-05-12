import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Task } from '../../models/task.model';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html'
})
export class TaskListComponent implements OnInit, OnDestroy {
  tasks: Task[] = [];
  newTaskTitle: string = '';
  private subscriptions: Subscription[] = [];

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.loadTasks();
    this.setupWebSocketSubscriptions();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadTasks(): void {
    this.taskService.getTasks().subscribe({
      next: (response) => {
        this.tasks = response.tasks;
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
      }
    });
  }

  private setupWebSocketSubscriptions(): void {
    // Handle task created events
    this.subscriptions.push(
      this.taskService.taskCreated$.subscribe(event => {
        // Only add the task if it doesn't already exist in our list
        if (!this.tasks.some(task => task.id === event.taskId) && event.title) {
          const newTask: Task = {
            id: event.taskId,
            title: event.title,
            complete: false,
            createdAt: new Date().toISOString()
          };
          this.tasks = [...this.tasks, newTask];
        }
      })
    );

    // Handle task deleted events
    this.subscriptions.push(
      this.taskService.taskDeleted$.subscribe(event => {
        this.tasks = this.tasks.filter(task => task.id !== event.taskId);
      })
    );

    // Handle task completed events
    this.subscriptions.push(
      this.taskService.taskCompleted$.subscribe(event => {
        this.tasks = this.tasks.map(task => 
          task.id === event.taskId ? { ...task, complete: true } : task
        );
      })
    );

    // Handle task incompleted events
    this.subscriptions.push(
      this.taskService.taskIncompleted$.subscribe(event => {
        this.tasks = this.tasks.map(task => 
          task.id === event.taskId ? { ...task, complete: false } : task
        );
      })
    );

    // Handle task renamed events
    this.subscriptions.push(
      this.taskService.taskRenamed$.subscribe(event => {
        if (event.title) {
          this.tasks = this.tasks.map(task => 
            task.id === event.taskId ? { ...task, title: event.title! } : task
          );
        }
      })
    );
  }

  addTask(): void {
    if (!this.newTaskTitle.trim()) return;

    this.taskService.createTask(this.newTaskTitle).subscribe({
      next: (createdTask) => {
        // Add the task to our list using the response from the API
        // We don't need to handle the WebSocket event separately as we're already adding the task here
        this.tasks = [...this.tasks, createdTask];
        this.newTaskTitle = '';
      },
      error: (error) => {
        console.error('Error creating task:', error);
      }
    });
  }

  deleteTask(taskId: string): void {
    this.taskService.deleteTask(taskId).subscribe({
      next: () => {
        // Remove the task from our list immediately based on the API response
        // The WebSocket event will be handled separately but won't cause duplication
        this.tasks = this.tasks.filter(task => task.id !== taskId);
      },
      error: (error) => {
        console.error('Error deleting task:', error);
      }
    });
  }

  toggleCompletion(task: Task): void {
    const newStatus = !task.complete;
    
    this.taskService.toggleTaskCompletion(task.id, newStatus).subscribe({
      next: () => {
        // Update the task status immediately based on the API response
        this.tasks = this.tasks.map(t => 
          t.id === task.id ? { ...t, complete: newStatus } : t
        );
      },
      error: (error) => {
        console.error('Error toggling task completion:', error);
      }
    });
  }
}
