/**
 * Regression Test: Issue #179
 * Bug: Changes to the project page are not being saved
 *
 * Problem: When a user edits a project and clicks Save, an internal server error
 * appeared. This was because the updateProject function was passing memberIds
 * as strings instead of converting them to ObjectIds.
 *
 * Fix: Added conversion of memberIds to ObjectIds in updateProject:
 * updateData.memberIds = data.memberIds.map(id => new mongoose.Types.ObjectId(id));
 *
 * @see https://github.com/kompotai/bug-reports/issues/179
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';

ownerTest.describe('Issue #179: Project Update MemberIds', () => {
  ownerTest('can update a project without internal error @regression', async ({ page, request }) => {
    // Navigate to projects page
    await page.goto('/ws/projects');
    await page.waitForLoadState('networkidle');

    // Handle cookie consent if present
    const acceptCookies = page.getByRole('button', { name: 'Accept All' });
    if (await acceptCookies.isVisible({ timeout: 1000 }).catch(() => false)) {
      await acceptCookies.click();
      await page.waitForTimeout(300);
    }

    // Look for existing projects or create one
    const projectCard = page.locator('[data-testid="project-card"], [data-testid="project-row"]').first();
    const hasProject = await projectCard.isVisible({ timeout: 3000 }).catch(() => false);

    let projectId: string;

    if (!hasProject) {
      // Create a project first
      await page.getByRole('button', { name: 'Create Project' }).first().click();
      await expect(page.getByRole('heading', { name: 'New Project' })).toBeVisible();

      const projectName = `Regression Test #179 - ${Date.now()}`;
      await page.getByRole('textbox', { name: /name/i }).fill(projectName);

      // Set up response listener
      const createResponse = page.waitForResponse(
        (response) => response.url().includes('/api/projects') && response.request().method() === 'POST',
        { timeout: 10000 }
      );

      await page.getByRole('button', { name: 'Create Project' }).last().click();

      const response = await createResponse;
      const responseBody = await response.json();
      expect(response.status()).toBe(201);
      projectId = responseBody.id;

      // Wait for modal to close
      await page.waitForTimeout(1000);
    } else {
      // Get first project ID from the page
      await projectCard.click();
      await page.waitForLoadState('networkidle');

      // Extract project ID from URL
      const url = page.url();
      const match = url.match(/\/projects\/([a-f0-9]+)/);
      expect(match).toBeTruthy();
      projectId = match![1];
    }

    // Navigate to the project page
    await page.goto(`/ws/projects/${projectId}`);
    await page.waitForLoadState('networkidle');

    // Click Edit button
    const editButton = page.getByRole('button', { name: /Edit/i });
    await expect(editButton).toBeVisible({ timeout: 5000 });
    await editButton.click();

    // Wait for edit form to appear
    await expect(page.getByRole('heading', { name: /Edit Project/i })).toBeVisible({ timeout: 5000 });

    // Make a change - update description
    const descriptionField = page.getByRole('textbox', { name: /description/i });
    await descriptionField.fill(`Updated at ${new Date().toISOString()}`);

    // Set up response listener for PATCH
    const updateResponse = page.waitForResponse(
      (response) => response.url().includes(`/api/projects/${projectId}`) && response.request().method() === 'PATCH',
      { timeout: 10000 }
    );

    // Click Save
    await page.getByRole('button', { name: /Save/i }).click();

    // THE KEY TEST: Verify the API didn't return a 500 internal server error
    // Before the fix, this would fail with Cast to ObjectId error for memberIds
    const response = await updateResponse;

    expect(response.status()).toBe(200);

    // Verify no internal server error message
    const internalError = page.locator('text=Internal Server Error');
    await expect(internalError).not.toBeVisible({ timeout: 2000 });

    // Verify the edit modal closed (success)
    const editHeading = page.getByRole('heading', { name: /Edit Project/i });
    await expect(editHeading).not.toBeVisible({ timeout: 5000 });
  });
});
