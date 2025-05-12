# Real-Time Data Synchronization in a To-Do App

## Docker Compose Setup for Local Development

This project uses Docker Compose to run all components (frontend, backend, and database) in a containerized environment.

### Prerequisites
- Docker and Docker Compose installed on your system
- Git to clone the repository

### Running the Application

1. Clone the repository:
   ```
   git clone https://github.com/guyslab/to-do-sync.git
   cd to-do-sync
   ```

2. Start the application stack:
   ```
   docker-compose up
   ```
   Note: The database indexes are automatically created by the db-init service during startup.

3. Access the application:
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:3000

4. To stop the application:
   ```
   docker-compose down
   ```

5. For a fresh database start (clearing all data and indexes):
   ```
   docker-compose down -v
   docker-compose up
   ```
   Note: The `-v` flag removes all volumes, giving you a completely fresh MongoDB instance.

### Docker Configuration Details

The Docker Compose setup includes:
- **MongoDB**: Database service running on port 27017
- **Express Backend**: Node.js server running on port 3000
- **Angular Frontend**: Web application running on port 4200

## Configuration
The application uses environment variables for configuration. Copy the `.env.example` file to `.env` in the server directory and adjust the values as needed:

```
# Database Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=todos

# Application Settings
EDITION_EXPIRATION_MINUTES=3
```
