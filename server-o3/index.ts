// This is a simple test file to demonstrate the integration test

// Import required interfaces and classes
import { IdGenerator } from './interfaces';
import { UuidGenerator } from './implementations';
import { setupTaskService } from './setup';

// Integration test for the locking workflow
async function testLockingWorkflow() {
  console.log("Testing task locking workflow...");
  
  // Setup the task service with all dependencies
  const taskService = setupTaskService();
  
  // Create a new task
  const id = await taskService.create('Write docs');
  console.log(`Created task with ID: ${id}`);
  
  // Begin edition and get the key
  const { key } = await taskService.beginEdition(id);
  console.log(`Began edition with key: ${key}`);
  
  // End edition with the correct key
  await taskService.endEdition(id, 'Write much better docs', key);
  console.log("Successfully ended edition with correct key");
  
  // Begin edition again (should work since lock was released)
  const edition2 = await taskService.beginEdition(id);
  console.log(`Began second edition with key: ${edition2.key}`);
  
  // Try to end edition with wrong key
  const wrongKey = '123';
  try {
    await taskService.endEdition(id, 'oops', wrongKey);
  } catch (e) {
    console.log(`Expected error with wrong key: ${(e as Error).message}`); // "locked"
  }
  
  // End edition with correct key
  await taskService.endEdition(id, 'Final version of docs', edition2.key);
  console.log("Successfully ended second edition with correct key");
  
  console.log("Locking workflow test completed successfully");
}

// Run the test
testLockingWorkflow().catch(console.error);
