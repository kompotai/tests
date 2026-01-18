import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Manage Workspaces Page Object Model for creating new workspaces/companies
 */
export class ManageWorkspacesPage extends BasePage {
    // Locators
    readonly createWorkspaceButton: Locator;
    readonly submitCreateWorkspaceButton: Locator;
    readonly workspaceNameInput: Locator;
    readonly workspaceIDInput: Locator;
    readonly adminEmailInput: Locator;
    readonly adminPasswordInput: Locator;
    readonly createdWorkspaceSuccessMessage: Locator;


    constructor(page: Page) {
        super(page);

        // Based on patterns in LoginPage, we assume similar placeholders or roles
        this.createWorkspaceButton = page.getByTestId('manage-workspaces-button-create');
        this.submitCreateWorkspaceButton = page.getByTestId('create-workspace-button-submit');
        this.workspaceNameInput = page.getByPlaceholder('My Company');
        this.workspaceIDInput = page.getByPlaceholder('myworkspace');
        this.adminEmailInput = page.getByPlaceholder('user@example.com')
        this.adminPasswordInput = page.getByPlaceholder('Password')
        this.createdWorkspaceSuccessMessage = page.getByText('Workspace Created!')
    }

    async goto(): Promise<void> {
        await super.goto('/manage');
        await this.waitForPageLoad();
    }


    async clickInitialCreateWorkspaceButton(): Promise<void> {
        await this.createWorkspaceButton.click();
    }

    async createNewWorkspace (companyName: string, workspaceID:string, adminEmail:string,adminPassword:string ): Promise<void> {
        await this.workspaceNameInput.fill(companyName);
        await this.workspaceIDInput.fill(workspaceID);
        await this.adminEmailInput.fill(adminEmail);
        await this.adminPasswordInput.fill(adminPassword);
        await this.submitCreateWorkspaceButton.click()
    }



}