import { Request, Response, NextFunction } from 'express';
import { UnitOfWork } from '../domain/unit-of-work';
import { TaskDAO } from '../infrastructure/task.dao';

export const unitOfWorkMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const dao = new TaskDAO();
  const uow = new UnitOfWork(dao);
  
  (req as any).unitOfWork = uow;
  
  try {
    next();
    
    await uow.commit();
  } catch (error) {
    console.error('Error in UnitOfWork middleware:', error);
    throw error;
  }
};
