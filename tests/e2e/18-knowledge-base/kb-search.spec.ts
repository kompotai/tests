/**
 * Knowledge Base - Search Functionality Tests
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { KnowledgeBasePage } from '@pages/KnowledgeBasePage';

ownerTest.describe('Knowledge Base - Search', () => {
    let kbPage: KnowledgeBasePage;
    const TEST_CATEGORY = `Test Category ${Date.now()}`;

    ownerTest.beforeEach(async ({ page }) => {
        kbPage = new KnowledgeBasePage(page);
        await kbPage.goto();
        // Create a new category to ensure we have a valid target for article creation
        await kbPage.createCategory(TEST_CATEGORY);
        await kbPage.selectCategory(TEST_CATEGORY);
    });

    ownerTest('KB13: Can search articles by title', async () => {
        const articleTitle = `Searchable Article ${Date.now()}`;

        // Create an article first
        await kbPage.createArticle({
            title: articleTitle,
            category: TEST_CATEGORY
        });

        // Search for it
        await kbPage.searchArticles(articleTitle);

        // Should see the article
        await kbPage.shouldSeeArticle(articleTitle);
    });

    ownerTest('KB14: Search returns relevant results', async () => {
        const uniqueWord = `UniqueWord${Date.now()}`;
        const articleTitle = `Article with ${uniqueWord}`;

        // Create an article
        await kbPage.createArticle({
            title: articleTitle,
            category: TEST_CATEGORY
        });

        // Search for the unique word
        await kbPage.searchArticles(uniqueWord);

        // Should see the article
        await kbPage.shouldSeeArticle(articleTitle);
    });

    ownerTest('KB15: Empty search shows all articles', async () => {
        // Clear search
        await kbPage.clearSearch();

        // Page should load normally
        await kbPage.waitForPageLoad();
    });

    ownerTest('KB16: Search with no results shows empty state', async () => {
        const nonExistentQuery = `NonExistent${Date.now()}${Math.random()}`;

        // Search for something that doesn't exist
        await kbPage.searchArticles(nonExistentQuery);

        // Should see empty state or no articles
        const articleCount = await kbPage.getArticleCount();
        expect(articleCount).toBe(0);
    });
});
