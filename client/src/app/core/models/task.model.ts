export interface Task {
  id: string;
  title: string;
  complete: boolean;
  createdAt: string;
  updatedAt?: string;
  isLocked?: boolean;
  // client-side extra helpers
  editionId?: string;       // set only for the local user
  editionExpires?: string;  // ISO string
}

export interface EditionLock {
  taskId: string;
  editionId: string;
  expiresAt: string;
}
