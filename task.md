Task Description:
Develop a simple To-Do List application that supports real-time updates. When one client
makes changes to the data (e.g., adds, edits, or deletes a task), all other connected clients
should instantly reflect those changes without needing a page refresh.
Requirements:
1. Frontend (UI):
 Implement the UI using Angular.
 Create a basic To-Do list interface that includes the following functionality:
o Add a task.
o Edit a task.
o Delete a task.
o Mark a task as completed or incomplete.
 Use Angular Material (or another UI library) for a clean and professional design.
2. Backend:
 Use Node.js with Express.js for the backend.
 Implement a RESTful API for CRUD operations (Create, Read, Update, Delete) on
tasks.
 Use MongoDB as the database to store tasks.
3. Real-Time Functionality:
 Ensure that when a task is updated (e.g., added, edited, or deleted) in one client, all
connected clients receive the update in real time.
 Each task can be edit by one client – if client in edit mode, no one else can edit or
delete it
4. Design Patterns:
 Use appropriate design patterns throughout the project. Examples include:
o Frontend: Service pattern for data management, Reactive programming
using RxJS.
o Backend: Repository pattern for database interactions, Factory or Singleton
patterns where applicable.
5. Code Quality:
 Follow clean code principles.
 Ensure proper separation of concerns at all levels (frontend, backend, and
database).
 Add comments and documentation where necessary.
6. Bonus Points:
 Add authentication to the app (e.g., user login) using JWT or another secure
method.
 Implement additional features like task prioritization or due dates.
Deliverables:
Code Repository:
o A GitHub or GitLab repository containing the project source code.
o Provide a README file with:
 Instructions to set up and run the application locally.
 A short explanation of the design decisions and patterns used.
