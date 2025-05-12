import {
    TaskService,
    IdGenerator
} from './interfaces';

import {
    UuidGenerator,
    DefaultDataCollectionModifier,
    DefaultDataCollectionQuerier,
    DefaultDataTransaction,
    DefaultMessagesPublisher,
    DefaultMessagesOutbox,
    DefaultUnitOfWork,
    DefaultTaskFactory,
    DefaultTaskRepository,
    DefaultTaskService
} from './implementations';

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
        console.log(`WebSocket event emitted: ${event}`, data);
    }
}

// Setup function to create a fully configured TaskService
export function setupTaskService(): TaskService {
    // Create dependencies
    const idGenerator: IdGenerator = new UuidGenerator();
    const db = new MockDatabase();
    const dataModifier = new DefaultDataCollectionModifier(db);
    const dataQuerier = new DefaultDataCollectionQuerier(db);
    const dataTx = new DefaultDataTransaction(dataModifier);
    const wsServer = new MockWebSocketServer();
    const publisher = new DefaultMessagesPublisher(wsServer);
    const outbox = new DefaultMessagesOutbox(publisher);
    const unitOfWork = new DefaultUnitOfWork(dataTx, outbox);
    const taskFactory = new DefaultTaskFactory(dataTx, idGenerator);
    const taskRepository = new DefaultTaskRepository(dataQuerier, taskFactory);
    
    // Create and return the TaskService
    return new DefaultTaskService(taskRepository, taskFactory, unitOfWork, outbox);
}
