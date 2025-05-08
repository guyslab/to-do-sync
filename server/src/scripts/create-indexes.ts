import { MongoClient } from "mongodb";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function createIndexes() {
  console.log("Starting index creation...");
  
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
  const dbName = process.env.MONGODB_DB_NAME || "todos";
  
  console.log(`Connecting to MongoDB at ${uri}, database: ${dbName}`);
  
  try {
    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);
    
    // Tasks collection indexes
    const tasksCollection = db.collection("tasks");
    
    // Create indexes directly without checking if they exist
    await tasksCollection.createIndex({ id: 1 }, { unique: true });
    console.log("Created index on 'id' field");
    
    await tasksCollection.createIndex({ isDeleted: 1 });
    console.log("Created index on 'isDeleted' field");
    
    console.log("Task collection indexes created successfully");
    
    // Add any other collection indexes here
    
    await client.close();
    console.log("Database connection closed");
    console.log("Index creation completed successfully");
  } catch (error) {
    console.error("Error creating indexes:", error);
    process.exit(1);
  }
}

// Execute the function
createIndexes().then(() => {
  process.exit(0);
});
