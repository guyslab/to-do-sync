import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { TaskApiService } from './services/task-api.service';
import { WsService } from './services/ws.service';
import { NotificationService } from './services/notification.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule
  ],
  providers: [
    TaskApiService,
    WsService,
    NotificationService
  ]
})
export class CoreModule { }
