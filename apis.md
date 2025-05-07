# In-Sync To Do API

## Open API

### Query tasks
Queries the tasks list 
GET /tasks?includeComplete=true
defaults:
* includeComplete=false
response json payload:
{ "type": "object", properties: {} }


### Delete task
Deletes a task from the tasks list
DELETE /tasks/{taskId}

### Mark completion
Marks a task as complete or incomplete
POST /tasks/{taskId}/completions
request json payload:
{ "type": "object", properties: { "complete" : { "type": "boolean",
"description": "Whether the task is complete" }} }

### Start task edition
Start to edit task, locking the task for editing for others for 5 minutes
POST /tasks/{taskId}/editions
reponse header:
{ "location": { "type": "string", "description" : "relative url of the edition resource"
}, "example" : "/tasks/{taskId}/completions/{completionId}" }

### Stop task edition
Ends the edition of a task, releasing the editing lock
PUT /tasks/{taskId}/completions/{completionId}

## Async API

### Task complete
A task has been marked as complete
event payload:
{ "type": "object", "properties": {} }

### Task incomplete
A task has been marked as incomplete
event payload:
{ "type": "object", "properties": {} }

### Task edited
A task has been edited
event payload:
{ "type": "object", "properties": {} }

### Task created
A task has been created
event payload:
{ "type": "object", "properties": {} }

### Task deleted
A task has been deleted
event payload:
{ "type": "object", "properties": {} }

### Task locked
A task has been locked
event payload:
{ "type": "object", "properties": {} }

### Task released
A task has been released
event payload:
{ "type": "object", "properties": {} }
