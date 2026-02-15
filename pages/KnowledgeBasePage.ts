/**
 * Knowledge Base Page Object
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Selectors } from './selectors';
import { WORKSPACE_ID } from '@fixtures/users';

export interface ArticleData {
    title: string;
    content?: string;
    status?: 'Draft' | 'Published';
    category?: string;
}

export class KnowledgeBasePage extends BasePage {
    get path() { return `/ws/${WORKSPACE_ID}/kb`; }

    private get selectors() {
        return Selectors.kb;
    }

    // ============================================
    // Navigation & View
    // ============================================

    async waitForPageLoad(): Promise<void> {
        await super.waitForPageLoad();
        // Wait for page-specific element (heading or new article button)
        await this.page.locator(this.selectors.heading).first()
            .waitFor({ state: 'visible', timeout: 10000 });
    }

    // ============================================
    // Category Management
    // ============================================

    async createCategory(
        name: string,
        options?: {
            description?: string;
            roles?: ('Manager' | 'Technician' | 'Accountant')[];
        }
    ): Promise<void> {
        await this.page.locator(this.selectors.sidebar.newCategoryButton).click();

        // Wait for dialog/panel
        const dialogSelectors = this.selectors.categoryDialog;
        const panelHeading = this.page.locator(dialogSelectors.heading);
        await panelHeading.waitFor({ state: 'visible', timeout: 10000 });

        // Find container (dialog or side panel)
        // Relaxed selector strategy: assume properly labelled inputs are unique enough in this context
        const container = this.page.locator('body');

        // Fill category name
        const nameInput = container.locator(dialogSelectors.nameInput).first();
        await nameInput.waitFor({ state: 'visible', timeout: 10000 });
        await nameInput.click();
        await this.page.keyboard.type(name);
        await this.wait(200);

        // Fill description if provided
        if (options?.description) {
            const descInput = container.locator(dialogSelectors.descriptionTextarea).first();
            if (await descInput.isVisible({ timeout: 1000 })) {
                await descInput.click();
                await this.page.keyboard.type(options.description);
                await this.wait(200);
            }
        }

        // Check role permissions
        if (options?.roles && options.roles.length > 0) {
            for (const role of options.roles) {
                // Map role to specific checkbox selector if available, or dynamic
                let checkbox = container.locator(`tr:has-text("${role}") input[type="checkbox"]`).first();
                if (role === 'Manager' && dialogSelectors.managerCheckbox) checkbox = container.locator(dialogSelectors.managerCheckbox);
                if (role === 'Technician' && dialogSelectors.technicianCheckbox) checkbox = container.locator(dialogSelectors.technicianCheckbox);
                if (role === 'Accountant' && dialogSelectors.accountantCheckbox) checkbox = container.locator(dialogSelectors.accountantCheckbox);

                if (await checkbox.isVisible({ timeout: 500 })) {
                    await checkbox.check();
                    await this.wait(200);
                }
            }
        }

        // Submit
        const saveButton = container.locator(dialogSelectors.saveButton);
        await expect(saveButton).toBeEnabled({ timeout: 5000 });
        await saveButton.click();
        await this.waitForSpinner();
        await this.wait(1000);
    }

    async selectCategory(name: string): Promise<void> {
        const selector = this.selectors.sidebar.categoryItem(name);
        const item = this.page.locator(selector).first();

        if (await item.isVisible({ timeout: 2000 })) {
            await item.click();
        } else {
            // Fallback: search by text
            console.log(`Category item with selector ${selector} not found, trying text search for "${name}"`);
            const textItem = this.page.locator('button, li, a').filter({ hasText: new RegExp(`^${name}$`, 'i') }).first();
            await textItem.click();
        }
        await this.wait(500);
    }

    async selectAllCategories(): Promise<void> {
        await this.page.locator(this.selectors.sidebar.allCategories).first().click();
        await this.wait(500);
    }

    // ============================================
    // Article Management
    // ============================================

    async openNewArticle(): Promise<void> {
        // Dismiss any open dialog (e.g. New Category) so it doesn't intercept clicks
        const dialog = this.page.locator('[role="dialog"]').first();
        if (await dialog.isVisible({ timeout: 500 }).catch(() => false)) {
            await this.page.keyboard.press('Escape');
            await dialog.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => { });
        }

        // Mode 1: KB-specific button (Updated selector)
        const newBtn = this.page.locator(this.selectors.newArticleButton).first();
        if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log('Found New Article button, clicking...');
            await newBtn.click();
            await this.page.locator(this.selectors.editor.titleInput).waitFor({ state: 'visible', timeout: 5000 }).catch(() => { });
            if (await this.page.locator(this.selectors.editor.titleInput).isVisible({ timeout: 1000 }).catch(() => false)) return;
        }

        // Mode 2: Global Quick Create
        console.log('Attempting openNewArticle Mode 2: Global Quick Create');
        let quickCreate = this.page.locator('[data-testid="quick-create-button"]').first();
        if (!(await quickCreate.isVisible().catch(() => false))) {
            quickCreate = this.page.getByRole('button', { name: 'Quick Create' }).first();
        }

        if (await quickCreate.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log('Quick Create button found, clicking...');
            await quickCreate.click({ force: true });

            // Wait for menu
            const menuLink = this.page.locator('[role="menuitem"]:has-text("Article"), [role="option"]:has-text("Article"), a:has-text("Article"), li:has-text("Article")').first();
            await menuLink.waitFor({ state: 'visible', timeout: 5000 }).catch(() => console.log('Quick Create menu item not found'));

            if (await menuLink.isVisible({ timeout: 1000 }).catch(() => false)) {
                console.log('Menu item found, clicking...');
                await menuLink.click();
                await this.page.locator(this.selectors.editor.titleInput).waitFor({ state: 'visible', timeout: 10000 }).catch(() => { });
                if (await this.page.locator(this.selectors.editor.titleInput).isVisible({ timeout: 1000 }).catch(() => false)) return;
            }
            // Close menu if failed
            await this.page.keyboard.press('Escape');
        }

        throw new Error('Could not find or open New Article editor after trying multiple entry points and waiting for rendering');
    }

    async fillArticleForm(data: Partial<ArticleData>): Promise<void> {
        // Use click + type for reliability
        if (data.title !== undefined && data.title !== '') {
            const titleInput = this.page.locator(this.selectors.editor.titleInput).first();
            await titleInput.click({ clickCount: 3 }); // Select all
            await this.page.keyboard.press('Backspace');
            await this.page.keyboard.type(data.title);
            await this.wait(200);
        }

        if (data.content !== undefined) {
            const contentEditor = this.page.locator(this.selectors.editor.contentEditor).first();
            await contentEditor.click();
            await this.page.keyboard.press('Control+A');
            await this.page.keyboard.press('Backspace');
            await this.page.keyboard.type(data.content);
            await this.wait(200);
        }

        if (data.status) {
            const dropdown = this.page.locator(this.selectors.editor.statusDropdown).first();
            // Use selectOption for native <select>
            const value = data.status === 'Draft' ? this.selectors.editor.statusDraft : this.selectors.editor.statusPublished;
            await dropdown.selectOption({ label: data.status }).catch(async () => {
                await dropdown.selectOption({ value }).catch(async () => {
                    // Fallback to manual click if it's a custom dropdown
                    await dropdown.click();
                    await this.page.locator(`[role="option"]:has-text("${data.status}"), li:has-text("${data.status}"), button:has-text("${data.status}")`).first().click();
                });
            });
            await this.wait(200);
        }
    }

    async saveArticle(options?: { force?: boolean, timeout?: number }): Promise<void> {
        await this.page.locator(this.selectors.editor.saveButton).click(options);
        if (!options?.force) {
            await this.waitForSpinner();
            await this.wait(1000);
        }
    }

    async fillArticleTitle(title: string): Promise<void> {
        await this.fillArticleForm({ title });
    }

    async fillArticleContent(content: string): Promise<void> {
        await this.fillArticleForm({ title: '', content });
    }

    async setArticleStatus(status: 'Draft' | 'Published'): Promise<void> {
        await this.fillArticleForm({ title: '', status });
    }

    async createArticle(data: ArticleData): Promise<void> {
        // Default to Documents category if none provided, to ensure "New Article" is visible
        await this.selectCategory(data.category || 'Documents');
        await this.openNewArticle();
        await this.fillArticleForm(data);
        await this.saveArticle();

        // Wait for redirect back to list
        await this.page.waitForURL(/\/kb$/, { timeout: 10000 }).catch(() => { });
        await this.wait(500);
    }

    async clickArticle(title: string): Promise<void> {
        await this.page.locator(this.selectors.articleList.article(title)).first().click();

        // Wait for potential navigation to View Mode
        const editBtn = this.page.locator(this.selectors.editor.editButton).first();
        const editorTitle = this.page.locator(this.selectors.editor.titleInput).first();

        // Race between entering View Mode (Edit button) or Edit Mode (Title input)
        const result = await Promise.race([
            editBtn.waitFor({ state: 'visible', timeout: 5000 }).then(() => 'view'),
            editorTitle.waitFor({ state: 'visible', timeout: 5000 }).then(() => 'edit'),
        ]).catch(() => 'unknown');

        if (result === 'view') {
            console.log('Opened article in View Mode, clicking Edit Article...');
            await editBtn.click();
            await editorTitle.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { });
        } else if (result === 'edit') {
            console.log('Opened article directly in Edit Mode');
        }
    }

    // ============================================
    // Search
    // ============================================

    async searchArticles(query: string): Promise<void> {
        const searchInput = this.page.locator(this.selectors.searchInput).first();
        await searchInput.fill(query);
        await this.wait(500);
        // Wait for search results to update
        await this.page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => { });
    }

    async clearSearch(): Promise<void> {
        const searchInput = this.page.locator(this.selectors.searchInput).first();
        await searchInput.clear();
        await this.wait(500);
    }

    // ============================================
    // Assertions
    // ============================================

    async shouldSeeArticle(title: string): Promise<void> {
        await expect(this.page.locator(this.selectors.articleList.article(title)).first())
            .toBeVisible({ timeout: 10000 });
    }

    async shouldNotSeeArticle(title: string): Promise<void> {
        await expect(this.page.locator(this.selectors.articleList.article(title)).first())
            .not.toBeVisible({ timeout: 5000 });
    }

    async shouldSeeCategory(name: string): Promise<void> {
        await expect(this.page.locator(this.selectors.sidebar.categoryItem(name)).first())
            .toBeVisible({ timeout: 10000 });
    }

    async shouldSeeEmptyState(): Promise<void> {
        await expect(this.page.locator(this.selectors.articleList.emptyState).first())
            .toBeVisible({ timeout: 5000 });
    }

    async getArticleCount(): Promise<number> {
        return await this.page.locator(this.selectors.articleList.articleRow).count();
    }

    async shouldHaveArticleCount(count: number): Promise<void> {
        const actualCount = await this.getArticleCount();
        expect(actualCount).toBe(count);
    }
}
