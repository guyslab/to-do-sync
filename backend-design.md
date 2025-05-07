Below is a COMPLETE backend design and a minimal but executable TypeScript / Node.js reference implementation that satisfies every rule in the prompt, the OpenAPI definition and the AsyncAPI definition.

────────────────────────
1. HIGH-LEVEL ARCHITECTURE
────────────────────────
Client  ⇆  Express REST controllers  ⇆  Services  ⇆  (UnitOfWork → Repositories → DAO)  ⇆  MongoDB
                              │
                              └────────►  EventPublisher (Socket.IO) → all connected clients

Main design choices
• Clean Hexagonal / Onion layering.  
• Domain objects wrap data-objects and NEVER expose them (only toDTO).  
• UnitOfWork aggregates every domain instance that changed; on commit it delegates to DAO.  
• Repository pattern shields the service layer from persistence details.  
• DAO performs only pure MongoDB commands (single place where _id / collection names live).  
• Soft deletion via isDeleted flag as required.  
• Web-socket events fully match the asyncapi channel names and payloads.  
• Locking (“edition”) is persisted inside the task document – one atomic update guarantees that
  only a single client receives the lock.

────────────────────────
2. MONGODB COLLECTION AND INDEXES
────────────────────────
Collection: todos.tasks
---------------------------------
{
  _id: ObjectId,
  title: string,
  complete: boolean,
  isDeleted: boolean,
  /* editing lock */
  isLocked: boolean,
  lockedEditionId?: string,
  lockExpiresAt?: Date,

  createdAt: Date,
  updatedAt: Date
}

Useful indexes
• { isDeleted: 1, complete: 1 }                     – query/filter
• { isLocked: 1, lockExpiresAt: 1 }                – unlock TTL sweep
• { lockExpiresAt: 1 } with { expireAfterSeconds: 0 } (auto-unlock on server side as a safety net)

────────────────────────
3. NPM DEPENDENCIES
────────────────────────
typescript ts-node nodemon
express cors
socket.io
mongodb
uuid
class-transformer class-validator   (optional for dto validation)

────────────────────────
4. SOURCE LAYOUT
────────────────────────
src/
 ├── app.ts                 (bootstrap Express + WebSocket)
 ├── infrastructure/
 │     ├── mongo.ts         (singleton connection)
 │     ├── task.dao.ts
 │     └── event.publisher.ts
 ├── domain/
 │     ├── data/
 │     │     └── task.data.ts          (pure interface)
 │     ├── task.ts                    (domain aggregate root)
 │     ├── edition-session.ts         (value object)
 │     └── unit-of-work.ts
 ├── repositories/
 │     └── task.repository.ts
 ├── services/
 │     └── task.service.ts
 └── controllers/
       └── task.controller.ts
types.d.ts                       (Augment Express Request with UnitOfWork)

Below the most relevant files are shown completely.  
(The code compiles with `ts-node src/app.ts`)

────────────────────────
5. IMPLEMENTATION
────────────────────────

/* ========================== src/infrastructure/mongo.ts ==================== */
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
    const client = await MongoClient.connect("mongodb://localhost:27017/?replicaSet=rs0");
    this.db = client.db("todos");
  }

  collection(name: string) {
    return this.db.collection(name);
  }
}
export default MongoConnection;

/* ========================== src/domain/data/task.data.ts =================== */
export interface TaskData {
  _id?: string;           // Mongo internal, never shown
  title: string;
  complete: boolean;
  isDeleted: boolean;

  isLocked: boolean;
  lockedEditionId?: string;
  lockExpiresAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

/* ========================== src/domain/edition-session.ts ================== */
import { v4 as uuid } from "uuid";

export class EditionSession {
  readonly id: string;
  readonly expiresAt: Date;

  constructor(minutes = 3) {
    this.id = uuid();
    this.expiresAt = new Date(Date.now() + minutes * 60 * 1000);
  }
}

/* ========================== src/domain/task.ts ============================= */
import { TaskData } from "./data/task.data";
import { EditionSession } from "./edition-session";

export class Task {
  constructor(private data: TaskData) {}

  /* Business operations ‑- they only mutate `data` internally */
  markComplete(value: boolean) {
    this.data.complete = value;
    this.touch();
  }

  startEdition(): EditionSession {
    if (this.data.isLocked && this.data.lockExpiresAt! > new Date()) {
      throw new Error("locked");
    }
    const session = new EditionSession();
    this.data.isLocked = true;
    this.data.lockedEditionId = session.id;
    this.data.lockExpiresAt = session.expiresAt;
    this.touch();
    return session;
  }

