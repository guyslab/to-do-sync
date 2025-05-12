import { TaskServiceFactory } from '../interfaces/factory.interface';
import { TaskService } from '../interfaces/service.interface';
import { DataTransaction, MessagesOutbox, UnitOfWork, DataCollectionQuerier, IdGenerator } from '../interfaces/infrastructure.interface';
import { DefaultTaskService } from './task.service';
import { DefaultTaskRepository } from '../models/task-repository';
import { DefaultTaskFactory } from '../models/task-factory';
import { DefaultDataCollectionQuerier } from '../../infrastructure/database/data-collection-querier';
import { UuidGenerator } from '../../infrastructure/utils/id-generator';

export class DefaultTaskServiceFactory implements TaskServiceFactory {
  constructor(
    private dataTransaction: DataTransaction,
    private messagesOutbox: MessagesOutbox,
    private unitOfWork: UnitOfWork
  ) {}

  createTaskService(): TaskService {
    // Create dependencies
    const dataQuerier: DataCollectionQuerier = new DefaultDataCollectionQuerier();
    const idGenerator: IdGenerator = new UuidGenerator();
    
    // Create task factory
    const taskFactory = new DefaultTaskFactory(this.dataTransaction, idGenerator);
    
    // Create task repository
    const taskRepository = new DefaultTaskRepository(dataQuerier, taskFactory);
    
    // Create and return task service
    return new DefaultTaskService(
      taskRepository,
      taskFactory,
      this.unitOfWork,
      this.messagesOutbox
    );
  }
}
