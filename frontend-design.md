IN-SYNC TO-DO – FRONTEND DESIGN (Angular 17 + NgRx 16)

────────────────────────────────────────
1. PROJECT STRUCTURE
────────────────────────────────────────
src/
 ├─ app/
 │   ├─ core/
 │   │   ├─ models/            (task.model.ts, edition.model.ts)
 │   │   ├─ services/
 │   │   │   ├─ task-api.service.ts    (REST)
 │   │   │   ├─ ws.service.ts          (raw WebSocket)
 │   │   │   └─ notification.service.ts(optional)
 │   │   └─ core.module.ts
 │   ├─ store/
 │   │   ├─ tasks/
 │   │   │   ├─ tasks.actions.ts
 │   │   │   ├─ tasks.reducer.ts
 │   │   │   ├─ tasks.effects.ts
 │   │   │   ├─ tasks.selectors.ts
 │   │   │   └─ tasks.facade.ts(optional)
 │   │   └─ app.state.ts
 │   ├─ features/
 │   │   └─ todo/
 │   │       ├─ todo.module.ts
 │   │       ├─ containers/
 │   │       │   └─ todo-list/
 │   │       │       ├─ todo-list.component.(ts|html|scss)
 │   │       ├─ components/
 │   │       │   ├─ todo-item/
 │   │       │   │   ├─ todo-item.component.(ts|html|scss)
 │   │       │   └─ task-dialog/
 │   │       │       ├─ task-dialog.component.(ts|html|scss)
 │   │       └─ guards/, pipes/ (none now)
 │   ├─ material.module.ts
 │   └─ app.component.(ts|html|scss)
 ├─ environments/
 │   └─ environment.ts
 └─ main.ts


────────────────────────────────────────
2. DOMAIN MODELS
────────────────────────────────────────
/* task.model.ts */
export interface Task {
  id: string;
  title: string;
  complete: boolean;
  createdAt: string;
  updatedAt?: string;
  isLocked?: boolean;
  // client-side extra helpers ----------------
  editionId?: string;       // set only for the local user
  editionExpires?: string;  // ISO string
}

export interface EditionLock {
  taskId: string;
  editionId: string;
  expiresAt: string;
}

────────────────────────────────────────
3. UI FLOW
────────────────────────────────────────
AppComponent  →  TodoListComponent  →  n × TodoItemComponent  
                                    ↘  TaskDialogComponent (MatDialog)

• User presses “Add”  → open TaskDialogComponent(empty) → dispatch addTask.
• Click edit pencil  → fire tasks.startEdit(taskId):
    – POST /tasks/{id}/editions
    – backend may 409  → show snack bar
    – when 201  → store returned editionId + expires, open TaskDialog pre-filled.
• Inside dialog press Save → tasks.finishEdit({taskId,title,editionId}) (PUT).
• Delete icon → dispatch delete (allowed only if !isLocked OR task.editionId==mine).
• Checkbox toggle complete ↔ incomplete → dispatch updateComplete.

During any of these mutations NgRx effects call REST, optimistic-update UI, rollback on error.

Any OTHER browser tab receives ws events → reducer patches entity cache instantly (no refresh).

────────────────────────────────────────
4. STATE MANAGEMENT WITH NGRX
────────────────────────────────────────
4.1 ACTIONS (tasks.actions.ts – subset)
loadTasks, loadTasksSuccess, loadTasksFailure
addTask, addTaskSuccess, addTaskFailure
startEdit, startEditSuccess, startEditFailure
finishEdit, finishEditSuccess, finishEditFailure
deleteTask, deleteTaskSuccess, deleteTaskFailure
toggleCompletion, toggleCompletionSuccess, toggleCompletionFailure

WebSocket-triggered:  
wsTaskCreated, wsTaskDeleted, wsTaskEdited, wsTaskComplete, wsTaskIncomplete, wsTaskLocked, wsTaskReleased

