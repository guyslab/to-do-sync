import { environment } from '../../../environments/environment';

export const API_BASE_URL = environment.apiUrl;
export const WS_URL = environment.wsUrl;

export const API_ENDPOINTS = {
  TASKS: `${API_BASE_URL}/tasks`,
  TASK_BY_ID: (id: string) => `${API_BASE_URL}/tasks/${id}`,
  TASK_COMPLETION: (id: string) => `${API_BASE_URL}/tasks/${id}/completion`,
  TASK_EDITIONS: (id: string) => `${API_BASE_URL}/tasks/${id}/editions`,
  TASK_EDITION_BY_ID: (taskId: string, editionId: string) => `${API_BASE_URL}/tasks/${taskId}/editions/${editionId}`
};
