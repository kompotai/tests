/**
 * Users Management Tests
 *
 * Settings → Users & Access → Users
 *
 * TC-1: Create user with minimal data
 * TC-2: Validation — required fields
 * TC-3: Validation — duplicate email
 * TC-4: Edit user (name, job title)
 * TC-5: Toggle status (active ↔ inactive)
 * TC-6: Delete user
 * TC-7: User detail page
 * TC-8: Generate password
 * TC-9: Role assignment (multi-role + edit)
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { UsersPage } from '@pages/UsersPage';
import { createMinimalUser, createFullUser } from './users.fixture';

ownerTest.describe('Users Management', () => {
  let usersPage: UsersPage;

  ownerTest.beforeEach(async ({ page }) => {
    usersPage = new UsersPage(page);
    await usersPage.goto();
  });

  ownerTest('TC-1: creates user with minimal data', async () => {
    const user = createMinimalUser();

    await usersPage.create(user);

    await usersPage.shouldSeeUser(user.email);
    const rowData = await usersPage.getUserRowData(user.email);
    expect(rowData.email).toBe(user.email);

    // Cleanup
    await usersPage.deleteUser(user.email);
    await usersPage.shouldNotSeeUser(user.email);
  });

  ownerTest.describe('TC-2: Validation — required fields', () => {
    ownerTest('cannot submit empty form', async () => {
      await usersPage.openCreateForm();
      await usersPage.clickSubmitExpectingError();

      const formVisible = await usersPage.isFormVisible();
      expect(formVisible).toBe(true);

      await usersPage.cancelForm();
    });
  });

  ownerTest('TC-3: validation — duplicate email', async () => {
    const user = createMinimalUser();

    // Create first user
    await usersPage.create(user);
    await usersPage.shouldSeeUser(user.email);

    // Try to create user with same email
    await usersPage.openCreateForm();
    await usersPage.fillForm({
      name: 'Duplicate User',
      email: user.email,
      password: 'DupPass123!',
    });
    await usersPage.clickSubmitExpectingError();

    // Form should remain open (error)
    const formVisible = await usersPage.isFormVisible();
    expect(formVisible).toBe(true);

    await usersPage.cancelForm();

    // Cleanup
    await usersPage.deleteUser(user.email);
    await usersPage.shouldNotSeeUser(user.email);
  });

  ownerTest('TC-4: edits user name and job title', async () => {
    const user = createMinimalUser();

    await usersPage.create(user);
    await usersPage.shouldSeeUser(user.email);

    // Edit
    const newName = 'Edited Name';
    await usersPage.editUser(user.email, {
      name: newName,
      jobTitle: 'Senior Developer',
    } as any);

    // Verify name changed in table
    await usersPage.shouldSeeUser(newName);

    // Cleanup
    await usersPage.deleteUser(user.email);
    await usersPage.shouldNotSeeUser(user.email);
  });

  ownerTest('TC-5: toggles user status active → inactive → active', async () => {
    const user = createMinimalUser();

    await usersPage.create(user);
    await usersPage.shouldSeeUser(user.email);

    // Verify initial state is active
    const initialActive = await usersPage.isUserActive(user.email);
    expect(initialActive).toBe(true);

    // Toggle to inactive
    await usersPage.toggleUserStatus(user.email);
    const afterToggle = await usersPage.isUserActive(user.email);
    expect(afterToggle).toBe(false);

    // Toggle back to active
    await usersPage.toggleUserStatus(user.email);
    const afterRestore = await usersPage.isUserActive(user.email);
    expect(afterRestore).toBe(true);

    // Cleanup
    await usersPage.deleteUser(user.email);
    await usersPage.shouldNotSeeUser(user.email);
  });

  ownerTest('TC-6: deletes user', async () => {
    const user = createMinimalUser();

    await usersPage.create(user);
    await usersPage.shouldSeeUser(user.email);

    await usersPage.deleteUser(user.email);
    await usersPage.shouldNotSeeUser(user.email);
  });

  ownerTest('TC-7: navigates to user detail page', async ({ page }) => {
    // Use existing workspace user to avoid creating/deleting
    const existingUser = 'galcompany Admin';

    await usersPage.clickUserName(existingUser);
    await usersPage.shouldBeOnDetailPage();

    // Verify detail page content
    await usersPage.shouldSeeText(existingUser);
    await usersPage.shouldSeeText('galcompany-admin@kompot.ai');
    await usersPage.shouldSeeText('Active');

    // Go back to list
    await usersPage.goBackToList();
    await usersPage.shouldSeeUser(existingUser);
  });

  ownerTest('TC-8: generates password', async () => {
    await usersPage.openCreateForm();

    const generated = await usersPage.generatePassword();
    expect(generated.length).toBeGreaterThan(0);

    await usersPage.cancelForm();
  });

  ownerTest('TC-9: assigns multiple roles and edits them', async () => {
    const user = createFullUser({ roles: ['Admin', 'Manager'] });

    await usersPage.create(user);
    await usersPage.shouldSeeUser(user.email);

    // Verify both roles in table
    const rowData = await usersPage.getUserRowData(user.email);
    expect(rowData.roles).toContain('Admin');
    expect(rowData.roles).toContain('Manager');

    // Edit: remove Manager role
    await usersPage.editUser(user.email, { roles: ['Admin'] } as any);

    // Verify only Admin remains
    const updatedData = await usersPage.getUserRowData(user.email);
    expect(updatedData.roles).toContain('Admin');
    expect(updatedData.roles).not.toContain('Manager');

    // Cleanup
    await usersPage.deleteUser(user.email);
    await usersPage.shouldNotSeeUser(user.email);
  });
});
