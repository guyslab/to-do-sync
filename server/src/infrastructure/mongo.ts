import { MongoClient, Db } from "mongodb";
import config from "../config/config";

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
    const client = await MongoClient.connect(config.database.uri);
    this.db = client.db(config.database.name);
  }

  collection(name: string) {
    return this.db.collection(name);
  }
}

export default MongoConnection;
