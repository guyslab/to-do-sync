import { MongoClient, Db } from "mongodb";

class MongoConnection {
  private static instance: MongoConnection;
  private db!: Db;

  private constructor() {}

  static async getInstance(): Promise<MongoConnection> {
    if (!MongoConnection.instance) {
      MongoConnection.instance = new MongoConnection();
      await MongoConnection.instance.init();
    }
    return MongoConnection.instance;
  }

  private async init() {
    const client = await MongoClient.connect("mongodb://localhost:27017");
    this.db = client.db("todos");
  }

  collection(name: string) {
    return this.db.collection(name);
  }
}

export default MongoConnection;
