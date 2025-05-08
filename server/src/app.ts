import express from "express";
import http from "http";
import cors from "cors";
import { json } from "body-parser";
import EventPublisher from "./infrastructure/event.publisher";
import taskController from "./controllers/task.controller";
import { unitOfWorkMiddleware } from "./middleware/unit-of-work.middleware";

async function bootstrap() {
  const app = express();
  app.use(cors());
  app.use(json());
  
  // Apply the UnitOfWork middleware to all routes
  app.use(unitOfWorkMiddleware);

  app.use("/tasks", taskController);

  const httpServer = http.createServer(app);
  EventPublisher.attachHTTPServer(httpServer);

  const PORT = process.env.PORT || 3000;
  httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Server listening on all interfaces (0.0.0.0)`);
    console.log(`REST API: http://<your-ip>:${PORT}/tasks`);
    console.log("WebSocket events are enabled for real-time updates");
  });
}

bootstrap().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
