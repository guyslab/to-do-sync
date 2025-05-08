export interface TaskData {
  id: string;
  title: string;
  complete: boolean;
  isDeleted: boolean;

  isLocked: boolean;
  lockedEditionId?: string;
  lockExpiresAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
