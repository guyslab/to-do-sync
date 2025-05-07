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

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`REST API: http://localhost:${PORT}/tasks`);
    console.log("WebSocket events are enabled for real-time updates");
  });
}

bootstrap().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
