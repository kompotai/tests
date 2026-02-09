/**
 * Regression test for Issue #214
 * When task status is edited from the Tasks table, the change was not reflected
 * in the project kanban/details because stageId was not updated.
 *
 * Fix: Server-side sync in updateTask() — when status changes on a project-linked task,
 * automatically update stageId to match the corresponding project stage.
 *
 * @see https://github.com/kompotai/bug-reports/issues/214
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('Issue #214: Task status → stageId sync', { tag: ['@regression'] }, () => {
  const API_BASE = `/api/ws/${WORKSPACE_ID}`;

  let projectId: string;
  let taskId: string;
  let stages: { _id: string; name: string; category: string }[];

  ownerTest.beforeAll(async ({ request }) => {
    // 1. Find a project with stages
    const projectsRes = await request.post(`${API_BASE}/projects/search`, {
      data: { limit: 10 },
    });

    if (!projectsRes.ok()) {
      return;
    }

    const projectsData = await projectsRes.json();
    const projects = projectsData.projects || [];
    const project = projects.find(
      (p: { stages?: { _id: string; category: string }[] }) =>
        p.stages && p.stages.length >= 2
    );

    if (!project) return;

    projectId = project.id || project._id;
    stages = project.stages;

    // 2. Create a test task linked to the project, set to backlog stage
    const backlogStage = stages.find(s => s.category === 'backlog');
    const activeStage = stages.find(s => s.category === 'active');
    if (!backlogStage || !activeStage) return;

    const createRes = await request.post(`${API_BASE}/tasks`, {
      data: {
        title: `Issue214 Test Task ${Date.now()}`,
        status: 'backlog',
        stageId: backlogStage._id,
        linkedTo: { entityType: 'project', entityId: projectId },
      },
    });

    if (createRes.ok()) {
      const task = await createRes.json();
      taskId = task.id || task._id;
    }
  });

  ownerTest.afterAll(async ({ request }) => {
    // Cleanup: delete test task
    if (taskId) {
      await request.delete(`${API_BASE}/tasks/${taskId}`);
    }
  });

  ownerTest('changing status should sync stageId to matching project stage @regression', async ({ request }) => {
    if (!taskId || !projectId || !stages) {
      ownerTest.skip(true, 'No project with stages or task creation failed');
      return;
    }

    const doneStage = stages.find(s => s.category === 'done');
    expect(doneStage).toBeTruthy();

    // Change status to 'completed' — should auto-sync stageId to 'done' stage
    const updateRes = await request.patch(`${API_BASE}/tasks/${taskId}`, {
      data: { status: 'completed' },
    });

    expect(updateRes.ok()).toBe(true);

    // Fetch the task and verify stageId was synced
    const getRes = await request.get(`${API_BASE}/tasks/${taskId}`);
    expect(getRes.ok()).toBe(true);

    const task = await getRes.json();
    expect(task.status).toBe('completed');
    expect(task.stageId).toBe(doneStage!._id);
  });

  ownerTest('changing status to in_progress should sync stageId to active stage @regression', async ({ request }) => {
    if (!taskId || !projectId || !stages) {
      ownerTest.skip(true, 'No project with stages or task creation failed');
      return;
    }

    const activeStage = stages.find(s => s.category === 'active');
    expect(activeStage).toBeTruthy();

    // Change status to 'in_progress' — should auto-sync stageId to 'active' stage
    const updateRes = await request.patch(`${API_BASE}/tasks/${taskId}`, {
      data: { status: 'in_progress' },
    });

    expect(updateRes.ok()).toBe(true);

    const getRes = await request.get(`${API_BASE}/tasks/${taskId}`);
    expect(getRes.ok()).toBe(true);

    const task = await getRes.json();
    expect(task.status).toBe('in_progress');
    expect(task.stageId).toBe(activeStage!._id);
  });
});
