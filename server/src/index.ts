import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToDatabase } from './infrastructure/database/mongodb';
import apiRoutes from './api/routes';
import { createRequestContextMiddleware } from './api/middlewares/request-context.middleware';
import { WebSocketManager } from './infrastructure/messaging/websocket-manager';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const server = http.createServer(app);

// Initialize WebSocket manager
const wsManager = WebSocketManager.getInstance();
wsManager.initialize(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request context middleware
app.use(createRequestContextMiddleware());

// API routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start the server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    
    // Start the server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`WebSocket server available at ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
