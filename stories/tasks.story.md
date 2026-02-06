# Story: Tasks

## Overview
Tasks management including CRUD operations, filtering, search, status tracking, and relationships with contacts/opportunities.

## User Stories

### T1: View Tasks List
As a user, I want to view my tasks so that I can find task information and manage my work.

#### Acceptance Criteria
- [ ] **AC1**: User can see tasks list after login
- [ ] **AC2**: Tasks display name, status, priority, owner, assignee, due date
- [ ] **AC3**: Empty state shown when no tasks
- [ ] **AC4**: Pagination works for large lists

### T2: Create Task
As a user, I want to create new tasks so that I can organize work, prioritize work, and track progress.

#### Acceptance Criteria
- [ ] **AC1**: User can open task creation form
- [ ] **AC2**: User can create task with task name only (minimal)
- [ ] **AC3**: User can create task with all fields (name, description, priority, status, due date, assignee)
- [ ] **AC4**: Validation errors shown for invalid data
- [ ] **AC5**: Created task appears in list

### T3: Edit Task
As a user, I want to edit tasks so that I can update task information as work progresses.

#### Acceptance Criteria
- [ ] **AC1**: User can open task edit form
- [ ] **AC2**: User can edit task name
- [ ] **AC3**: User can edit task description
- [ ] **AC4**: User can change priority
- [ ] **AC5**: User can change assignee
- [ ] **AC6**: User can update due date
- [ ] **AC7**: Changes are saved successfully

### T4: Delete Task
As a user, I want to delete tasks so that I can remove completed or cancelled tasks.

#### Acceptance Criteria
- [ ] **AC1**: User can initiate task deletion
- [ ] **AC2**: User sees delete confirmation dialog
- [ ] **AC3**: Task removed after confirmation
- [ ] **AC4**: Task list updates after deletion

### T5: Change Task Status
As a user, I want to quickly change task status **without opening edit form**
so that I can update progress efficiently.

#### Implementation Note
Status can be changed via:
- Drag-and-drop in board view
- Quick dropdown in list view
- Full edit form (covered in T3)

#### Acceptance Criteria
- [ ] **AC1**: User can change status to "To Do"
- [ ] **AC2**: User can change status to "In Progress"
- [ ] **AC3**: User can change status to "Done"
- [ ] **AC4**: Status change is saved immediately
- [ ] **AC5**: Task list reflects status change
- [ ] **AC6**: User can change status via drag-and-drop in board view
- [ ] **AC7**: User can change status via quick dropdown in list view

### T6: Filter Tasks
As a user, I want to filter tasks so that I can find specific tasks quickly.

#### Acceptance Criteria
- [ ] **AC1**: User can filter by status
- [ ] **AC2**: User can filter by priority
- [ ] **AC3**: User can filter by assignee
- [ ] **AC4**: User can filter by due date range
- [ ] **AC5**: Filters can be combined
- [ ] **AC6**: Clear filters resets to all tasks

### T7: Search Tasks
As a user, I want to search tasks so that I can find tasks by name or description.

#### Acceptance Criteria
- [ ] **AC1**: User can search by task name
- [ ] **AC2**: Search results update as user types
- [ ] **AC3**: Empty search shows all tasks
- [ ] **AC4**: No results message shown when no matches

### T8: Assign Task
As a user, I want to assign tasks to team members so that I can delegate work.

#### Acceptance Criteria
- [ ] **AC1**: User can assign task to themselves
- [ ] **AC2**: User can assign task to another team member
- [ ] **AC3**: User can change assignee
- [ ] **AC4**: User can remove assignee (unassign)

### T9: Set Task Priority
As a user, I want to set task priority so that I can identify important tasks.

#### Acceptance Criteria
- [ ] **AC1**: User can set priority to Low
- [ ] **AC2**: User can set priority to Medium
- [ ] **AC3**: User can set priority to High
- [ ] **AC4**: Priority is visually indicated in list

### T10: Link Task to Contact
As a user, I want to link tasks to contacts so that I can track related work.

#### Acceptance Criteria
- [ ] **AC1**: User can link task to existing contact
- [ ] **AC2**: User can view linked contact from task
- [ ] **AC3**: User can unlink contact from task
- [ ] **AC4**: Tasks appear on contact detail page

### T11: Link Task to Opportunity
As a user, I want to link tasks to opportunities so that I can track deal-related work.

#### Acceptance Criteria
- [ ] **AC1**: User can link task to existing opportunity
- [ ] **AC2**: User can view linked opportunity from task
- [ ] **AC3**: User can unlink opportunity from task
- [ ] **AC4**: Tasks appear on opportunity detail page

### T12: Set Due Date
As a user, I want to set due dates on tasks so that I can manage deadlines.

#### Acceptance Criteria
- [ ] **AC1**: User can set due date via date picker
- [ ] **AC2**: User can clear due date
- [ ] **AC3**: Overdue tasks are visually indicated
- [ ] **AC4**: Due date displayed in task list

## Test File
`tests/e2e/tasks/tasks.spec.ts`

## Status
- [ ] All acceptance criteria implemented
- [ ] All tests passing (0/0)
