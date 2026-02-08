/**
 * Regression test for Issue #208
 * When dragging a task in project kanban, only stageId was updated but not
 * the task status. This caused "All Tasks" list to show stale status.
 *
 * Fix: handleItemMove now sends both stageId and status (derived from
 * stage category) when moving tasks in project kanban.
 *
 * This API-level test verifies that updating both stageId and status
 * simultaneously works correctly and auto-sets completedAt.
 *
 * @see https://github.com/kompotai/bug-reports/issues/208
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('Issue #208: Task Status Sync', { tag: ['@regression'] }, () => {
  const API_BASE = `/api/ws/${WORKSPACE_ID}`;

  ownerTest('updating stageId and status together should sync both fields @regression', async ({ request }) => {
    // 1. Find a project with stages
    const projectsRes = await request.post(`${API_BASE}/projects/search`, {
      data: { limit: 10 },
    });

    if (!projectsRes.ok()) {
      ownerTest.skip(true, 'Cannot fetch projects');
      return;
    }

    const projectsData = await projectsRes.json();
    const projects = projectsData.projects || [];
    const projectWithStages = projects.find((p: { stages?: { _id: string; category: string }[] }) =>
      p.stages && p.stages.length >= 2
    );

    if (!projectWithStages) {
      ownerTest.skip(true, 'No project with 2+ stages found');
      return;
    }

    // Find stages with different categories
    const stages = projectWithStages.stages;
    const activeStage = stages.find((s: { category: string }) => s.category === 'active');
    const doneStage = stages.find((s: { category: string }) => s.category === 'done');

    if (!activeStage || !doneStage) {
      ownerTest.skip(true, 'Project does not have active and done stage categories');
      return;
    }

    // 2. Create a task linked to this project
    const createRes = await request.post(`${API_BASE}/tasks`, {
      data: {
        title: `Status Sync Test #208 ${Date.now()}`,
        status: 'todo',
        stageId: activeStage._id,
        linkedTo: {
          entityType: 'project',
          entityId: projectWithStages.id,
        },
      },
    });

    expect(createRes.status()).toBe(201);
    const task = await createRes.json();

    try {
      // 3. Verify initial state
      expect(task.status).toBe('todo');
      expect(task.stageId).toBe(activeStage._id);

      // 4. Simulate kanban move: update both stageId and status (as the fix does)
      const patchRes = await request.patch(`${API_BASE}/tasks/${task.id}`, {
        data: {
          stageId: doneStage._id,
          status: 'completed',
        },
      });

      expect(patchRes.status()).toBe(200);
      const updated = await patchRes.json();

      // 5. Both fields should be updated
      expect(updated.stageId).toBe(doneStage._id);
      expect(updated.status).toBe('completed');

      // 6. completedAt should be auto-set when status = completed
      expect(updated.completedAt).toBeTruthy();

      // 7. Fetch via GET to verify persistence
      const getRes = await request.get(`${API_BASE}/tasks/${task.id}`);
      expect(getRes.status()).toBe(200);
      const fetched = await getRes.json();

      expect(fetched.stageId).toBe(doneStage._id);
      expect(fetched.status).toBe('completed');
      expect(fetched.completedAt).toBeTruthy();

      // 8. Move back to active stage — completedAt should be cleared
      const patchBack = await request.patch(`${API_BASE}/tasks/${task.id}`, {
        data: {
          stageId: activeStage._id,
          status: 'in_progress',
        },
      });

      expect(patchBack.status()).toBe(200);
      const movedBack = await patchBack.json();

      expect(movedBack.stageId).toBe(activeStage._id);
      expect(movedBack.status).toBe('in_progress');
      // completedAt should be cleared when moving away from completed
      expect(movedBack.completedAt).toBeFalsy();
    } finally {
      // Cleanup
      await request.delete(`${API_BASE}/tasks/${task.id}`);
    }
  });
});
