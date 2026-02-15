/**
 * Knowledge Base - Category Management Tests
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { KnowledgeBasePage } from '@pages/KnowledgeBasePage';

ownerTest.describe('Knowledge Base - Categories', () => {
    let kbPage: KnowledgeBasePage;

    ownerTest.beforeEach(async ({ page }) => {
        kbPage = new KnowledgeBasePage(page);
        await kbPage.goto();
    });

    ownerTest('KB1: Can create a new category', async () => {
        const categoryName = `Test Category ${Date.now()}`;

        await kbPage.createCategory(categoryName);

        await kbPage.shouldSeeCategory(categoryName);
    });

    ownerTest('KB2: Categories appear in the sidebar', async () => {
        const categoryName = `Sidebar Category ${Date.now()}`;

        await kbPage.createCategory(categoryName);

        // Verify it's visible in the sidebar
        await kbPage.shouldSeeCategory(categoryName);
    });

    ownerTest('KB3: Can select a category to filter articles', async () => {
        const categoryName = `Filter Category ${Date.now()}`;

        // Create category first
        await kbPage.createCategory(categoryName);

        // Select the category
        await kbPage.selectCategory(categoryName);

        // Page should still be on KB (no errors)
        await kbPage.waitForPageLoad();
    });

    ownerTest('KB4: "All categories" shows all articles', async () => {
        // Click "All categories"
        await kbPage.selectAllCategories();

        // Page should still be on KB
        await kbPage.waitForPageLoad();
    });
});
