# To-Do Sync Client Restructuring

This document explains the restructuring of the To-Do Sync client application to follow separation of concerns principles.

## Original Structure
The original structure had minimal separation:
- `app.component.ts` - Root component
- `components/task-list/task-list.component.ts` - Main component handling all task operations
- `models/task.model.ts` - Task interfaces
- `services/task.service.ts` - Service for API communication

## New Structure
The new structure follows these principles:
1. **Single Responsibility Principle**: Each module, component, and service has a single responsibility
2. **Separation of Concerns**: UI, business logic, and data access are separated
3. **Feature Modules**: Related functionality is grouped into feature modules
4. **Core Services**: Shared services are placed in a core module

### Directory Structure
```
src/
├── app/
│   ├── core/                  # Core services and utilities
│   │   ├── api/               # API communication
│   │   │   ├── api.service.ts # Base API service
│   │   │   └── endpoints.ts   # API endpoints configuration
│   │   ├── models/            # Shared models/interfaces
│   │   │   └── task.model.ts  # Task interfaces
│   │   ├── services/          # Core services
│   │   │   ├── websocket.service.ts # WebSocket handling
│   │   │   └── event-bus.service.ts # Application event bus
│   │   └── core.module.ts     # Core module definition
│   ├── features/              # Feature modules
│   │   └── tasks/             # Tasks feature
│   │       ├── components/    # Task-related components
│   │       │   ├── task-form/ # Task creation form
│   │       │   ├── task-item/ # Individual task item
│   │       │   └── task-list/ # Task list container
│   │       ├── services/      # Task-specific services
│   │       │   └── task.service.ts # Task operations
│   │       └── tasks.module.ts # Tasks module definition
│   ├── shared/                # Shared components, directives, pipes
│   │   └── shared.module.ts   # Shared module definition
│   ├── app-routing.module.ts  # Application routing
│   ├── app.component.ts       # Root component
│   └── app.module.ts          # Root module
└── environments/              # Environment configurations
```

## Key Components

### Core Module
- **ApiService**: Handles HTTP requests with error handling
- **WebSocketService**: Manages WebSocket connections and reconnection logic
- **EventBusService**: Provides application-wide event communication
- **Task Models**: Shared interfaces for task data

### Tasks Feature Module
- **TaskService**: Business logic for task operations
- **TaskListComponent**: Container component for the task list
- **TaskItemComponent**: Individual task item with its own logic
- **TaskFormComponent**: Form for creating new tasks

## Benefits of the New Structure

1. **Maintainability**: Each component and service has a clear, single responsibility, making the code easier to understand and maintain.

2. **Testability**: Components with single responsibilities are easier to test in isolation.

3. **Scalability**: The modular structure allows for easy addition of new features without modifying existing code.

4. **Reusability**: Components and services can be reused across the application.

5. **Collaboration**: Multiple developers can work on different features simultaneously with minimal conflicts.

6. **Separation of Concerns**:
   - UI logic is in components
   - Business logic is in services
   - Data access is abstracted in the API service
   - WebSocket communication is handled by a dedicated service

7. **Event-Driven Architecture**: The EventBusService provides a clean way for components to communicate without tight coupling.

## Migration Notes

To migrate to this new structure:
1. Create the directory structure
2. Move and refactor the code according to the new structure
3. Update imports and dependencies
4. Test the application to ensure functionality is preserved
