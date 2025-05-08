import { Document } from "mongodb";
import MongoConnection from "./mongo";
import { TaskData } from "../domain/data/task.data";

export class TaskDAO {
  private async coll() {
    const conn = await MongoConnection.getInstance();
    return conn.collection("tasks");
  }

  async upsert(task: TaskData) {
    const collection = await this.coll();
    
    // Check if task already exists by logical id
    const existingTask = await collection.findOne({ id: task.id });
    
    if (!existingTask) {
      // For new tasks, insert with the logical id
      await collection.insertOne(task);
    } else {
      // For existing tasks, use the logical id for lookup
      await collection.updateOne({ id: task.id }, { $set: task });
    }
  }

  async findById(id: string): Promise<TaskData | null> {
    const collection = await this.coll();
    const result = await collection.findOne({ id: id, isDeleted: false });
    if (!result) return null;
    
    // Convert MongoDB document to TaskData
    return this.documentToTaskData(result);
  }

  async query(includeComplete: boolean, page: number, size = 20) {
    const collection = await this.coll();
    const filter: any = { isDeleted: false };
    if (!includeComplete) filter.complete = false;
    const cursor = collection.find(filter).skip((page - 1) * size).limit(size);
    const documents = await cursor.toArray();
    const tasks = documents.map(doc => this.documentToTaskData(doc));
    const total = await collection.countDocuments(filter);
    return { tasks, total };
  }
  
  // Helper method to convert MongoDB document to TaskData
  private documentToTaskData(doc: Document): TaskData {
    const taskData: TaskData = {
      id: doc.id,
      title: doc.title,
      complete: doc.complete,
      isDeleted: doc.isDeleted,
      isLocked: doc.isLocked,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
    
    if (doc.lockedEditionId) taskData.lockedEditionId = doc.lockedEditionId;
    if (doc.lockExpiresAt) taskData.lockExpiresAt = doc.lockExpiresAt;
    
    return taskData;
  }
}
