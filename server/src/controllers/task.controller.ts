import express from "express";
import { TaskDAO } from "../infrastructure/task.dao";
import { TaskRepository } from "../repositories/task.repository";
import { TaskService } from "../services/task.service";
import { UnitOfWork } from "../domain/unit-of-work";

const router = express.Router();

function makeService(req: express.Request) {
  // one UoW per request
  const uow = new UnitOfWork();
  (req as any).unitOfWork = uow;
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

/* POST /tasks */
router.post("/", async (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "Title is required" });
  }
  
  const svc = makeService(req);
  const task = await svc.create(title);
  res.status(201).json(task);
});

/* DELETE /tasks/:id */
router.delete("/:id", async (req, res) => {
  const svc = makeService(req);
  try {
    await svc.delete(req.params.id);
    res.status(204).send();
  } catch (e) {
    if ((e as Error).message === "not-found") {
      res.status(404).json({ error: "Task not found" });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

/* POST /tasks/:id/completions */
router.post("/:id/completions", async (req, res) => {
  const { complete } = req.body;
  if (typeof complete !== "boolean") {
    return res.status(400).json({ error: "Complete status must be a boolean" });
  }
  
  const svc = makeService(req);
  try {
    await svc.markComplete(req.params.id, complete);
    res.status(200).send();
  } catch (e) {
    if ((e as Error).message === "not-found") {
      res.status(404).json({ error: "Task not found" });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
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
    if ((e as Error).message === "locked") {
      res.status(409).json({ error: "Task is already locked" });
    } else if ((e as Error).message === "not-found") {
      res.status(404).json({ error: "Task not found" });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

/* PUT /tasks/:id/editions/:editionId */
router.put("/:id/editions/:editionId", async (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "Title is required" });
  }
  
  const svc = makeService(req);
  try {
    await svc.stopEdition(req.params.id, req.params.editionId, title);
    res.status(200).send();
  } catch (e) {
    if ((e as Error).message === "locked") {
      res.status(409).json({ error: "Invalid edition session" });
    } else if ((e as Error).message === "not-found") {
      res.status(404).json({ error: "Task not found" });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

export default router;
