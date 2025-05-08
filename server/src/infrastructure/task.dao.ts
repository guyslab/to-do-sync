import { Document, ObjectId } from "mongodb";
import MongoConnection from "./mongo";
import { TaskData } from "../domain/data/task.data";

export class TaskDAO {
  private async coll() {
    const conn = await MongoConnection.getInstance();
    return conn.collection("tasks");
  }

  async upsert(task: TaskData) {
    const collection = await this.coll();
    // Create a copy of the task without _id for MongoDB operations
    const taskForDb: any = { ...task };
    
    if (!task._id) {
      // For new tasks, remove the _id property completely
      delete taskForDb._id;
      const { insertedId } = await collection.insertOne(taskForDb);
      task._id = insertedId.toString();
    } else {
      // For existing tasks, use the _id for lookup but don't include it in the update
      const taskId = task._id;
      delete taskForDb._id;
      await collection.updateOne({ _id: new ObjectId(taskId) }, { $set: taskForDb });
    }
  }

  async findById(id: string): Promise<TaskData | null> {
    const collection = await this.coll();
    const result = await collection.findOne({ _id: new ObjectId(id), isDeleted: false });
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
      _id: doc._id.toString(),
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
