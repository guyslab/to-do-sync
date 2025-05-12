import { Request, Response, NextFunction } from 'express';
import { DefaultDataCollectionModifier } from '../../infrastructure/database/data-collection-modifier';
import { DefaultDataTransaction } from '../../infrastructure/database/data-transaction';
import { DefaultMessagesOutbox } from '../../infrastructure/messaging/messages-outbox';
import { DefaultUnitOfWork } from '../../infrastructure/unit-of-work';
import { getDb } from '../../infrastructure/database/mongodb';
import { Server as SocketIOServer } from 'socket.io';
import { DefaultMessagesPublisher } from '../../infrastructure/messaging/messages-publisher';
import { TaskServiceFactory } from '../../domain/interfaces/factory.interface';
import { DefaultTaskServiceFactory } from '../../domain/services/task-service-factory';

// Extend Express Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      taskServiceFactory: TaskServiceFactory;
    }
  }
}

export function createRequestContextMiddleware(io: SocketIOServer) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Create request-scoped instances
      const db = getDb();
      const dataModifier = new DefaultDataCollectionModifier();
      const dataTransaction = new DefaultDataTransaction(dataModifier);
      
      // Create messaging components
      const messagesPublisher = new DefaultMessagesPublisher(io);
      const messagesOutbox = new DefaultMessagesOutbox(messagesPublisher);
      
      // Create unit of work
      const unitOfWork = new DefaultUnitOfWork(dataTransaction, messagesOutbox);
      
      // Create task service factory with dependencies injected
      const taskServiceFactory = new DefaultTaskServiceFactory(
        dataTransaction,
        messagesOutbox,
        unitOfWork
      );
      
      // Attach to request object
      req.taskServiceFactory = taskServiceFactory;
      
      next();
    } catch (error) {
      next(error);
    }
  };
}
