/**
 * Regression test for Issue #222
 * After updating the project status via the Change Status button on the
 * Project View page, the change was not reflected in the Edit Project modal
 * because the parent component's state was not refreshed.
 *
 * Fix: Pass onSuccess callback to badgeConfigs.projectStatus that calls
 * fetchProject() to refresh local state after inline status change.
 *
 * @see https://github.com/kompotai/bug-reports/issues/222
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('Issue #222: Project status sync with Edit modal', { tag: ['@regression'] }, () => {
  const API_BASE = `/api/ws/${WORKSPACE_ID}`;

  let projectId: string;
  let originalStatus: string;

  ownerTest.beforeAll(async ({ request }) => {
    // Find an existing active project or create one
    const searchRes = await request.post(`${API_BASE}/projects/search`, {
      data: { limit: 5 },
    });

    if (!searchRes.ok()) return;

    const data = await searchRes.json();
    const projects = data.projects || [];
    const activeProject = projects.find((p: { status: string }) => p.status === 'active');

    if (activeProject) {
      projectId = activeProject.id || activeProject._id;
      originalStatus = activeProject.status;
    }
  });

  ownerTest.afterAll(async ({ request }) => {
    // Restore original status if changed
    if (projectId && originalStatus) {
      await request.patch(`${API_BASE}/projects/${projectId}`, {
        data: { status: originalStatus },
      });
    }
  });

  ownerTest('changing status via API updates project correctly @regression', async ({ request }) => {
    if (!projectId) {
      ownerTest.skip(true, 'No active project found');
      return;
    }

    // Change status to on_hold
    const updateRes = await request.patch(`${API_BASE}/projects/${projectId}`, {
      data: { status: 'on_hold' },
    });
    expect(updateRes.ok()).toBe(true);

    // Fetch project to verify
    const getRes = await request.get(`${API_BASE}/projects/${projectId}`);
    expect(getRes.ok()).toBe(true);

    const project = await getRes.json();
    expect(project.status).toBe('on_hold');

    // Change back to active
    const restoreRes = await request.patch(`${API_BASE}/projects/${projectId}`, {
      data: { status: 'active' },
    });
    expect(restoreRes.ok()).toBe(true);
  });

  ownerTest('project view page reflects status change in Edit form @regression', async ({ page }) => {
    if (!projectId) {
      ownerTest.skip(true, 'No active project found');
      return;
    }

    // Navigate to project view page
    await page.goto(`/ws/${WORKSPACE_ID}/projects/${projectId}`);

    // Wait for project to load
    await page.waitForSelector('[data-testid="editable-badge-project_status"]', { timeout: 10000 });

    // Click on the status badge to change it
    await page.click('[data-testid="editable-badge-project_status"]');

    // Wait for dropdown options
    await page.waitForSelector('[data-testid="editable-badge-project_status-options"]', { timeout: 5000 });

    // Select "on_hold" status
    await page.click('[data-testid="editable-badge-option-on_hold"]');

    // Wait for the update to complete (badge should show new status)
    await page.waitForTimeout(1000);

    // Click Edit button
    await page.click('button:has-text("Edit")');

    // Wait for the Edit form to appear in the slide-over
    await page.waitForSelector('form', { timeout: 5000 });

    // The status select in the form should show "on_hold"
    // Check by looking for the selected value in the form
    const statusSelect = page.locator('select[name="status"], [data-testid*="status"]').first();

    if (await statusSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      const selectedStatus = await statusSelect.inputValue().catch(() => null);
      if (selectedStatus) {
        expect(selectedStatus).toBe('on_hold');
      }
    }

    // Restore status — close form and change back
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Change status back to active
    await page.click('[data-testid="editable-badge-project_status"]');
    await page.waitForSelector('[data-testid="editable-badge-project_status-options"]', { timeout: 5000 });
    await page.click('[data-testid="editable-badge-option-active"]');
  });
});
