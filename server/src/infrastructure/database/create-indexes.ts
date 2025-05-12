import { connectToDatabase, closeDatabaseConnection } from './mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function createIndexes() {
  try {
    const db = await connectToDatabase();
    
    console.log('Creating indexes...');
    
    // Create index on deleted field
    await db.collection('task').createIndex({ deleted: 1 });
    console.log('Created index on { deleted: 1 }');
    
    // Create composite index on deleted and complete fields
    await db.collection('task').createIndex({ deleted: 1, complete: 1 });
    console.log('Created composite index on { deleted: 1, complete: 1 }');
    
    // Create composite index on deleted and id fields
    await db.collection('task').createIndex({ deleted: 1, id: 1 });
    console.log('Created composite index on { deleted: 1, id: 1 }');
    
    console.log('All indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  } finally {
    await closeDatabaseConnection();
  }
}

// Run the function
createIndexes();
