import { DefaultTaskServiceFactory } from '../domain/services/task-service-factory';
import { DefaultDataCollectionModifier } from '../infrastructure/database/data-collection-modifier';
import { DefaultDataCollectionQuerier } from '../infrastructure/database/data-collection-querier';
import { DefaultDataTransaction } from '../infrastructure/database/data-transaction';
import { DefaultMessagesOutbox } from '../infrastructure/messaging/messages-outbox';
import { DefaultMessagesPublisher } from '../infrastructure/messaging/messages-publisher';
import { DefaultUnitOfWork } from '../infrastructure/unit-of-work';
import { TaskService } from '../domain/interfaces/service.interface';

// Mock database for testing
class MockDatabase {
  private collections: Map<string, any[]> = new Map();

  collection(name: string) {
    if (!this.collections.has(name)) {
      this.collections.set(name, []);
    }

    return {
      find: (query: any) => {
        return {
          toArray: async () => {
            const collection = this.collections.get(name) || [];
            return collection.filter(item => {
              for (const key in query) {
                if (query[key] !== item[key]) {
                  return false;
                }
              }
              return true;
            });
          }
        };
      },
      updateOne: async (filter: any, update: any, options: any) => {
        const collection = this.collections.get(name) || [];
        const index = collection.findIndex(item => item.id === filter.id);
        
        if (index >= 0) {
          // Update existing item
          collection[index] = { ...collection[index], ...update.$set };
        } else if (options.upsert) {
          // Insert new item
          collection.push({ ...filter, ...update.$set });
        }
        
        this.collections.set(name, collection);
        return { acknowledged: true };
      }
    };
  }
}

// Mock WebSocket server for testing
class MockWebSocketServer {
  async emit(event: string, data: any) {
    // Just for testing, we don't need to actually emit events
    return;
  }
}

describe('Task Locking Workflow', () => {
  let taskService: TaskService;
  let taskId: string;
  
  beforeEach(async () => {
    // Setup dependencies
    const db = new MockDatabase();
    const dataModifier = new DefaultDataCollectionModifier();
    (dataModifier as any)._db = db; // Inject mock database
    
    const dataQuerier = new DefaultDataCollectionQuerier();
    (dataQuerier as any)._db = db; // Inject mock database
    
    const dataTx = new DefaultDataTransaction(dataModifier);
    const wsServer = new MockWebSocketServer();
    const publisher = new DefaultMessagesPublisher(wsServer as any);
    const outbox = new DefaultMessagesOutbox(publisher);
    const unitOfWork = new DefaultUnitOfWork(dataTx, outbox);
    
    // Create task service using factory
    const taskServiceFactory = new DefaultTaskServiceFactory(dataTx, outbox, unitOfWork);
    taskService = taskServiceFactory.createTaskService();
    
    // Create a test task
    taskId = await taskService.create('Test Task');
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
