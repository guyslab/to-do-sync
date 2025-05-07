import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Task } from '../../../../core/models/task.model';
import { TasksFacade } from '../../../../store/tasks/tasks.facade';

interface DialogData {
  task?: Task;
  editionId?: string;
}

@Component({
  selector: 'app-task-dialog',
  templateUrl: './task-dialog.component.html',
  styleUrls: ['./task-dialog.component.scss']
})
export class TaskDialogComponent implements OnInit {
  taskForm!: FormGroup;
  isEditing = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<TaskDialogComponent>,
    private tasksFacade: TasksFacade,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  ngOnInit(): void {
    this.isEditing = !!this.data.task;
    
    this.taskForm = this.fb.group({
      title: [this.data.task?.title || '', [Validators.required, Validators.minLength(1)]]
    });
  }

  onSubmit(): void {
    if (this.taskForm.invalid) return;

    const title = this.taskForm.get('title')?.value;

    if (this.isEditing && this.data.task && this.data.editionId) {
      this.tasksFacade.finishEdit(this.data.task.id, title, this.data.editionId);
    } else {
      this.tasksFacade.addTask(title);
    }

    this.dialogRef.close();
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
