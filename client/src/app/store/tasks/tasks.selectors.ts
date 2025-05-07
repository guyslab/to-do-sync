import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromTasks from './tasks.reducer';
import { State } from './tasks.reducer';

export const selectTasksState = createFeatureSelector<State>('tasks');

export const selectAllTasks = createSelector(
  selectTasksState,
  fromTasks.selectAll
);

export const selectTaskEntities = createSelector(
  selectTasksState,
  fromTasks.selectEntities
);

export const selectTasksLoading = createSelector(
  selectTasksState,
  state => state.loading
);

export const selectTasksError = createSelector(
  selectTasksState,
  state => state.error
);

export const selectIsEditing = (taskId: string) => createSelector(
  selectTasksState,
  state => !!state.editing[taskId]
);

export const selectTaskById = (id: string) => createSelector(
  selectTaskEntities,
  entities => entities[id]
);
