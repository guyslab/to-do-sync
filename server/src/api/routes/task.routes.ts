import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';

const router = Router();
const taskController = new TaskController();

// GET /api/tasks - Get all tasks
router.get('/', (req, res) => taskController.getAllTasks(req, res));

// POST /api/tasks - Create a new task
router.post('/', (req, res) => taskController.createTask(req, res));

// PUT /api/tasks/:taskId/completion - Update task completion status
router.put('/:taskId/completion', (req, res) => taskController.updateTaskCompletion(req, res));

// POST /api/tasks/:taskId/editions - Begin editing a task
router.post('/:taskId/editions', (req, res) => taskController.beginTaskEdition(req, res));

// PUT /api/tasks/:taskId/editions/:editionId - End editing a task
router.put('/:taskId/editions/:editionId', (req, res) => taskController.endTaskEdition(req, res));

// DELETE /api/tasks/:taskId - Delete a task
router.delete('/:taskId', (req, res) => taskController.deleteTask(req, res));

export default router;
