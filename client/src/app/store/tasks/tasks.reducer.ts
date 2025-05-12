import { createReducer, on } from '@ngrx/store';
import { Task, EditionLock } from '../../core/models/task.model';
import * as TasksActions from './tasks.actions';

export interface State {
  entities: { [id: string]: Task };
  ids: string[];
  loading: boolean;
  error: string | null;
  editing: { [taskId: string]: EditionLock };
}

export const initialState: State = {
  entities: {},
  ids: [],
  loading: false,
  error: null,
  editing: {}
};

export const reducer = createReducer(
  initialState,

  // Load Tasks
  on(TasksActions.loadTasks, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(TasksActions.loadTasksSuccess, (state, { tasks }) => {
    const entities = tasks.reduce((acc, task) => {
      acc[task.id] = task;
      return acc;
    }, {} as { [id: string]: Task });
    
    return {
      ...state,
      entities,
      ids: tasks.map(task => task.id),
      loading: false
    };
  }),
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
  on(TasksActions.addTaskSuccess, (state, { task }) => {
    return {
      ...state,
      entities: {
        ...state.entities,
        [task.id]: task
      },
      ids: [...state.ids, task.id],
      loading: false
    };
  }),
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

    return {
      ...state,
      entities: {
        ...state.entities,
        [taskId]: updatedTask
      },
      editing: { 
        ...state.editing,
        [taskId]: { taskId, editionId, expiresAt: expires }
      },
      loading: false
    };
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
    
    const updatedTask = {
      ...task,
      isLocked: false,
      editionId: undefined,
      editionExpires: undefined
    };

    return {
      ...state,
      entities: {
        ...state.entities,
        [task.id]: updatedTask
      },
      editing: remainingEditing,
      loading: false
    };
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
    const { [taskId]: removedTask, ...remainingEntities } = state.entities;
    const { [taskId]: removedEditing, ...remainingEditing } = state.editing;
    
    return {
      ...state,
      entities: remainingEntities,
      ids: state.ids.filter(id => id !== taskId),
      editing: remainingEditing,
      loading: false
    };
  }),
  on(TasksActions.deleteTaskFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Toggle Completion
  on(TasksActions.toggleCompletion, (state, { taskId, complete }) => {
    const task = state.entities[taskId];
    if (!task) return state;

    return {
      ...state,
      entities: {
        ...state.entities,
        [taskId]: {
          ...task,
          complete
        }
      },
      loading: true
    };
  }),
  on(TasksActions.toggleCompletionSuccess, state => ({
    ...state,
    loading: false
  })),
  on(TasksActions.toggleCompletionFailure, (state, { taskId, error }) => {
    const task = state.entities[taskId];
    if (!task) return { ...state, loading: false, error };

    return {
      ...state,
      entities: {
        ...state.entities,
        [taskId]: {
          ...task,
          complete: !task.complete
        }
      },
      loading: false,
      error
    };
  }),

  // WebSocket Events
  on(TasksActions.wsTaskCreated, (state, { task }) => {
    return {
      ...state,
      entities: {
        ...state.entities,
        [task.id]: task
      },
      ids: [...state.ids, task.id]
    };
  }),
  on(TasksActions.wsTaskDeleted, (state, { taskId }) => {
    const { [taskId]: removedTask, ...remainingEntities } = state.entities;
    
    return {
      ...state,
      entities: remainingEntities,
      ids: state.ids.filter(id => id !== taskId)
    };
  }),
  on(TasksActions.wsTaskRenamed, (state, { taskId, changes }) => {
    const task = state.entities[taskId];
    if (!task) return state;

    return {
      ...state,
      entities: {
        ...state.entities,
        [taskId]: {
          ...task,
          ...changes
        }
      }
    };
  }),
  on(TasksActions.wsTaskComplete, (state, { taskId }) => {
    const task = state.entities[taskId];
    if (!task) return state;

    return {
      ...state,
      entities: {
        ...state.entities,
        [taskId]: {
          ...task,
          complete: true
        }
      }
    };
  }),
  on(TasksActions.wsTaskIncomplete, (state, { taskId }) => {
    const task = state.entities[taskId];
    if (!task) return state;

    return {
      ...state,
      entities: {
        ...state.entities,
        [taskId]: {
          ...task,
          complete: false
        }
      }
    };
  }),
);

export const selectIds = (state: State) => state.ids;
export const selectEntities = (state: State) => state.entities;
export const selectAll = (state: State) => state.ids.map(id => state.entities[id]);
export const selectTotal = (state: State) => state.ids.length;
