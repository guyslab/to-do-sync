import { ObjectId } from "mongodb";
import MongoConnection from "./mongo";
import { TaskData } from "../domain/data/task.data";

export class TaskDAO {
  private async coll() {
    const conn = await MongoConnection.getInstance();
    return conn.collection("tasks");
  }

  async upsert(task: TaskData) {
    const collection = await this.coll();
    if (!task._id) {
      const { insertedId } = await collection.insertOne(task);
      task._id = insertedId.toString();
    } else {
      await collection.updateOne({ _id: new ObjectId(task._id) }, { $set: task });
    }
  }

  async findById(id: string): Promise<TaskData | null> {
    const collection = await this.coll();
    return await collection.findOne({ _id: new ObjectId(id), isDeleted: false });
  }

  async query(includeComplete: boolean, page: number, size = 20) {
    const collection = await this.coll();
    const filter: any = { isDeleted: false };
    if (!includeComplete) filter.complete = false;
    const cursor = collection.find(filter).skip((page - 1) * size).limit(size);
    const tasks = await cursor.toArray();
    const total = await collection.countDocuments(filter);
    return { tasks, total };
  }
}
