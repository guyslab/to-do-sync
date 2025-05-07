export interface TaskData {
  _id?: string;           // Mongo internal, never shown
  title: string;
  complete: boolean;
  isDeleted: boolean;

  isLocked: boolean;
  lockedEditionId?: string;
  lockExpiresAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
