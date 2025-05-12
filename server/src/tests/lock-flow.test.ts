import { DefaultTaskServiceFactory } from '../domain/services/task-service-factory';
import { DefaultDataCollectionModifier } from '../infrastructure/database/data-collection-modifier';
import { DefaultDataCollectionQuerier } from '../infrastructure/database/data-collection-querier';
import { DefaultDataTransaction } from '../infrastructure/database/data-transaction';
import { DefaultMessagesOutbox } from '../infrastructure/messaging/messages-outbox';
import { DefaultMessagesPublisher } from '../infrastructure/messaging/messages-publisher';
import { DefaultUnitOfWork } from '../infrastructure/unit-of-work';
import { TaskService } from '../domain/interfaces/service.interface';
import { TaskData } from '../domain/interfaces/task.interface';

// Mock the mongodb module
jest.mock('../infrastructure/database/mongodb', () => {
  // Create a mock database with task data
  const mockTaskData: TaskData = {
    id: 'test-task-id',
    title: 'Test Task',
    complete: false,
    deleted: false,
    createdAt: new Date()
  };

  const mockDb = {
    collection: jest.fn().mockReturnValue({
      find: jest.fn().mockImplementation((query) => {
        // Return the mock task when queried by id
        if (query && query.id === 'test-task-id') {
          return {
            toArray: jest.fn().mockResolvedValue([mockTaskData])
          };
        }
        return {
          toArray: jest.fn().mockResolvedValue([])
        };
      }),
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true })
    })
  };
  
  return {
    getDb: jest.fn(() => mockDb),
    connectToDatabase: jest.fn().mockResolvedValue(mockDb),
    closeDatabaseConnection: jest.fn().mockResolvedValue(undefined)
  };
});

// Mock WebSocket server for testing
class MockWebSocketServer {
  async emit(event: string, data: any) {
    // Just for testing, we don't need to actually emit events
    return;
  }
}

describe('Task Locking Workflow', () => {
  let taskService: TaskService;
  const taskId = 'test-task-id';
  
  beforeEach(async () => {
    // Setup dependencies
    const dataModifier = new DefaultDataCollectionModifier();
    const dataQuerier = new DefaultDataCollectionQuerier();
    
    const dataTx = new DefaultDataTransaction(dataModifier);
    const wsServer = new MockWebSocketServer();
    const publisher = new DefaultMessagesPublisher(wsServer as any);
    const outbox = new DefaultMessagesOutbox(publisher);
    const unitOfWork = new DefaultUnitOfWork(dataTx, outbox);
    
    // Create task service using factory
    const taskServiceFactory = new DefaultTaskServiceFactory(dataTx, outbox, unitOfWork);
    taskService = taskServiceFactory.createTaskService();
  });
  
  test('should successfully complete the locking workflow', async () => {
    // Begin edition and get the key
    const edition1 = await taskService.beginEdition(taskId);
    expect(edition1.key).toBeDefined();
    
    // End edition with the correct key
    await taskService.endEdition(taskId, 'Updated Test Task', edition1.key);
    
    // Begin edition again (should work since lock was released)
    const edition2 = await taskService.beginEdition(taskId);
    expect(edition2.key).toBeDefined();
    expect(edition2.key).not.toEqual(edition1.key);
    
    // End edition with correct key
    await taskService.endEdition(taskId, 'Final Test Task', edition2.key);
  });
  
  test('should fail when using wrong key', async () => {
    // Begin edition
    const edition = await taskService.beginEdition(taskId);
    
    // Try to end edition with wrong key
    const wrongKey = 'wrong-key';
    await expect(
      taskService.endEdition(taskId, 'This should fail', wrongKey)
    ).rejects.toThrow('locked');
    
    // Should succeed with correct key
    await taskService.endEdition(taskId, 'This should work', edition.key);
  });
  
  test('should not allow concurrent editing', async () => {
    // Begin edition
    await taskService.beginEdition(taskId);
    
    // Try to begin another edition while locked
    await expect(
      taskService.beginEdition(taskId)
    ).rejects.toThrow('locked');
  });
});
