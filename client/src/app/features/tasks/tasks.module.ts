import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatToolbarModule } from '@angular/material/toolbar';

import { TaskListComponent } from './components/task-list/task-list.component';
import { TaskItemComponent } from './components/task-item/task-item.component';
import { TaskFormComponent } from './components/task-form/task-form.component';
import { TaskService } from './services/task.service';

@NgModule({
  declarations: [
    TaskListComponent,
    TaskItemComponent,
    TaskFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    // Angular Material Modules
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatListModule,
    MatFormFieldModule,
    MatToolbarModule
  ],
  exports: [
    TaskListComponent
  ],
  providers: [
    TaskService
  ]
})
export class TasksModule { }
