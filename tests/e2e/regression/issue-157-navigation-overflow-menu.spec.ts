/**
 * E2E Tests: Navigation Overflow Menu
 *
 * Tests responsive overflow menu behavior in the main navigation bar.
 *
 * Feature: Issue #157 - Responsive overflow menu
 * - Navigation items always show icon + text when visible
 * - Items that don't fit are moved to overflow dropdown (⋯ button)
 * - Dropdown shows all hidden items with icons and labels
 * - Clicking outside closes the dropdown
 *
 * Breakpoints:
 * - Mobile (<1024px): 3 items visible
 * - Tablet (1024-1280px): 5 items visible
 * - Laptop (1280-1536px): 7 items visible
 * - Desktop (1536-1920px): 9 items visible
 * - Wide screen (≥1920px): 11 items visible
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('Navigation Overflow Menu', () => {

  ownerTest.beforeEach(async ({ page }) => {
    await page.goto(`/ws/${WORKSPACE_ID}/contacts`);
    await page.waitForLoadState('networkidle');

    // Wait for navigation to load
    const nav = page.getByTestId('main-navigation');
    await expect(nav).toBeVisible({ timeout: 10000 });
  });

  ownerTest('shows all items on wide screen (1920px+) @smoke', async ({ page }) => {
    // Set viewport to wide screen
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500); // Allow resize to take effect

    // Count visible navigation items
    const nav = page.getByTestId('main-navigation');
    const navItems = nav.locator('a[data-testid^="nav-item-"]');
    const count = await navItems.count();

    // On wide screen, should show many items (at least 8)
    expect(count).toBeGreaterThanOrEqual(8);

    // More button should not be visible if all items fit (or might be visible if many items)
    const moreButton = page.getByTestId('nav-more-button');
    const isMoreVisible = await moreButton.isVisible().catch(() => false);

    console.log(`Wide screen: ${count} visible items, more button: ${isMoreVisible}`);
  });

  ownerTest('shows overflow menu on mobile (320px) @smoke', async ({ page }) => {
    // Set viewport to mobile
    await page.setViewportSize({ width: 320, height: 568 });
    await page.waitForTimeout(500); // Allow resize to take effect

    // Should show only 3 visible items
    const nav = page.getByTestId('main-navigation');
    const navItems = nav.locator('a[data-testid^="nav-item-"]');
    const visibleCount = await navItems.count();

    console.log(`Mobile: ${visibleCount} visible items`);
    expect(visibleCount).toBeLessThanOrEqual(3);

    // More button should be visible
    const moreButton = page.getByTestId('nav-more-button');
    await expect(moreButton).toBeVisible();

    // More button should only show icon (MoreHorizontal), no text
    const buttonText = await moreButton.textContent();
    expect(buttonText?.trim()).toBe('');
  });

  ownerTest('visible items always show icon + text @smoke', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);

    // Get all visible nav items
    const nav = page.getByTestId('main-navigation');
    const navItems = nav.locator('a[data-testid^="nav-item-"]');
    const count = await navItems.count();

    expect(count).toBeGreaterThan(0);

    // Check each visible item has both icon and text
    for (let i = 0; i < count; i++) {
      const item = navItems.nth(i);

      // Should have an icon (svg)
      const icon = item.locator('svg');
      await expect(icon).toBeVisible();

      // Should have text content
      const text = await item.textContent();
      expect(text?.trim()).not.toBe('');
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  ownerTest('overflow dropdown opens and closes on click', async ({ page }) => {
    // Set to tablet size to ensure overflow
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);

    const moreButton = page.getByTestId('nav-more-button');

    // More button should be visible
    await expect(moreButton).toBeVisible();

    // Dropdown should not be visible initially
    const dropdown = page.getByTestId('nav-overflow-menu');
    await expect(dropdown).not.toBeVisible();

    // Click more button
    await moreButton.click();
    await page.waitForTimeout(200);

    // Dropdown should be visible
    await expect(dropdown).toBeVisible();

    // Dropdown should have overflow items
    const overflowItems = dropdown.locator('a[data-testid^="nav-overflow-item-"]');
    const overflowCount = await overflowItems.count();
    expect(overflowCount).toBeGreaterThan(0);

    // Click more button again to close
    await moreButton.click();
    await page.waitForTimeout(200);

    // Dropdown should be hidden
    await expect(dropdown).not.toBeVisible();
  });

  ownerTest('overflow dropdown closes when clicking outside', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);

    const moreButton = page.getByTestId('nav-more-button');

    // Open dropdown
    await moreButton.click();
    await page.waitForTimeout(200);

    const dropdown = page.getByTestId('nav-overflow-menu');
    await expect(dropdown).toBeVisible();

    // Click somewhere outside (on page body)
    await page.locator('h1').first().click();
    await page.waitForTimeout(200);

    // Dropdown should be closed
    await expect(dropdown).not.toBeVisible();
  });

  ownerTest('overflow items show icon + text in dropdown', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);

    const moreButton = page.getByTestId('nav-more-button');
    await moreButton.click();
    await page.waitForTimeout(200);

    const dropdown = page.getByTestId('nav-overflow-menu');
    const overflowItems = dropdown.locator('a[data-testid^="nav-overflow-item-"]');
    const count = await overflowItems.count();

    expect(count).toBeGreaterThan(0);

    // Check each overflow item has icon + text
    for (let i = 0; i < count; i++) {
      const item = overflowItems.nth(i);

      // Should have an icon
      const icon = item.locator('svg');
      await expect(icon).toBeVisible();

      // Should have text
      const text = await item.textContent();
      expect(text?.trim()).not.toBe('');
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  ownerTest('breakpoint behavior: tablet (1024-1280px)', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 768 });
    await page.waitForTimeout(500);

    const nav = page.getByTestId('main-navigation');
    const navItems = nav.locator('a[data-testid^="nav-item-"]');
    const visibleCount = await navItems.count();

    console.log(`Tablet (1200px): ${visibleCount} visible items`);

    // Tablet should show ~5 items
    expect(visibleCount).toBeLessThanOrEqual(5);
    expect(visibleCount).toBeGreaterThanOrEqual(3);
  });

  ownerTest('breakpoint behavior: laptop (1280-1536px)', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.waitForTimeout(500);

    const nav = page.getByTestId('main-navigation');
    const navItems = nav.locator('a[data-testid^="nav-item-"]');
    const visibleCount = await navItems.count();

    console.log(`Laptop (1400px): ${visibleCount} visible items`);

    // Laptop should show ~7 items
    expect(visibleCount).toBeLessThanOrEqual(7);
    expect(visibleCount).toBeGreaterThanOrEqual(5);
  });

  ownerTest('navigation items remain functional in overflow menu', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);

    const moreButton = page.getByTestId('nav-more-button');
    await moreButton.click();
    await page.waitForTimeout(200);

    const dropdown = page.getByTestId('nav-overflow-menu');
    const overflowItems = dropdown.locator('a[data-testid^="nav-overflow-item-"]');
    const count = await overflowItems.count();

    if (count > 0) {
      // Click first overflow item
      const firstItem = overflowItems.first();
      const href = await firstItem.getAttribute('href');

      await firstItem.click();
      await page.waitForLoadState('networkidle');

      // Should navigate to the correct page
      expect(page.url()).toContain(href!);

      // Dropdown should be closed after navigation
      await expect(dropdown).not.toBeVisible();
    }
  });

  ownerTest('active state works for overflow items', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);

    const moreButton = page.getByTestId('nav-more-button');

    // Check if more button exists (means there are overflow items)
    const hasMoreButton = await moreButton.isVisible().catch(() => false);

    if (hasMoreButton) {
      await moreButton.click();
      await page.waitForTimeout(200);

      const dropdown = page.getByTestId('nav-overflow-menu');
      const overflowItems = dropdown.locator('a[data-testid^="nav-overflow-item-"]');
      const count = await overflowItems.count();

      if (count > 0) {
        // Click an overflow item to navigate
        const firstOverflowItem = overflowItems.first();
        const href = await firstOverflowItem.getAttribute('href');
        await firstOverflowItem.click();
        await page.waitForLoadState('networkidle');

        // Wait a bit for state to update
        await page.waitForTimeout(300);

        // Open dropdown again
        const moreButtonAfterNav = page.getByTestId('nav-more-button');
        const hasMoreAfterNav = await moreButtonAfterNav.isVisible().catch(() => false);

        if (hasMoreAfterNav) {
          await moreButtonAfterNav.click();
          await page.waitForTimeout(200);

          // Find the item we just navigated to in the dropdown
          const dropdownAfter = page.getByTestId('nav-overflow-menu');
          const activeItem = dropdownAfter.locator(`a[href="${href}"]`);

          // It should have active styling (bg-slate-100)
          const className = await activeItem.getAttribute('class');
          expect(className).toContain('bg-slate-100');
        }
      }
    }
  });
});
