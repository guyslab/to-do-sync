Below are two separate documents:

1. OpenAPI 3.1.0 specification for the synchronous REST interface  
2. AsyncAPI 2.6.0 specification for the event interface

Each document includes only the configurations that were explicitly provided in your description.

-----------------------------
OPENAPI 3.1.0 DOCUMENT (YAML)
-----------------------------
openapi: 3.1.0
info:
  title: In-Sync To Do API
  version: 1.0.0
paths:
  /tasks:
    get:
      summary: Queries the tasks list
      parameters:
        - name: includeComplete
          in: query
          required: false
          schema:
            type: boolean
            default: false
        - name: page
          in: query
          required: false
          schema:
            type: integer
            default: 1
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  tasks:
                    type: array
                    items:
                      type: object
                      properties:
                        id:
                          type: string
                          description: Unique identifier for the task
                        title:
                          type: string
                          description: Title of the task
                        complete:
                          type: boolean
                          description: Whether the task is complete
                        createdAt:
                          type: string
                          format: date-time
                          description: When the task was created
                        updatedAt:
                          type: string
                          format: date-time
                          description: When the task was last updated
                        isLocked:
                          type: boolean
                          description: Whether the task is currently being edited
                      required: [id, title, complete, createdAt]
                  total:
                    type: integer
                    description: Total number of tasks matching the query
  /tasks/{taskId}:
    delete:
      summary: Deletes a task from the tasks list
      parameters:
        - name: taskId
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: No Content
  /tasks/{taskId}/completions:
    post:
      summary: Marks a task as complete or incomplete
      parameters:
        - name: taskId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                complete:
                  type: boolean
                  description: Whether the task is complete
              required: [complete]
      responses:
        '200':
          description: Success
  /tasks/{taskId}/editions:
    post:
      summary: Start to edit task, locking the task for editing for others for 5 minutes
      parameters:
        - name: taskId
          in: path
          required: true
          schema:
            type: string
      responses:
        '201':
          description: Edition started
          headers:
            location:
              description: relative url of the edition resource
              schema:
                type: string
              examples:
                example:
                  value: /tasks/{taskId}/editions/{editionId}
        '409':
          description: The task is locked by others
  /tasks/{taskId}/editions/{editionId}:
    put:
      summary: Ends the edition of a task, releasing the editing lock
      parameters:
        - name: taskId
          in: path
          required: true
          schema:
            type: string
        - name: editionId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                title:
                  type: string
                  description: Updated title of the task
              required: [title]
      responses:
        '200':
          description: Success
        '409':
          description: The task is locked by others

------------------------------
ASYNCAPI 2.6.0 DOCUMENT (YAML)
------------------------------
asyncapi: 2.6.0
info:
  title: In-Sync To Do API Events
  version: 1.0.0
channels:
  "Task complete":
    subscribe:
      message:
        name: Task complete
        payload:
          type: object
          properties:
            taskId:
              type: string
              description: ID of the task that was completed
  "Task incomplete":
    subscribe:
      message:
        name: Task incomplete
        payload:
          type: object
          properties:
            taskId:
              type: string
              description: ID of the task that was marked incomplete
  "Task edited":
    subscribe:
      message:
        name: Task edited
        payload:
          type: object
          properties:
            taskId:
              type: string
              description: ID of the task that was edited
            changes:
              type: object
              properties:
                title:
                  type: string
                  description: New title if changed
  "Task created":
    subscribe:
      message:
        name: Task created
        payload:
          type: object
          properties:
            task:
              type: object
              properties:
                id:
                  type: string
                  description: ID of the newly created task
                title:
                  type: string
                  description: Title of the new task
  "Task deleted":
    subscribe:
      message:
        name: Task deleted
        payload:
          type: object
          properties:
            taskId:
              type: string
              description: ID of the task that was deleted
  "Task locked":
    subscribe:
      message:
        name: Task locked
        payload:
          type: object
          properties:
            taskId:
              type: string
              description: ID of the task that was locked
            editionId:
              type: string
              description: ID of the editing session
  "Task released":
    subscribe:
      message:
        name: Task released
        payload:
          type: object
          properties:
            taskId:
              type: string
              description: ID of the task that was released
            editionId:
              type: string
              description: ID of the editing session that ended
            wasUpdated:
              type: boolean
              description: Whether the task was updated during the editing session
