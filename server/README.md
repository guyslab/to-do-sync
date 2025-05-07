# To-Do Sync Server

This is the server component of the To-Do Sync application, providing a RESTful API and real-time WebSocket events for task synchronization.

## Architecture

The server follows a clean hexagonal/onion architecture:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Implement business logic
- **Repositories**: Abstract data access
- **Domain**: Core business entities and logic
- **Infrastructure**: Technical implementations (MongoDB, WebSockets)

## Features

- RESTful API for CRUD operations on tasks
- Real-time updates via WebSockets
- Task locking mechanism for collaborative editing
- Soft deletion of tasks

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB (running locally)

### Installation

```bash
# Install dependencies
npm install

# Start the server in development mode
npm run dev

# Start the server in production mode
npm start
```

### MongoDB Setup

The server works with a standard MongoDB installation:

```bash
# Start MongoDB
mongod
```

## API Endpoints

- `GET /tasks` - List all tasks
- `POST /tasks` - Create a new task
- `DELETE /tasks/:id` - Delete a task
- `POST /tasks/:id/completions` - Mark a task as complete/incomplete
- `POST /tasks/:id/editions` - Start editing a task
- `PUT /tasks/:id/editions/:editionId` - Finish editing a task

## WebSocket Events

- `task_created` - A new task was created
- `task_deleted` - A task was deleted
- `task_complete` - A task was marked as complete
- `task_incomplete` - A task was marked as incomplete
- `task_locked` - A task was locked for editing
- `task_released` - A task was released from editing
- `task_edited` - A task's content was edited
