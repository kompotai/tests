/**
 * Knowledge Base Selectors
 */

export const KBSelectors = {
    // Main heading
    heading: '[data-testid="kb-title"]',

    // Category sidebar
    sidebar: {
        newCategoryButton: '[data-testid="kb-new-category-btn"]',
        allCategories: '[data-testid="kb-tree-all"]',
        categoryItem: (name: string) => name === 'All categories' ? '[data-testid="kb-tree-all"]' : `[data-testid="kb-tree-node-${name.toLowerCase().replace(/\s+/g, '-')}"]`,
        categoryList: '[data-testid="kb-tree"]',
    },

    // Search
    searchInput: '[data-testid="kb-article-search"], input[placeholder*="Search"]',

    // Article list
    articleList: {
        container: '[data-testid="kb-article-list"], .kb-article-list',
        article: (title: string) => `text="${title}"`,
        articleRow: '[data-testid^="kb-article-item-"], .kb-article-list button, .kb-article-list a',
        emptyState: 'text="No articles found"',
    },

    // New Article button - appears after selecting a category
    newArticleButton: '[data-testid="kb-new-article-btn"], button:has-text("New Article")',

    // Article editor
    editor: {
        titleInput: '[data-testid="kb-editor-title"], input[placeholder*="Title"], input[name="title"]',
        contentEditor: '[data-testid="kb-editor-content"], .kb-editor, [contenteditable="true"]',
        statusDropdown: '[data-testid="kb-editor-status"], select',
        statusDraft: 'draft', // values
        statusPublished: 'published',
        saveButton: '[data-testid="kb-editor-save"], button:has-text("Save")',
        editButton: 'button:has-text("Edit Article")',
        backButton: 'button[aria-label*="back"], button:has-text("←")',
    },

    // Category dialog/form (SlideOver on right side)
    categoryDialog: {
        container: '[role="dialog"]',
        heading: 'h2:has-text("New Category")',
        nameInput: 'input:below(:text("Category name"))',
        descriptionTextarea: 'textarea:below(:text("Description"))',
        publicAccessCheckbox: 'input[type="checkbox"]:near(:text("Public access"))',
        // Role permissions - checkboxes in the access settings table
        managerCheckbox: 'tr:has-text("Manager") input[type="checkbox"]',
        technicianCheckbox: 'tr:has-text("Technician") input[type="checkbox"]',
        accountantCheckbox: 'tr:has-text("Accountant") input[type="checkbox"]',
        saveButton: 'button:has-text("Save")',
        cancelButton: 'button:has-text("Cancel")',
    },

    // Common
    spinner: '[data-testid="spinner"], .spinner, [role="progressbar"]',
};
