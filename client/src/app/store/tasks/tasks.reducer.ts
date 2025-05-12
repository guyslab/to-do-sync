import { createReducer, on } from '@ngrx/store';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { Task, EditionLock } from '../../core/models/task.model';
import * as TasksActions from './tasks.actions';

export interface State extends EntityState<Task> {
  loading: boolean;
  error: string | null;
  editing: { [taskId: string]: EditionLock };
}

export const adapter: EntityAdapter<Task> = createEntityAdapter<Task>();

export const initialState: State = adapter.getInitialState({
  loading: false,
  error: null,
  editing: {}
});

export const reducer = createReducer(
  initialState,

  // Load Tasks
  on(TasksActions.loadTasks, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(TasksActions.loadTasksSuccess, (state, { tasks }) => 
    adapter.setAll(tasks, { ...state, loading: false })
  ),
  on(TasksActions.loadTasksFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Add Task
  on(TasksActions.addTask, state => ({
    ...state,
    loading: true
  })),
  on(TasksActions.addTaskSuccess, (state, { task }) => 
    adapter.addOne(task, { ...state, loading: false })
  ),
  on(TasksActions.addTaskFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Start Edit
  on(TasksActions.startEdit, state => ({
    ...state,
    loading: true
  })),
  on(TasksActions.startEditSuccess, (state, { taskId, editionId, expires }) => {
    const task = state.entities[taskId];
    if (!task) return state;

    const updatedTask = { 
      ...task, 
      isLocked: true,
      editionId,
      editionExpires: expires
    };

    const editing = { 
      ...state.editing,
      [taskId]: { taskId, editionId, expiresAt: expires }
    };

    return adapter.updateOne(
      { id: taskId, changes: updatedTask },
      { ...state, loading: false, editing }
    );
  }),
  on(TasksActions.startEditFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Finish Edit
  on(TasksActions.finishEdit, state => ({
    ...state,
    loading: true
  })),
  on(TasksActions.finishEditSuccess, (state, { task }) => {
    const { [task.id]: removed, ...remainingEditing } = state.editing;
    
    return adapter.updateOne(
      { 
        id: task.id, 
        changes: { 
          ...task, 
          isLocked: false,
          editionId: undefined,
          editionExpires: undefined
        } 
      },
      { ...state, loading: false, editing: remainingEditing }
    );
  }),
  on(TasksActions.finishEditFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Delete Task
  on(TasksActions.deleteTask, state => ({
    ...state,
    loading: true
  })),
  on(TasksActions.deleteTaskSuccess, (state, { taskId }) => {
    const { [taskId]: removed, ...remainingEditing } = state.editing;
    return adapter.removeOne(taskId, { 
      ...state, 
      loading: false,
      editing: remainingEditing
    });
  }),
  on(TasksActions.deleteTaskFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Toggle Completion
  on(TasksActions.toggleCompletion, (state, { taskId, complete }) => 
    adapter.updateOne(
      { id: taskId, changes: { complete } },
      { ...state, loading: true }
    )
  ),
  on(TasksActions.toggleCompletionSuccess, state => ({
    ...state,
    loading: false
  })),
  on(TasksActions.toggleCompletionFailure, (state, { taskId, error }) => {
    const task = state.entities[taskId];
    if (!task) return { ...state, loading: false, error };

    return adapter.updateOne(
      { id: taskId, changes: { complete: !task.complete } },
      { ...state, loading: false, error }
    );
  }),

  // WebSocket Events
  on(TasksActions.wsTaskCreated, (state, { task }) => 
    adapter.addOne(task, { ...state })
  ),
  on(TasksActions.wsTaskDeleted, (state, { taskId }) => 
    adapter.removeOne(taskId, { ...state })
  ),
  on(TasksActions.wsTaskRenamed, (state, { taskId, changes }) => 
    adapter.updateOne({ id: taskId, changes }, { ...state })
  ),
  on(TasksActions.wsTaskComplete, (state, { taskId }) => 
    adapter.updateOne({ id: taskId, changes: { complete: true } }, { ...state })
  ),
  on(TasksActions.wsTaskIncomplete, (state, { taskId }) => 
    adapter.updateOne({ id: taskId, changes: { complete: false } }, { ...state })
  ),

);

// Export the entity adapter selectors
export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal
} = adapter.getSelectors();
