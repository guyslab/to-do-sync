import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Task, TaskEvent } from '../../../../core/models/task.model';
import { TaskService } from '../../services/task.service';
import { EventBusService, EventTypes } from '../../../../core/services/event-bus.service';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css']
})
export class TaskListComponent implements OnInit, OnDestroy {
  tasks: Task[] = [];
  private subscriptions: Subscription[] = [];

  constructor(
    private taskService: TaskService,
    private eventBus: EventBusService
  ) {}

  ngOnInit(): void {
    this.loadTasks();
    this.setupEventSubscriptions();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Loads all tasks from the API
   */
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

  /**
   * Sets up subscriptions to event bus events
   */
  private setupEventSubscriptions(): void {
    // Task created events
    this.subscriptions.push(
      this.taskService.taskCreated$.subscribe(newTask => {
        this.tasks = [...this.tasks, newTask];
      })
    );

    // Task deleted events
    this.subscriptions.push(
      this.eventBus.on<TaskEvent>(EventTypes.TaskDeleted).subscribe(event => {
        this.tasks = this.tasks.filter(task => task.id !== event.taskId);
      })
    );

    // Task completed events
    this.subscriptions.push(
      this.eventBus.on<TaskEvent>(EventTypes.TaskCompleted).subscribe(event => {
        this.tasks = this.tasks.map(task => 
          task.id === event.taskId ? { ...task, complete: true } : task
        );
      })
    );

    // Task incompleted events
    this.subscriptions.push(
      this.eventBus.on<TaskEvent>(EventTypes.TaskIncompleted).subscribe(event => {
        this.tasks = this.tasks.map(task => 
          task.id === event.taskId ? { ...task, complete: false } : task
        );
      })
    );

    // Task renamed events
    this.subscriptions.push(
      this.eventBus.on<TaskEvent>(EventTypes.TaskRenamed).subscribe(event => {
        if (event.title) {
          this.tasks = this.tasks.map(task => 
            task.id === event.taskId ? { ...task, title: event.title! } : task
          );
        }
      })
    );
  }
}
