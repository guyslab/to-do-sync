# In-Sync To Do API

## Open API

### Query tasks
Queries the tasks list 
GET /tasks?includeComplete=true&page=1
defaults:
* includeComplete=false
* page=1
response json payload:
{ 
  "type": "object", 
  "properties": {
    "tasks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "description": "Unique identifier for the task" },
          "title": { "type": "string", "description": "Title of the task" },
          "complete": { "type": "boolean", "description": "Whether the task is complete" },
          "createdAt": { "type": "string", "format": "date-time", "description": "When the task was created" },
          "updatedAt": { "type": "string", "format": "date-time", "description": "When the task was last updated" },
          "isLocked": { "type": "boolean", "description": "Whether the task is currently being edited" },
        },
        "required": ["id", "title", "complete", "createdAt"]
      }
    },
    "total": { "type": "integer", "description": "Total number of tasks matching the query" }
  }
}


### Delete task
Deletes a task from the tasks list
DELETE /tasks/{taskId}
response status: 204

### Mark completion
Marks a task as complete or incomplete
POST /tasks/{taskId}/completions
request json payload:
{ 
  "type": "object", 
  "properties": { 
    "complete": { 
      "type": "boolean",
      "description": "Whether the task is complete" 
    }
  },
  "required": ["complete"]
}

### Start task edition
Start to edit task, locking the task for editing for others for 5 minutes
POST /tasks/{taskId}/editions
response header:
{ 
  "location": { 
    "type": "string", 
    "description": "relative url of the edition resource"
  }, 
  "example": "/tasks/{taskId}/editions/{editionId}" 
}
response status: 201 for success; 409 when the task is locked by others

### Stop task edition
Ends the edition of a task, releasing the editing lock
PUT /tasks/{taskId}/editions/{editionId}
request json payload:
{
  "type": "object",
  "properties": {
    "title": { "type": "string", "description": "Updated title of the task" },
  },
  "required": ["title"]
}
response status: 200 for success; 409 when the task is locked by others

## Async API

### Task complete
A task has been marked as complete
event payload:
{
  "type": "object", 
  "properties": {
    "taskId": { "type": "string", "description": "ID of the task that was completed" },
  }
}

### Task incomplete
A task has been marked as incomplete
event payload:
{
  "type": "object", 
  "properties": {
    "taskId": { "type": "string", "description": "ID of the task that was marked incomplete" },
  }
}

### Task edited
A task has been edited
event payload:
{
  "type": "object", 
  "properties": {
    "taskId": { "type": "string", "description": "ID of the task that was edited" },
    "changes": {
      "type": "object",
      "properties": {
        "title": { "type": "string", "description": "New title if changed" },
      }
    }
  }
}

### Task created
A task has been created
event payload:
{
  "type": "object", 
  "properties": {
    "task": {
      "type": "object",
      "properties": {
        "id": { "type": "string", "description": "ID of the newly created task" },
        "title": { "type": "string", "description": "Title of the new task" },
      }
    }
  }
}

### Task deleted
A task has been deleted
event payload:
{
  "type": "object", 
  "properties": {
    "taskId": { "type": "string", "description": "ID of the task that was deleted" }
  }
}

### Task locked
A task has been locked
event payload:
{
  "type": "object", 
  "properties": {
    "taskId": { "type": "string", "description": "ID of the task that was locked" },
    "editionId": { "type": "string", "description": "ID of the editing session" }
  }
}

### Task released
A task has been released
event payload:
{
  "type": "object", 
  "properties": {
    "taskId": { "type": "string", "description": "ID of the task that was released" },
    "editionId": { "type": "string", "description": "ID of the editing session that ended" },
    "wasUpdated": { "type": "boolean", "description": "Whether the task was updated during the editing session" }
  }
}