4.2 REDUCER (tasks.reducer.ts)
Using createEntityAdapter<Task>(). Additional state:
{
  loading: boolean;
  error?: string | null;
  editing: { [taskId: string]: EditionLock };   // only sessions started by THIS tab
}
Reducer reacts to REST & WS actions; WS actions are always treated as authoritative,
e.g. wsTaskLocked sets entity.isLocked=true even if we were editing (unless editionId matches).

4.3 SELECTORS (tasks.selectors.ts)
selectAllTasks         – entity adapter
selectOrderedTasks     – by createdAt desc
selectLockedIds
selectIsEditing(taskId)

4.4 FACADE (optional convenience) exposes Observables for component layer.

────────────────────────────────────────
5. EFFECTS (tasks.effects.ts)
@Injectable()
export class TasksEffects {
  /* REST FLOW ---------------------------------------------------- */
  load$ = createEffect(() => this.actions$.pipe(
    ofType(loadTasks),
    switchMap(({includeComplete,page}) =>
      this.api.getTasks(includeComplete,page).pipe(
        map(res => loadTasksSuccess({tasks: res.tasks})),
        catchError(err => of(loadTasksFailure({error: err.message})))
      )
    )
  ));

  add$ = createEffect(/* … */);
  toggleCompletion$ = createEffect(/* … */);
  startEdit$ = createEffect(() =>
    this.actions$.pipe(
      ofType(startEdit),
      exhaustMap(({taskId}) =>
        this.api.startEdition(taskId).pipe(
          map(({editionId,expires}) =>
               startEditSuccess({taskId,editionId,expires})),
          catchError(err => of(startEditFailure({taskId,error:err})))
        )
      )
    )
  );

  finishEdit$ = createEffect(/* PUT call */);
  delete$ = createEffect(/* … */);

  /* WEBSOCKET FLOW ---------------------------------------------- */
  wsConnect$ = createEffect(() =>
    this.ws.connect().pipe(          // returns stream of WsEvent
      map(event => {
        switch(event.type){
          case 'task_created':   return wsTaskCreated({task:event.task});
          case 'task_deleted':   return wsTaskDeleted({taskId:event.taskId});
          case 'task_edited':    return wsTaskEdited({taskId:event.taskId,changes:event.changes});
          case 'task_complete':  return wsTaskComplete({taskId:event.taskId});
          case 'task_incomplete':return wsTaskIncomplete({taskId:event.taskId});
          case 'task_locked':    return wsTaskLocked({taskId:event.taskId,editionId:event.editionId});
          case 'task_released':  return wsTaskReleased({taskId:event.taskId,editionId:event.editionId,wasUpdated:event.wasUpdated});
        }
      })
    )
  , {dispatch:true});
  constructor(private actions$:Actions,
              private api:TaskApiService,
              private ws:WsService){}
}

────────────────────────────────────────
6. CORE SERVICES
────────────────────────────────────────
6.1 TaskApiService (REST wrapper)
• getTasks(includeComplete=false,page=1)
• createTask(title)
• deleteTask(id)
• toggleCompletion(id,complete)
• startEdition(id)          // POST /tasks/{id}/editions
  – returns {editionId,expires}
• finishEdition(id,editionId,title)
All returning RxJS Observables.

6.2 WsService (low-level WebSocket)
@Injectable({providedIn:'root'})
export class WsService {
  connect(): Observable<WsEvent> {
    return webSocket<WsEvent>('ws://localhost:3000')
           .pipe(retry({count:Infinity,delay:1000}));
  }
}

WsEvent is union of AsyncAPI payloads.

────────────────────────────────────────
7. PRESENTATION COMPONENTS
────────────────────────────────────────
7.1 TodoListComponent
template:
<mat-toolbar color="primary">
  <span>In-Sync To-Do</span>
  <span class="spacer"></span>
  <button mat-icon-button (click)="add()"><mat-icon>add</mat-icon></button>
</mat-toolbar>

