import { ActionReducerMap } from '@ngrx/store';
import * as fromTasks from './tasks/tasks.reducer';

export interface AppState {
  tasks: fromTasks.State;
}

export const reducers: ActionReducerMap<AppState> = {
  tasks: fromTasks.reducer
};
