import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Task } from '../../../../core/models/task.model';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-item',
  templateUrl: './task-item.component.html',
  styleUrls: ['./task-item.component.css']
})
export class TaskItemComponent {
  @Input() task!: Task;
  
  constructor(
    private taskService: TaskService,
    private snackBar: MatSnackBar
  ) {}

  /**
   * Toggles task completion status
   */
  toggleCompletion(): void {
    const newStatus = !this.task.complete;
    
    this.taskService.toggleTaskCompletion(this.task.id, newStatus).subscribe({
      error: (error) => {
        console.error('Error toggling task completion:', error);
      }
    });
  }

  /**
   * Starts editing a task
   */
  startEditing(): void {
    if (this.task.isEditing) return;

    this.taskService.beginEdition(this.task.id).subscribe({
      next: (response) => {
        this.task.isEditing = true;
        this.task.editionId = response.editionId;
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

  /**
   * Saves task after editing
   */
  saveEditing(): void {
    if (!this.task.editionId) {
      console.error('Cannot save task without an editionId');
      return;
    }

    this.taskService.endEdition(this.task.id, this.task.editionId, this.task.title).subscribe({
      next: () => {
        this.task.isEditing = false;
        this.task.editionId = undefined;
      },
      error: (error) => {
        console.error('Error saving task edition:', error);
        this.task.isEditing = false;
        this.task.editionId = undefined;
      }
    });
  }

  /**
   * Deletes a task
   */
  deleteTask(): void {
    this.taskService.deleteTask(this.task.id).subscribe({
      error: (error) => {
        console.error('Error deleting task:', error);
      }
    });
  }
}
