/**
 * Regression Test: Issues #172 and #173
 * Bug: Technician (and other roles) gets 403 error editing/deleting tasks
 *
 * Problem: When a user was assigned to a task but was not the owner (creator),
 * they couldn't edit or delete the task despite having the appropriate permissions.
 * This was because the ownership check only looked at `ownerId`, not `assigneeId`.
 *
 * Fix: Added `assignedTo` parameter to ownership check in task PATCH and DELETE:
 * ```
 * const ownershipError = requireOwnership(auth, 'tasks', 'update', {
 *   ownerId: existing.ownerId,
 *   assignedTo: existing.assignee?.id,  // Added this line
 * });
 * ```
 *
 * @see https://github.com/kompotai/bug-reports/issues/172
 * @see https://github.com/kompotai/bug-reports/issues/173
 */

import { test, expect, request } from '@playwright/test';
import { getAuthFile, WORKSPACE_ID } from '@fixtures/users';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const technicianEmail = `${WORKSPACE_ID}-technician@kompot.ai`;

test.describe.serial('Issue #172, #173: Task Assignee Edit/Delete', () => {
  let createdTaskId: string;
  let technicianUserId: string;

  test('setup: owner creates task assigned to technician @regression', async ({ playwright }) => {
    // Create a new context with owner auth
    const ownerContext = await playwright.request.newContext({
      baseURL: BASE_URL,
      storageState: getAuthFile('owner'),
    });

    // Find technician user by email
    const usersResponse = await ownerContext.post('/api/ws/megatest/users/search', {
      data: { search: technicianEmail, limit: 1 },
    });
    expect(usersResponse.status()).toBe(200);
    const usersData = await usersResponse.json();
    const users = usersData.users || usersData;

    if (!users || users.length === 0) {
      // Try searching by role instead
      const roleResponse = await ownerContext.post('/api/ws/megatest/users/search', {
        data: { roles: ['technician'], limit: 1 },
      });
      expect(roleResponse.status()).toBe(200);
      const roleData = await roleResponse.json();
      const roleUsers = roleData.users || roleData;

      if (!roleUsers || roleUsers.length === 0) {
        test.skip(true, 'No technician user found');
        return;
      }
      technicianUserId = roleUsers[0].id;
    } else {
      technicianUserId = users[0].id;
    }

    // Create task assigned to technician (owner will be the current user)
    const taskName = `Regression Test #172 - ${Date.now()}`;
    const response = await ownerContext.post('/api/ws/megatest/tasks', {
      data: {
        title: taskName,
        assigneeId: technicianUserId,
        priority: 'medium',
      },
    });

    expect(response.status()).toBe(201);
    const task = await response.json();
    createdTaskId = task.id;
    expect(createdTaskId).toBeDefined();

    await ownerContext.dispose();
  });

  test('technician can edit task assigned to them @regression', async ({ playwright }) => {
    test.skip(!createdTaskId, 'Task not created in previous test');

    // Create a new context with technician auth
    const techContext = await playwright.request.newContext({
      baseURL: BASE_URL,
      storageState: getAuthFile('technician'),
    });

    // First verify we can read the task
    const getResponse = await techContext.get(`/api/ws/megatest/tasks/${createdTaskId}`);
    expect(getResponse.status()).toBe(200);
    const task = await getResponse.json();

    // THE KEY TEST: Technician should be able to update the task they're assigned to
    // Before the fix, this would return 403
    const updateResponse = await techContext.patch(`/api/ws/megatest/tasks/${createdTaskId}`, {
      data: {
        title: `${task.title} - Updated by assignee`,
      },
    });

    // This should be 200, not 403
    expect(updateResponse.status()).toBe(200);

    const updatedTask = await updateResponse.json();
    expect(updatedTask.title).toContain('Updated by assignee');

    await techContext.dispose();
  });

  test('technician can delete task assigned to them @regression', async ({ playwright }) => {
    test.skip(!createdTaskId, 'Task not created in previous test');

    // Create a new context with technician auth
    const techContext = await playwright.request.newContext({
      baseURL: BASE_URL,
      storageState: getAuthFile('technician'),
    });

    // THE KEY TEST: Technician should be able to delete the task
    // Before the fix, this would return 403
    const deleteResponse = await techContext.delete(`/api/ws/megatest/tasks/${createdTaskId}`);

    // This should be 200, not 403
    expect(deleteResponse.status()).toBe(200);

    await techContext.dispose();
  });
});
