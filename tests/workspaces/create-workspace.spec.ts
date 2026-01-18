import { expect } from '@playwright/test';
import { test } from '@fixtures/auth.fixture';
import { generateRandomWorkspaceId, generateRandomString } from '@utils/helpers';

test.describe('Workspace Creation', () => {
    test('should create a new workspace with random data', async ({ authenticatedAdminPage, manageWorkspacesPage, page }) => {
        // 1. Get Admin credentials from .env for the new workspace being created
        const adminEmail = process.env.TEST_USER_EMAIL!;
        const adminPassword = process.env.TEST_USER_PASSWORD!;

        // 2. Generate random workspace data
        const randomWorkspaceName = `Company-${generateRandomString(5)}`;
        const randomWorkspaceId = generateRandomWorkspaceId();

        // 3. Navigate to the workspace management page
        // (authenticatedPage fixture ensures we are already logged in)
        await manageWorkspacesPage.goto();

        // 4. Open the workspace creation form
        await manageWorkspacesPage.clickInitialCreateWorkspaceButton();

        // 5. Fill the form and submit using the ManageWorkspacesPage model
        await manageWorkspacesPage.createNewWorkspace(
            randomWorkspaceName,
            randomWorkspaceId,
            adminEmail,
            adminPassword
        );

        // 6. Assert success
        await expect(manageWorkspacesPage.createdWorkspaceSuccessMessage).toBeVisible()

        //need a way to delete the workspace created - didn't see in documentation
    });
});