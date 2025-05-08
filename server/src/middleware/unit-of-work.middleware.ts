import { Request, Response, NextFunction } from 'express';
import { UnitOfWork } from '../domain/unit-of-work';
import { TaskDAO } from '../infrastructure/task.dao';

export const unitOfWork = async (req: Request, res: Response, next: NextFunction) => {
  const dao = new TaskDAO();
  const uow = new UnitOfWork(dao);
  
  (req as any).unitOfWork = uow;
  next();
};
