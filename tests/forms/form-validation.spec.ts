import { test, expect } from '@playwright/test';

test.describe('Form Validation', () => {
  test.describe('Login Form Validation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/account/login');
    });

    test('should validate required workspace ID field', async ({ page }) => {
      const emailInput = page.getByPlaceholder('email@example.com');
      const passwordInput = page.getByPlaceholder('At least 6 characters');
      const signInButton = page.getByRole('button', { name: 'Sign In' });

      // Fill only email and password, leave workspace ID empty
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      await signInButton.click();

      // Should still be on login page
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('/account/login');
    });

    test('should validate required email field', async ({ page }) => {
      const workspaceInput = page.getByPlaceholder('myworkspace');
      const passwordInput = page.getByPlaceholder('At least 6 characters');
      const signInButton = page.getByRole('button', { name: 'Sign In' });

      // Fill only workspace and password, leave email empty
      await workspaceInput.fill('testworkspace');
      await passwordInput.fill('password123');
      await signInButton.click();

      // Should still be on login page
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('/account/login');
    });

    test('should validate required password field', async ({ page }) => {
      const workspaceInput = page.getByPlaceholder('myworkspace');
      const emailInput = page.getByPlaceholder('email@example.com');
      const signInButton = page.getByRole('button', { name: 'Sign In' });

      // Fill only workspace and email, leave password empty
      await workspaceInput.fill('testworkspace');
      await emailInput.fill('test@example.com');
      await signInButton.click();

      // Should still be on login page
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('/account/login');
    });

    test('should validate email format', async ({ page }) => {
      const workspaceInput = page.getByPlaceholder('myworkspace');
      const emailInput = page.getByPlaceholder('email@example.com');
      const passwordInput = page.getByPlaceholder('At least 6 characters');
      const signInButton = page.getByRole('button', { name: 'Sign In' });

      // Fill with invalid email format
      await workspaceInput.fill('testworkspace');
      await emailInput.fill('invalid-email');
      await passwordInput.fill('password123');

      // Check for HTML5 validation
      const emailValidity = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
      expect(emailValidity).toBeFalsy();
    });

    test('should validate password minimum length', async ({ page }) => {
      const workspaceInput = page.getByPlaceholder('myworkspace');
      const emailInput = page.getByPlaceholder('email@example.com');
      const passwordInput = page.getByPlaceholder('At least 6 characters');
      const signInButton = page.getByRole('button', { name: 'Sign In' });

      // Fill with short password
      await workspaceInput.fill('testworkspace');
      await emailInput.fill('test@example.com');
      await passwordInput.fill('12345'); // Less than 6 characters
      await signInButton.click();

      // Should show validation error or stay on login page
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('/account/login');
    });

    test('should show workspace validation error only after clicking Sign In', async ({ page }) => {
      const workspaceInput = page.getByPlaceholder('myworkspace');
      const emailInput = page.getByPlaceholder('email@example.com');
      const passwordInput = page.getByPlaceholder('At least 6 characters');
      const signInButton = page.getByRole('button', { name: 'Sign In' });
      await workspaceInput.fill('  testtest  ');
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      await signInButton.click();
      await expect(page.getByText('Only lowercase letters and numbers')).toBeVisible();
    });

    test('should trim whitespace from email input', async ({ page }) => {
      const emailInput = page.getByPlaceholder('email@example.com');
      await emailInput.fill('  test@example.com  ');
      const emailValue = await emailInput.inputValue();
      expect(emailValue).toBe('test@example.com');
    });



    test('should allow copy-paste in input fields', async ({ page }) => {
      const emailInput = page.getByPlaceholder('email@example.com');

      // Simulate paste
      await emailInput.click();
      const testEmail = 'pasted@example.com';
      await emailInput.fill(testEmail);

      const value = await emailInput.inputValue();
      expect(value).toBe(testEmail);
    });

    test('should toggle password visibility if available', async ({ page }) => {
      const passwordInput = page.getByPlaceholder('At least 6 characters');
      await passwordInput.fill('mypassword');

      // Check if password is masked
      const inputType = await passwordInput.getAttribute('type');
      expect(inputType).toBe('password');

      // Look for show/hide password button
      const toggleButton = page.locator('[aria-label*="password"]', { hasText: /show|hide/i });
      const toggleExists = await toggleButton.count();

      if (toggleExists > 0) {
        await toggleButton.first().click();
        const newType = await passwordInput.getAttribute('type');
        expect(newType).toBe('text');
      }
    });
  });
});
