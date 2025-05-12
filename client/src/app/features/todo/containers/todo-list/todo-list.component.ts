import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { Task } from '../../../../core/models/task.model';
import { TasksFacade } from '../../../../store/tasks/tasks.facade';
import { TaskDialogComponent } from '../../components/task-dialog/task-dialog.component';

@Component({
  selector: 'app-todo-list',
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoListComponent implements OnInit {
  tasks$: Observable<Task[]>;
  loading$: Observable<boolean>;

  constructor(
    private facade: TasksFacade,
    private dialog: MatDialog
  ) {
    this.tasks$ = this.facade.tasks$;
    this.loading$ = this.facade.loading$;
  }

  ngOnInit(): void {
    this.facade.loadTasks();
  }

  add(): void {
    this.dialog.open(TaskDialogComponent, {
      width: '400px',
      data: {}
    });
  }

  onEdit(task: Task): void {
    this.facade.startEdit(task.id);
    
    // Subscribe to get the edition ID when it's available
    this.facade.isEditing(task.id).subscribe(isEditing => {
      if (isEditing) {
        this.facade.getTaskById(task.id).subscribe(updatedTask => {
          if (updatedTask && updatedTask.editionId) {
            this.dialog.open(TaskDialogComponent, {
              width: '400px',
              data: {
                task: updatedTask,
                editionId: updatedTask.editionId
              }
            });
          }
        });
      }
    });
  }

  onDelete(task: Task): void {
    this.facade.deleteTask(task.id);
  }

  onToggle(task: Task): void {
    this.facade.toggleCompletion(task.id, !task.complete);
  }
}
