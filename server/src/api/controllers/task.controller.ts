import { Request, Response } from 'express';

export class TaskController {
  async getAllTasks(req: Request, res: Response): Promise<void> {
    try {
      const includeComplete = req.query.includeComplete === 'true';
      
      // Create service using factory from request context
      const taskService = req.taskServiceFactory.createTaskService();
      
      const tasks = await taskService.getAll(includeComplete);
      res.json({ tasks, total: tasks.length });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async createTask(req: Request, res: Response): Promise<void> {
    try {
      const { title } = req.body;
      
      if (!title || typeof title !== 'string') {
        res.status(400).json({ error: 'Title is required' });
        return;
      }
      
      // Create service using factory from request context
      const taskService = req.taskServiceFactory.createTaskService();
      
      const id = await taskService.create(title);
      res.status(201).json({ id });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async updateTaskCompletion(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;
      const { complete } = req.body;
      
      if (typeof complete !== 'boolean') {
        res.status(400).json({ error: 'Complete status must be a boolean' });
        return;
      }
      
      // Create service using factory from request context
      const taskService = req.taskServiceFactory.createTaskService();
      
      if (complete) {
        await taskService.complete(taskId);
      } else {
        await taskService.incomplete(taskId);
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      if ((error as Error).message === 'notFound') {
        res.status(404).json({ error: 'Task not found' });
      } else {
        res.status(500).json({ error: (error as Error).message });
      }
    }
  }

  async beginTaskEdition(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;
      
      // Create service using factory from request context
      const taskService = req.taskServiceFactory.createTaskService();
      
      const key = await taskService.beginEdition(taskId);
      
      res.status(201)
        .location(`/api/tasks/${taskId}/editions/${key.key}`)
        .json({ editionId: key.key, expires: key.expiresAt });
    } catch (error) {
      if ((error as Error).message === 'notFound') {
        res.status(404).json({ error: 'Task not found' });
      } else if ((error as Error).message === 'locked') {
        res.status(409).json({ error: 'Task is already being edited' });
      } else {
        res.status(500).json({ error: (error as Error).message });
      }
    }
  }

  async endTaskEdition(req: Request, res: Response): Promise<void> {
    try {
      const { taskId, editionId } = req.params;
      const { title } = req.body;
      
      if (!title || typeof title !== 'string') {
        res.status(400).json({ error: 'Title is required' });
        return;
      }
      
      // Create service using factory from request context
      const taskService = req.taskServiceFactory.createTaskService();
      
      await taskService.endEdition(taskId, title, editionId);
      
      res.status(200).json({ success: true });
    } catch (error) {
      if ((error as Error).message === 'notFound') {
        res.status(404).json({ error: 'Task not found' });
      } else if ((error as Error).message === 'locked') {
        res.status(409).json({ error: 'Invalid edition key' });
      } else {
        res.status(500).json({ error: (error as Error).message });
      }
    }
  }

  async deleteTask(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;
      
      // Create service using factory from request context
      const taskService = req.taskServiceFactory.createTaskService();
      
      await taskService.delete(taskId);
      
      res.status(204).send();
    } catch (error) {
      if ((error as Error).message === 'notFound') {
        res.status(404).json({ error: 'Task not found' });
      } else if ((error as Error).message === 'locked') {
        res.status(409).json({ error: 'Task is being edited and cannot be deleted' });
      } else {
        res.status(500).json({ error: (error as Error).message });
      }
    }
  }
}