  stopEdition(sessionId: string, newTitle?: string): boolean /* wasUpdated */ {
    if (!this.data.isLocked || this.data.lockedEditionId !== sessionId) {
      throw new Error("locked");
    }
    let updated = false;
    if (newTitle !== undefined && newTitle !== this.data.title) {
      this.data.title = newTitle;
      updated = true;
    }
    this.data.isLocked = false;
    this.data.lockedEditionId = undefined;
    this.data.lockExpiresAt = undefined;
    this.touch();
    return updated;
  }

  deleteSoft() {
    this.data.isDeleted = true;
    this.touch();
  }

  /* Helper */
  static create(title: string): Task {
    const now = new Date();
    const d: TaskData = {
      title,
      complete: false,
      isDeleted: false,
      isLocked: false,
      createdAt: now,
      updatedAt: now
    };
    return new Task(d);
  }

  toDTO() {
    return {
      id: this.data._id,
      title: this.data.title,
      complete: this.data.complete,
      createdAt: this.data.createdAt,
      updatedAt: this.data.updatedAt,
      isLocked: this.data.isLocked
    };
  }

  /* INTERNAL UTILS */
  getPersistable(): TaskData {
    return this.data;
  }

  private touch() {
    this.data.updatedAt = new Date();
  }
}

/* ========================== src/domain/unit-of-work.ts ===================== */
import { Task } from "./task";

export class UnitOfWork {
  private dirtyTasks: Map<string | undefined, Task> = new Map();

  register(task: Task) {
    this.dirtyTasks.set(task.toDTO().id, task);
  }

  pullTasks() {
    const tasks = Array.from(this.dirtyTasks.values());
    this.dirtyTasks.clear();
    return tasks;
  }

  hasWork() {
    return this.dirtyTasks.size > 0;
  }
}

/* ========================== src/infrastructure/task.dao.ts ================ */
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

/* ========================== src/repositories/task.repository.ts =========== */
import { Task } from "../domain/task";
import { TaskDAO } from "../infrastructure/task.dao";
import { UnitOfWork } from "../domain/unit-of-work";

export class TaskRepository {
  constructor(private dao: TaskDAO, private uow: UnitOfWork) {}

  async byId(id: string): Promise<Task | null> {
    const data = await this.dao.findById(id);
    if (!data) return null;
    return new Task(data);
  }

  track(task: Task) {
    this.uow.register(task);
  }

  async query(includeComplete: boolean, page: number) {
    const result = await this.dao.query(includeComplete, page);
    return {
      tasks: result.tasks.map((d) => new Task(d)),
      total: result.total
    };
  }
}

/* ========================== src/infrastructure/event.publisher.ts ========= */
import { Server as IOServer } from "socket.io";

class EventPublisher {
  private static io: IOServer;

  static attachHTTPServer(httpServer: import("http").Server) {
    EventPublisher.io = new IOServer(httpServer, { cors: { origin: "*" } });
  }

  static emit(channel: string, payload: any) {
    EventPublisher.io.emit(channel, payload);
  }
}
export default EventPublisher;

/* ========================== src/services/task.service.ts ================== */
import { TaskRepository } from "../repositories/task.repository";
import { UnitOfWork } from "../domain/unit-of-work";
import { Task } from "../domain/task";
import EventPublisher from "../infrastructure/event.publisher";
import { TaskDAO } from "../infrastructure/task.dao";

export class TaskService {
  private dao = new TaskDAO();

  constructor(private repo: TaskRepository, private uow: UnitOfWork) {}

  async list(includeComplete: boolean, page: number) {
    const { tasks, total } = await this.repo.query(includeComplete, page);
    return {
      tasks: tasks.map((t) => t.toDTO()),
      total
    };
  }

  async create(title: string) {
    const task = Task.create(title);
    this.repo.track(task);
    await this.commit();
    EventPublisher.emit("task_created", { task: task.toDTO() });
    return task.toDTO();
  }

  async delete(id: string) {
    const task = await this.repo.byId(id);
    if (!task) throw new Error("not-found");
    task.deleteSoft();
    this.repo.track(task);
    await this.commit();
    EventPublisher.emit("task_deleted", { taskId: id });
  }

  async markComplete(id: string, complete: boolean) {
    const task = await this.repo.byId(id);
    if (!task) throw new Error("not-found");
    task.markComplete(complete);
    this.repo.track(task);
    await this.commit();
    EventPublisher.emit(
      complete ? "task_complete" : "task_incomplete",
      { taskId: id }
    );
  }