<mat-list>
  <app-todo-item *ngFor="let task of tasks$ | async"
                 [task]="task"
                 (edit)="onEdit(task)"
                 (delete)="onDelete(task)"
                 (toggle)="onToggle(task)">
</mat-list>

ts:
tasks$ = this.facade.tasks$;
constructor(private facade:TasksFacade, private dialog:MatDialog){}

add() { this.dialog.open(TaskDialogComponent, {data:{}}); }
onEdit(t:Task){ /* startEdit flow then open dialog */ }
…

7.2 TodoItemComponent
Input() task:Task
Output() edit = new EventEmitter<Task>(); etc.
template:
<mat-list-item>
  <mat-checkbox [checked]="task.complete"
                (change)="toggle.emit(task)"
                [disabled]="task.isLocked && !task.editionId">
  </mat-checkbox>
  <div class="title" [class.done]="task.complete">{{task.title}}</div>
  <mat-progress-spinner diameter="16" mode="indeterminate"
        *ngIf="task.isLocked && !task.editionId"></mat-progress-spinner>
  <button mat-icon-button (click)="edit.emit(task)" [disabled]="task.isLocked && !task.editionId">
      <mat-icon>edit</mat-icon>
  </button>
  <button mat-icon-button color="warn" (click)="delete.emit(task)"
          [disabled]="task.isLocked && !task.editionId">
      <mat-icon>delete</mat-icon>
  </button>
</mat-list-item>

7.3 TaskDialogComponent
Injected MAT_DIALOG_DATA: { task?: Task, editionId?:string }
FormControl for title.
On Save → if task exists → facade.finishEdit(...) else → facade.add(...).

────────────────────────────────────────
8. MATERIAL MODULE (material.module.ts)
imports/exports of MatToolbarModule, MatListModule, MatIconModule, MatButtonModule,
MatCheckboxModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSnackBarModule,
MatProgressSpinnerModule, ReactiveFormsModule.

────────────────────────────────────────
9. ENVIRONMENT
────────────────────────────────────────
export const environment = {
  apiUrl: 'http://localhost:3000',
  wsUrl:  'ws://localhost:3000'
};

────────────────────────────────────────
10. EDGE-CASES & RULES IMPLEMENTATION
────────────────────────────────────────
• Who can edit? → Button disabled if task.isLocked && task.editionId != mine.
• Edition lock auto-expires (X-Edition-Expires header).  
  – On startEditSuccess store expires;  
  – Schedule timer: when expiresAt ≤ now, reducer sets isLocked=false, delete editionId.
• If server sends task_released with wasUpdated=true → UI already updated by subsequent
  task_edited event; still set isLocked=false.
• 409 responses displayed via NotificationService (MatSnackBar).

────────────────────────────────────────
11. SIMPLE STYLES (SCSS HINT)
.title       { flex:1 }
.title.done  { text-decoration: line-through; opacity:.6 }

────────────────────────────────────────
12. HOW NGRX TURNS WS EVENTS INTO THE UI
────────────────────────────────────────
1. WsService pushes event objects on a single observable stream.
2. tasks.effects.wsConnect$ maps each raw event → dedicated NgRx action.
3. tasks.reducer handles those actions by patching entity adapter state.
   • Example: wsTaskComplete sets entity.update(id,{complete:true});
4. Components subscribe to facade.tasks$; ChangeDetection runs and view updates instantly.
No manual refresh needed.

────────────────────────────────────────
13. DESIGN PATTERNS RECAP
────────────────────────────────────────
• Service pattern  – TaskApiService, WsService.
• Reactive programming – RxJS/NgRx for async flows, entity adapter for immutable updates.
• Singleton – Core services providedIn:'root'.
• Presentational vs Container components – TodoItem vs TodoList.
• Repository pattern lives server-side; not relevant here.

This blueprint gives a complete, minimal yet production-ready Angular front-end that
strictly follows the OpenAPI and AsyncAPI contracts, keeps all browser tabs in perfect
synchronisation, and enforces single-editor locking logic.
