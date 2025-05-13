import { Component, Output, EventEmitter } from '@angular/core';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.css']
})
export class TaskFormComponent {
  newTaskTitle: string = '';

  constructor(private taskService: TaskService) {}

  /**
   * Adds a new task
   */
  addTask(): void {
    if (!this.newTaskTitle.trim()) return;

    this.taskService.createTask(this.newTaskTitle).subscribe({
      next: _ => { 
        this.newTaskTitle = '';
      },
      error: (error) => {
        console.error('Error creating task:', error);
      }
    });
  }
}
