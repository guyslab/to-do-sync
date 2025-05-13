import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
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

  constructor(
    private taskService: TaskService,
    private snackBar: MatSnackBar
  ) {}

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
    this.subscriptions.push(
      this.taskService.taskCreated$.subscribe(newTask => {
          this.tasks = [...this.tasks, newTask];
          console.log(newTask, this.tasks.length)
        })
      );

    this.subscriptions.push(
      this.taskService.taskDeleted$.subscribe(event => {
        this.tasks = this.tasks.filter(task => task.id !== event.taskId);
      })
    );

    this.subscriptions.push(
      this.taskService.taskCompleted$.subscribe(event => {
        this.tasks = this.tasks.map(task => 
          task.id === event.taskId ? { ...task, complete: true } : task
        );
      })
    );

    this.subscriptions.push(
      this.taskService.taskIncompleted$.subscribe(event => {
        this.tasks = this.tasks.map(task => 
          task.id === event.taskId ? { ...task, complete: false } : task
        );
      })
    );

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
      // We don't take any action here, as updating the UI occurs in the
        // $taskCreated subscription
      next: _ => { 
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
        this.tasks = this.tasks.map(t => 
          t.id === task.id ? { ...t, complete: newStatus } : t
        );
      },
      error: (error) => {
        console.error('Error toggling task completion:', error);
      }
    });
  }

  startEditing(task: Task): void {
    if (task.isEditing) return;

    this.taskService.beginEdition(task.id).subscribe({
      next: (response) => {
        this.tasks = this.tasks.map(t => 
          t.id === task.id ? { ...t, isEditing: true, editionId: response.editionId } : t
        );
      },
      error: (error) => {
        console.error('Error beginning task edition:', error);
        if (error.message === 'RENAMING_LOCKED') {
          this.snackBar.open('Renaming locked', 'Close', {
            duration: 3000,
            panelClass: ['mat-warn']
          });
        }
      }
    });
  }

  saveEditing(task: Task): void {
    if (!task.editionId) {
      console.error('Cannot save task without an editionId');
      return;
    }

    this.taskService.endEdition(task.id, task.editionId, task.title).subscribe({
      next: () => {
        this.tasks = this.tasks.map(t => 
          t.id === task.id ? { ...t, isEditing: false, editionId: undefined } : t
        );
      },
      error: (error) => {
        console.error('Error saving task edition:', error);
        this.tasks = this.tasks.map(t => 
          t.id === task.id ? { ...t, isEditing: false, editionId: undefined } : t
        );
      }
    });
  }
}
