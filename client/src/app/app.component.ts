import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <app-task-list></app-task-list>
    </div>
  `,
  styles: [`
    .app-container {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f8f9fa;
      min-height: 100vh;
    }
  `]
})
export class AppComponent {
  title = 'to-do-sync-client';
}
