import { Request, Response, NextFunction } from 'express';
import { UnitOfWork } from '../domain/unit-of-work';
import { TaskDAO } from '../infrastructure/task.dao';

export const unitOfWorkMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Create a new UnitOfWork instance for each request
  const dao = new TaskDAO();
  const uow = new UnitOfWork(dao);
  
  // Attach the UnitOfWork to the request object
  (req as any).unitOfWork = uow;
  
  // Store the original end method
  const originalEnd = res.end;
  
  // Override the end method to commit the UnitOfWork before ending the response
  res.end = function(chunk?: any, encoding?: BufferEncoding, callback?: () => void): Response {
    // Commit the UnitOfWork
    uow.commit()
      .then(() => {
        // Call the original end method after committing
        originalEnd.call(res, chunk, encoding, callback);
      })
      .catch((error) => {
        console.error('Error committing UnitOfWork:', error);
        // If there was an error during commit, we still need to end the response
        originalEnd.call(res, chunk, encoding, callback);
      });
    
    // Return this for chaining
    return res;
  };
  
  next();
};
