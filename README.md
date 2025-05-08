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

## Configuration
The application uses environment variables for configuration. Copy the `.env.example` file to `.env` in the server directory and adjust the values as needed:

```
# Database Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=todos

# Application Settings
EDITION_EXPIRATION_MINUTES=3
```

### Configuration Options

- **MONGODB_URI**: MongoDB connection string
- **MONGODB_DB_NAME**: Name of the MongoDB database
- **EDITION_EXPIRATION_MINUTES**: Duration (in minutes) before an editing session expires
