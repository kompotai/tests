/**
 * Knowledge Base Exploration Test
 * 
 * This test navigates to the KB page and captures its structure
 * to help us understand what tests we need to write.
 */

import { ownerTest } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('Knowledge Base Exploration', () => {
    ownerTest('explore KB page structure', async ({ page }) => {
        // Navigate to KB page
        await page.goto(`/ws/${WORKSPACE_ID}/kb`);
        await page.waitForLoadState('networkidle');
        await page.locator('[data-testid="kb-title"], h1').first().waitFor({ state: 'visible', timeout: 10000 });

        // Log page title
        const title = await page.title();
        console.log('Page title:', title);

        // Log main heading
        const heading = await page.locator('h1').first().textContent().catch(() => 'No h1 found');
        console.log('Main heading:', heading);

        // Check for common UI elements
        const hasCreateButton = await page.locator('[data-testid*="create"], button:has-text("Create"), button:has-text("New")').first().isVisible({ timeout: 2000 }).catch(() => false);
        console.log('Has create button:', hasCreateButton);

        const hasTable = await page.locator('table, [role="table"]').first().isVisible({ timeout: 2000 }).catch(() => false);
        console.log('Has table:', hasTable);

        const hasSidebar = await page.locator('[data-testid*="sidebar"], aside, nav').first().isVisible({ timeout: 2000 }).catch(() => false);
        console.log('Has sidebar:', hasSidebar);

        /*
                // Click + New Category (app may open dialog or SlideOver)
                await page.locator('[data-testid="kb-new-category-btn"]').click();
                await Promise.race([
                    page.locator('[role="dialog"]').first().waitFor({ state: 'visible', timeout: 5000 }),
                    page.getByRole('heading', { name: /new category/i }).waitFor({ state: 'visible', timeout: 5000 }),
                ]).catch(() => {});
        
                // Try to fill the form (container may be dialog or SlideOver)
                const panelHeading = page.getByRole('heading', { name: /new category/i });
                const hasDialog = await page.locator('[role="dialog"]').first().isVisible({ timeout: 500 }).catch(() => false);
                const dialog = hasDialog ? page.locator('[role="dialog"]').first() : page.locator('form, [class*="slide"], aside').filter({ has: panelHeading }).first();
                const inputs = await dialog.locator('input').evaluateAll(elements =>
                    elements.map(el => ({
                        type: el.getAttribute('type'),
                        name: el.getAttribute('name'),
                        placeholder: el.getAttribute('placeholder'),
                        outerHTML: el.outerHTML.substring(0, 100)
                    }))
                );
                console.log('Dialog inputs:', inputs);
        
                const nameInput = dialog.locator('input').first();
                const categoryName = `Explore Category ${Date.now()}`;
                await nameInput.click();
                await page.keyboard.type(categoryName);
                console.log('Typed name into first input');
        
                const saveBtn = dialog.locator('button:has-text("Save")');
                const isEnabled = await saveBtn.isEnabled();
                console.log('Save button enabled after typing:', isEnabled);
        
                await page.screenshot({ path: 'test-results/kb-form-filled-typed.png' });
        */


        // Deep audit of all buttons
        console.log('Auditing all buttons on page...');
        const buttons = await page.locator('button').evaluateAll(elements =>
            elements.map(el => ({
                text: el.textContent?.trim(),
                id: el.getAttribute('id'),
                testId: el.getAttribute('data-testid'),
                title: el.getAttribute('title'),
                ariaLabel: el.getAttribute('aria-label'),
                rect: el.getBoundingClientRect(),
                isVisible: (el as HTMLElement).offsetParent !== null || el.getClientRects().length > 0,
                innerHTML: el.innerHTML.substring(0, 100)
            }))
        );
        console.log('Found buttons:', JSON.stringify(buttons, null, 2));

        // Audit the area around search articles
        const searchInput = page.locator('[data-testid="kb-article-search"], input[placeholder*="Search"]').first();
        if (await searchInput.isVisible()) {
            const rect = await searchInput.boundingBox();
            console.log('Search input bounding box:', rect);
            if (rect) {
                // Look for buttons near the search input (within 100px radius)
                const nearbyButtons = buttons.filter(b =>
                    Math.abs(b.rect.y - rect.y) < 50 &&
                    Math.abs(b.rect.x - (rect.x + rect.width)) < 150
                );
                console.log('Buttons near search input:', nearbyButtons);
            }
        }

        // Check the global "+" button menu if it exists
        const globalPlus = page.locator('header button:has(svg), .nav-plus, [aria-label*="create"], [aria-label*="add"]').first();
        if (await globalPlus.isVisible()) {
            console.log('Global + button found, clicking to see menu...');
            await globalPlus.click();
            await page.locator('[role="menuitem"], [role="option"]').first().waitFor({ state: 'visible', timeout: 3000 }).catch(() => { });
            const menuItems = await page.locator('[role="menuitem"], [role="option"]').evaluateAll(els => els.map(el => el.textContent?.trim()));
            console.log('Global + menu items:', menuItems);
            await page.screenshot({ path: 'kb-global-plus-menu.png' });
            await page.keyboard.press('Escape');
        }

        await page.screenshot({ path: 'kb-deep-audit.png', fullPage: true });

        // Check Command Palette (Ctrl+K)
        console.log('Triggering Command Palette (Ctrl+K)...');
        await page.keyboard.press('Control+K');
        await page.locator('[role="menuitem"], [role="option"]').first().waitFor({ state: 'visible', timeout: 3000 }).catch(() => { });
        const paletteItems = await page.locator('[role="menuitem"], [role="option"], button').evaluateAll(elements =>
            elements.map(el => el.textContent?.trim()).filter(text => text && text.length > 0)
        );
        console.log('Command Palette items:', paletteItems);
        await page.screenshot({ path: 'kb-command-palette-debug.png' });

        // Final screenshot of the whole page with large resolution
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.screenshot({ path: 'kb-full-page-debug.png', fullPage: true });
    });
});
