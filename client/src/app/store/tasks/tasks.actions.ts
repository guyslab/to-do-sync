import { createAction, props } from '@ngrx/store';
import { Task } from '../../core/models/task.model';

// Load Tasks
export const loadTasks = createAction(
  '[Tasks] Load Tasks',
  props<{ includeComplete?: boolean, page?: number }>()
);

export const loadTasksSuccess = createAction(
  '[Tasks] Load Tasks Success',
  props<{ tasks: Task[] }>()
);

export const loadTasksFailure = createAction(
  '[Tasks] Load Tasks Failure',
  props<{ error: string }>()
);

// Add Task
export const addTask = createAction(
  '[Tasks] Add Task',
  props<{ title: string }>()
);

export const addTaskSuccess = createAction(
  '[Tasks] Add Task Success',
  props<{ task: Task }>()
);

export const addTaskFailure = createAction(
  '[Tasks] Add Task Failure',
  props<{ error: string }>()
);

// Start Edit
export const startEdit = createAction(
  '[Tasks] Start Edit',
  props<{ taskId: string }>()
);

export const startEditSuccess = createAction(
  '[Tasks] Start Edit Success',
  props<{ taskId: string, editionId: string, expires: string }>()
);

export const startEditFailure = createAction(
  '[Tasks] Start Edit Failure',
  props<{ taskId: string, error: string }>()
);

// Finish Edit
export const finishEdit = createAction(
  '[Tasks] Finish Edit',
  props<{ taskId: string, title: string, editionId: string }>()
);

export const finishEditSuccess = createAction(
  '[Tasks] Finish Edit Success',
  props<{ task: Task }>()
);

export const finishEditFailure = createAction(
  '[Tasks] Finish Edit Failure',
  props<{ taskId: string, error: string }>()
);

// Delete Task
export const deleteTask = createAction(
  '[Tasks] Delete Task',
  props<{ taskId: string }>()
);

export const deleteTaskSuccess = createAction(
  '[Tasks] Delete Task Success',
  props<{ taskId: string }>()
);

export const deleteTaskFailure = createAction(
  '[Tasks] Delete Task Failure',
  props<{ taskId: string, error: string }>()
);

// Toggle Completion
export const toggleCompletion = createAction(
  '[Tasks] Toggle Completion',
  props<{ taskId: string, complete: boolean }>()
);

export const toggleCompletionSuccess = createAction(
  '[Tasks] Toggle Completion Success',
  props<{ taskId: string, complete: boolean }>()
);

export const toggleCompletionFailure = createAction(
  '[Tasks] Toggle Completion Failure',
  props<{ taskId: string, error: string }>()
);

// WebSocket Events
export const wsTaskCreated = createAction(
  '[WebSocket] Task Created',
  props<{ task: Task }>()
);

export const wsTaskDeleted = createAction(
  '[WebSocket] Task Deleted',
  props<{ taskId: string }>()
);

export const wsTaskEdited = createAction(
  '[WebSocket] Task Edited',
  props<{ taskId: string, changes: Partial<Task> }>()
);

export const wsTaskComplete = createAction(
  '[WebSocket] Task Complete',
  props<{ taskId: string }>()
);

export const wsTaskIncomplete = createAction(
  '[WebSocket] Task Incomplete',
  props<{ taskId: string }>()
);

export const wsTaskLocked = createAction(
  '[WebSocket] Task Locked',
  props<{ taskId: string, editionId: string }>()
);

export const wsTaskReleased = createAction(
  '[WebSocket] Task Released',
  props<{ taskId: string, editionId: string, wasUpdated: boolean }>()
);
