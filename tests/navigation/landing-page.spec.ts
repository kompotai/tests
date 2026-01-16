import { test, expect } from '@playwright/test';

test.describe('Landing Page Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load landing page successfully', async ({ page }) => {
    // Verify page title
    await expect(page).toHaveTitle(/Kompot/);

    // Verify main heading is visible
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
  });

  test('should display navigation header', async ({ page }) => {
    // Check for Sign In button
    const signInLink = page.getByRole('link', { name: 'Sign In' });
    await expect(signInLink).toBeVisible();

    // Check for Start for Free button
    const startFreeLink = page.getByRole('link', { name: 'Start for Free' }).first();
    await expect(startFreeLink).toBeVisible();

    // Check for logo
    const logo = page.getByRole('img', { name: 'Kompot' }).first();
    await expect(logo).toBeVisible();
  });

  test('should navigate to login page from Sign In button', async ({ page }) => {
    const signInLink = page.getByRole('link', { name: 'Sign In' });
    await signInLink.click();

    // Wait for navigation
    await page.waitForURL(/login/);

    // Verify we're on login page
    expect(page.url()).toContain('/account/login');
  });

  test('should navigate to registration from Start for Free button', async ({ page }) => {
    const startFreeLink = page.getByRole('link', { name: 'Start for Free' }).first();
    await startFreeLink.click();

    // Wait for navigation
    await page.waitForURL(/register/);

    // Verify we're on registration page
    expect(page.url()).toContain('/account/register');
  });

  test('should display pricing section', async ({ page }) => {
    // Look for pricing information
    const pricingHeading = page.getByRole('heading', { name: /price/i }).first();
    await expect(pricingHeading).toBeVisible();

    // Check for price display
    const freePrice = page.getByText('$0');
    await expect(freePrice).toBeVisible();
  });

  test('should display feature comparison table', async ({ page }) => {
    // Scroll to comparison section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));

    // Look for comparison with competitors
    const kompotCell = page.getByText('Kompot').first();
    await expect(kompotCell).toBeVisible();
  });

  test('should display footer with legal links', async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check for legal links
    const termsLink = page.getByRole('link', { name: 'Terms of Service' });
    await expect(termsLink).toBeVisible();

    const privacyLink = page.getByRole('link', { name: 'Privacy Policy' });
    await expect(privacyLink).toBeVisible();
  });

  test('should have language switcher', async ({ page }) => {
    const languageButton = page.getByRole('button', { name: /language/i });
    await expect(languageButton).toBeVisible();
  });

  test('should navigate to home page from logo click', async ({ page }) => {
    // First navigate to login page
    await page.goto('/account/login');

    // Click on logo
    const logo = page.getByRole('link', { name: 'Kompot' });
    await logo.click();

    // Wait for navigation
    await page.waitForURL(/^\/$|\/en$/);

    // Verify we're on home page
    const url = page.url();
    expect(url.endsWith('/') || url.endsWith('/en')).toBeTruthy();
  });

  test('should display AI features section', async ({ page }) => {
    // Look for AI-related content
    const aiHeading = page.getByRole('heading', { name: /AI/i }).first();
    await expect(aiHeading).toBeVisible();
  });
});
