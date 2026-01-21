/**
 * Authentication Tests (Story-Driven)
 *
 * See: stories/authentication.story.md
 *
 * Behaviors covered:
 * - G1: Login to Workspace
 * - G2: Role-Based Login
 * - G3: Session Management
 * - G4: Form Validation
 */

import { test, expect } from '../../../fixtures/world.fixture';
import {
  navigateTo,
  fillField,
  clickButton,
  shouldSeeError,
  shouldBeOnPage,
  shouldSee,
  waitForLoading,
} from '../../../helpers/actions';
import { TestCredentials, InvalidCredentials, TestUrls } from '../../../utils/test-data';

test.describe('Authentication', () => {
  test.describe('G1: Login to Workspace', () => {
    test('[G1] User can login with valid credentials @smoke', async ({ world }) => {
      await navigateTo(world.page, TestUrls.login);
      await fillField(world.page, 'wsid', TestCredentials.workspaceId);
      await fillField(world.page, 'email', TestCredentials.email);
      await fillField(world.page, 'password', TestCredentials.password);
      await clickButton(world.page, 'Sign In');
      await waitForLoading(world.page);
      await shouldBeOnPage(world.page, /\/ws|\/dashboard|\/home/);
    });

    test('[G1] User cannot login with wrong password', async ({ world }) => {
      await navigateTo(world.page, TestUrls.login);
      await fillField(world.page, 'wsid', TestCredentials.workspaceId);
      await fillField(world.page, 'email', TestCredentials.email);
      await fillField(world.page, 'password', InvalidCredentials.password);
      await clickButton(world.page, 'Sign In');
      await waitForLoading(world.page);
      await shouldSeeError(world.page);
    });

    test('[G1] User cannot login with non-existent email', async ({ world }) => {
      await navigateTo(world.page, TestUrls.login);
      await fillField(world.page, 'wsid', TestCredentials.workspaceId);
      await fillField(world.page, 'email', InvalidCredentials.email);
      await fillField(world.page, 'password', InvalidCredentials.password);
      await clickButton(world.page, 'Sign In');
      await waitForLoading(world.page);
      await shouldSeeError(world.page);
    });
  });

  test.describe('G2: Role-Based Login', () => {
    test('[G2] Owner/Admin can login and access features', async ({ world }) => {
      await world.loginAs('admin');
      expect(await world.isLoggedIn()).toBeTruthy();
      await shouldBeOnPage(world.page, /\/ws|\/dashboard|\/home/);
    });

    test('[G2] Regular user can login and access workspace', async ({ world }) => {
      await world.loginAs('default');
      expect(await world.isLoggedIn()).toBeTruthy();
      await shouldBeOnPage(world.page, /\/ws|\/dashboard|\/home/);
    });
  });

  test.describe('G3: Session Management', () => {
    test('[G3] Session persists across page reloads', async ({ world }) => {
      await world.loginAs('default');
      expect(await world.isLoggedIn()).toBeTruthy();
      await world.page.reload();
      await waitForLoading(world.page);
      expect(await world.isLoggedIn()).toBeTruthy();
    });

    test('[G3] User can logout', async ({ world }) => {
      await world.loginAs('default');
      await world.logout();
      expect(world.page.url()).toMatch(/\/login|\/account\/login/);
    });

    test('[G3] Invalid credentials show error message', async ({ world }) => {
      await navigateTo(world.page, TestUrls.login);
      await fillField(world.page, 'wsid', TestCredentials.workspaceId);
      await fillField(world.page, 'email', InvalidCredentials.email);
      await fillField(world.page, 'password', InvalidCredentials.password);
      await clickButton(world.page, 'Sign In');
      await waitForLoading(world.page);
      await shouldSeeError(world.page);
    });
  });

  test.describe('G4: Form Validation', () => {
    test('[G4] Empty fields prevent login', async ({ world }) => {
      await navigateTo(world.page, TestUrls.login);
      await clickButton(world.page, 'Sign In');
      await world.page.waitForTimeout(1000);
      expect(world.page.url()).toContain('login');
    });

    test('[G4] Invalid email format shows error', async ({ world }) => {
      await navigateTo(world.page, TestUrls.login);
      await fillField(world.page, 'wsid', TestCredentials.workspaceId);
      await fillField(world.page, 'email', InvalidCredentials.invalidEmail);
      await fillField(world.page, 'password', TestCredentials.password);
      await clickButton(world.page, 'Sign In');
      await world.page.waitForTimeout(1000);
      // Should stay on login page or show validation error
      const onLoginPage = world.page.url().includes('login');
      const hasError = await world.page.locator('.error, [class*="error"], [class*="invalid"]').first().isVisible().catch(() => false);
      expect(onLoginPage || hasError).toBeTruthy();
    });

    test('[G4] Short password shows error', async ({ world }) => {
      await navigateTo(world.page, TestUrls.login);
      await fillField(world.page, 'wsid', TestCredentials.workspaceId);
      await fillField(world.page, 'email', TestCredentials.email);
      await fillField(world.page, 'password', InvalidCredentials.shortPassword);
      await clickButton(world.page, 'Sign In');
      await world.page.waitForTimeout(1000);
      // Should stay on login page or show validation error
      const onLoginPage = world.page.url().includes('login');
      const hasError = await world.page.locator('.error, [class*="error"], [class*="invalid"]').first().isVisible().catch(() => false);
      expect(onLoginPage || hasError).toBeTruthy();
    });
  });
});