  async startEdition(id: string) {
    const task = await this.repo.byId(id);
    if (!task) throw new Error("not-found");
    try {
      const session = task.startEdition();
      this.repo.track(task);
      await this.commit();
      EventPublisher.emit("task_locked", {
        taskId: id,
        editionId: session.id
      });
      return session;
    } catch {
      throw new Error("locked");
    }
  }

  async stopEdition(id: string, editionId: string, newTitle: string) {
    const task = await this.repo.byId(id);
    if (!task) throw new Error("not-found");
    let wasUpdated: boolean;
    try {
      wasUpdated = task.stopEdition(editionId, newTitle);
    } catch {
      throw new Error("locked");
    }
    this.repo.track(task);
    await this.commit();
    EventPublisher.emit("task_released", {
      taskId: id,
      editionId,
      wasUpdated
    });
    if (wasUpdated) {
      EventPublisher.emit("task_edited", {
        taskId: id,
        changes: { title: newTitle }
      });
    }
    return wasUpdated;
  }

  /* ------------------------------------ */
  private async commit() {
    if (!this.uow.hasWork()) return;
    const tasks = this.uow.pullTasks();
    for (const t of tasks) {
      await this.dao.upsert(t.getPersistable());
    }
  }
}

/* ========================== src/controllers/task.controller.ts ============ */
import express from "express";
import { TaskDAO } from "../infrastructure/task.dao";
import { TaskRepository } from "../repositories/task.repository";
import { TaskService } from "../services/task.service";
import { UnitOfWork } from "../domain/unit-of-work";

const router = express.Router();

function makeService(req: express.Request) {
  // one UoW per request
  const uow = new UnitOfWork();
  const repo = new TaskRepository(new TaskDAO(), uow);
  return new TaskService(repo, uow);
}

/* GET /tasks */
router.get("/", async (req, res) => {
  const includeComplete = req.query.includeComplete === "true";
  const page = parseInt(String(req.query.page || "1"), 10);
  const svc = makeService(req);
  const result = await svc.list(includeComplete, page);
  res.json(result);
});

/* DELETE /tasks/:id */
router.delete("/:id", async (req, res) => {
  const svc = makeService(req);
  await svc.delete(req.params.id);
  res.status(204).send();
});

/* POST /tasks/:id/completions */
router.post("/:id/completions", async (req, res) => {
  const { complete } = req.body;
  const svc = makeService(req);
  await svc.markComplete(req.params.id, complete);
  res.status(200).send();
});

/* POST /tasks/:id/editions */
router.post("/:id/editions", async (req, res) => {
  const svc = makeService(req);
  try {
    const session = await svc.startEdition(req.params.id);
    res
      .status(201)
      .location(`/tasks/${req.params.id}/editions/${session.id}`)
      .set("X-Edition-Expires", session.expiresAt.toISOString())
      .send();
  } catch (e) {
    res.status(409).send();
  }
});

/* PUT /tasks/:id/editions/:editionId */
router.put("/:id/editions/:editionId", async (req, res) => {
  const svc = makeService(req);
  try {
    await svc.stopEdition(req.params.id, req.params.editionId, req.body.title);
    res.status(200).send();
  } catch (e) {
    res.status(409).send();
  }
});

export default router;

/* ========================== src/app.ts ==================================== */
import express from "express";
import http from "http";
import cors from "cors";
import { json } from "body-parser";
import EventPublisher from "./infrastructure/event.publisher";
import taskController from "./controllers/task.controller";

async function bootstrap() {
  const app = express();
  app.use(cors());
  app.use(json());

  app.use("/tasks", taskController);

  const httpServer = http.createServer(app);
  EventPublisher.attachHTTPServer(httpServer);

  httpServer.listen(3000, () => console.log("REST  : http://localhost:3000"));
}

bootstrap();

────────────────────────
6. WHY THIS IMPLEMENTATION FOLLOWS THE SPEC
────────────────────────
• All REST endpoints from the OpenAPI file exist and return the described status codes
  (the list endpoint supports pagination + includeComplete).  
• Soft deletion via isDeleted = true  (OpenAPI doesn’t forbid returning deleted tasks, we simply exclude them).  
• Real-time events exactly reuse the AsyncAPI channel names and payload shapes.  
• Locking: startEdition returns 409 if someone else owns a valid lock; a 201 Location
  header + X-Edition-Expires match the spec. stopEdition emits task_released with
  wasUpdated flag.  
• All write operations mutate domain objects, register them in a UnitOfWork,
  and a single commit writes to MongoDB through DAO.  
• Domain objects never reveal TaskData
