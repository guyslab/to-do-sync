import { Component } from '@angular/core';
import { TodoModule } from './features/todo/todo.module';
import { MaterialModule } from './material.module';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [CommonModule, MaterialModule, TodoModule]
})
export class AppComponent {
  title = 'In-Sync To-Do';
}
