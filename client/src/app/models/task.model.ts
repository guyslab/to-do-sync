export interface Task {
  id: string;
  title: string;
  complete: boolean;
  createdAt: string;
}

export interface TasksResponse {
  tasks: Task[];
  total: number;
}

export interface TaskEvent {
  taskId: string;
  title?: string;
}
