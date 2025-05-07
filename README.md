# Real-Time Data Synchronization in a To-Do App

## Frontend Design decisions
- **Reactive Programming**: RxJS for handling asynchronous data streams
- **State Management**: NgRx Store for centralized application state

## Backend design decisions
- **Domain-Driven Design**: Domain objects are responsible for their own state changes and directly interact with the Unit of Work
- **Unit of Work Pattern**: Manages tracked entities and coordinates persistence operations
- **Repository Pattern**: Focuses solely on data retrieval operations while domain objects handle state tracking
- **Middleware Architecture**: UnitOfWork is created per request and automatically committed at the end of the request lifecycle
- **Data Access Objects**: (DAOs) handle database operations
