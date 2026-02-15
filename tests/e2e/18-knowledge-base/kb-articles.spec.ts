/**
 * Knowledge Base - Article Management Tests
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { KnowledgeBasePage } from '@pages/KnowledgeBasePage';

ownerTest.describe('Knowledge Base - Articles', () => {
    let kbPage: KnowledgeBasePage;

    ownerTest.beforeEach(async ({ page }) => {
        kbPage = new KnowledgeBasePage(page);
        await kbPage.goto();
        // Ensure a category is selected so "New Article" button is visible
        await kbPage.selectCategory('Documents');
    });

    ownerTest.describe('Article Creation', () => {
        ownerTest('KB5: Can create article with title only (minimal)', async () => {
            const articleTitle = `Minimal Article ${Date.now()}`;

            await kbPage.createArticle({
                title: articleTitle,
            });

            await kbPage.shouldSeeArticle(articleTitle);
        });

        ownerTest('KB6: Can create article with title and content', async () => {
            const articleTitle = `Full Article ${Date.now()}`;
            const articleContent = 'This is the article content with some text.';

            await kbPage.createArticle({
                title: articleTitle,
                content: articleContent,
            });

            await kbPage.shouldSeeArticle(articleTitle);
        });

        ownerTest('KB7: Article title is mandatory (validation)', async ({ page }) => {
            await kbPage.openNewArticle();

            // Try to save without filling title
            await kbPage.saveArticle({ force: true, timeout: 2000 }).catch(() => { });

            // Should still be on the editor page (not redirected)
            const titleInput = page.locator('input[placeholder*="Title"], input[name="title"]').first();
            const isVisible = await titleInput.isVisible({ timeout: 2000 }).catch(() => false);
            expect(isVisible).toBe(true);
        });
    });

    ownerTest.describe('Article Status', () => {
        ownerTest('KB8: Can save article as Draft', async () => {
            const articleTitle = `Draft Article ${Date.now()}`;

            await kbPage.createArticle({
                title: articleTitle,
                status: 'Draft',
            });

            await kbPage.shouldSeeArticle(articleTitle);
        });

        ownerTest('KB9: Can save article as Published', async () => {
            const articleTitle = `Published Article ${Date.now()}`;

            await kbPage.createArticle({
                title: articleTitle,
                status: 'Published',
            });

            await kbPage.shouldSeeArticle(articleTitle);
        });

        ownerTest('KB10: Can change article status from Draft to Published', async ({ page }) => {
            const articleTitle = `Status Change Article ${Date.now()}`;

            // Create as Draft
            await kbPage.createArticle({
                title: articleTitle,
                status: 'Draft',
            });

            // Click on the article to edit
            await kbPage.clickArticle(articleTitle);
            await page.waitForTimeout(1000);

            // Change status to Published
            await kbPage.setArticleStatus('Published');
            await kbPage.saveArticle();

            // Should still see the article
            await kbPage.shouldSeeArticle(articleTitle);
        });
    });

    ownerTest.describe('Article List', () => {
        ownerTest('KB11: Articles appear in the list after creation', async () => {
            const articleTitle = `List Article ${Date.now()}`;

            await kbPage.createArticle({
                title: articleTitle,
            });

            // Verify it appears in the list
            await kbPage.shouldSeeArticle(articleTitle);
        });

        ownerTest('KB12: Can edit existing article', async ({ page }) => {
            const originalTitle = `Original Article ${Date.now()}`;
            const updatedContent = 'Updated content for the article.';

            // Create article
            await kbPage.createArticle({
                title: originalTitle,
            });

            // Click to edit
            await kbPage.clickArticle(originalTitle);
            await page.waitForTimeout(1000);

            // Update content
            await kbPage.fillArticleContent(updatedContent);
            await kbPage.saveArticle();

            // Should still see the article
            await kbPage.shouldSeeArticle(originalTitle);
        });
    });
});


