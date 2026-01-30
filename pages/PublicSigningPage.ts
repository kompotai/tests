/**
 * Public Signing Page Object
 *
 * Handles the public signing workflow for agreements.
 * URL format: /public/{wsid}/agreement/sign/{token}
 */

import { Page, expect } from '@playwright/test';

export interface SignerIdentity {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export class PublicSigningPage {
  constructor(readonly page: Page) {}

  // ============================================
  // Navigation
  // ============================================

  async goto(signingUrl: string): Promise<void> {
    await this.page.goto(signingUrl);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForStep(step: 'code' | 'identity' | 'fields' | 'complete' | 'error'): Promise<void> {
    switch (step) {
      case 'code':
        // Look for verification code input
        await this.page.locator('input[placeholder*="code"]').waitFor({ state: 'visible', timeout: 15000 });
        break;
      case 'identity':
        // Look for identity form
        await this.page.locator('input[placeholder*="John"], label:has-text("First Name")').first().waitFor({ state: 'visible', timeout: 15000 });
        break;
      case 'fields':
        // Look for document signing view with PDF canvas
        await this.page.locator('canvas, [data-testid="document-preview"]').first().waitFor({ state: 'visible', timeout: 30000 });
        break;
      case 'complete':
        // Look for completion message
        await this.page.locator('text=/Agreement Signed|Thank you|successfully signed/i').first().waitFor({ state: 'visible', timeout: 15000 });
        break;
      case 'error':
        // Look for error message
        await this.page.locator('text=/Error|not found|expired/i').first().waitFor({ state: 'visible', timeout: 10000 });
        break;
    }
  }

  // ============================================
  // Code Verification Step
  // ============================================

  async enterVerificationCode(code: string): Promise<void> {
    const codeInput = this.page.locator('input[placeholder*="code"], input[maxlength="6"]');
    await codeInput.fill(code);
    console.log(`[PublicSigningPage] Entered verification code: ${code}`);
  }

  async submitVerificationCode(): Promise<void> {
    // Click continue button
    const continueBtn = this.page.locator('button:has-text("Continue"), button[type="submit"]').first();
    await continueBtn.click();
    // Wait for navigation to next step
    await this.page.waitForTimeout(2000);
  }

  async verifyCodeAndContinue(code: string): Promise<void> {
    await this.enterVerificationCode(code);
    await this.submitVerificationCode();
    // Wait for identity step
    await this.waitForStep('identity');
    console.log('[PublicSigningPage] Code verified, moved to identity step');
  }

  // ============================================
  // Identity Verification Step
  // ============================================

  async fillIdentityForm(identity: SignerIdentity): Promise<void> {
    // First name
    const firstNameInput = this.page.locator('input[placeholder*="John"], input[name="firstName"]').first();
    await firstNameInput.fill(identity.firstName);

    // Last name
    const lastNameInput = this.page.locator('input[placeholder*="Doe"], input[name="lastName"]').first();
    await lastNameInput.fill(identity.lastName);

    // Email
    const emailInput = this.page.locator('input[type="email"], input[placeholder*="email"]').first();
    await emailInput.fill(identity.email);

    // Phone
    const phoneInput = this.page.locator('input[type="tel"], input[placeholder*="phone"], [data-testid="phone-input"] input').first();
    await phoneInput.fill(identity.phone);

    console.log(`[PublicSigningPage] Filled identity: ${identity.firstName} ${identity.lastName}`);
  }

  async agreeToSignElectronically(): Promise<void> {
    // Find and check the agreement checkbox
    const checkbox = this.page.locator('input[type="checkbox"]').first();
    if (!(await checkbox.isChecked())) {
      await checkbox.check();
    }
    console.log('[PublicSigningPage] Agreed to sign electronically');
  }

  async submitIdentity(): Promise<void> {
    const continueBtn = this.page.locator('button:has-text("Continue to Document"), button[type="submit"]').first();
    await continueBtn.click();
    // Wait for fields step
    await this.page.waitForTimeout(3000);
  }

  async verifyIdentityAndContinue(identity: SignerIdentity): Promise<void> {
    await this.fillIdentityForm(identity);
    await this.agreeToSignElectronically();
    await this.submitIdentity();
    // Wait for fields signing step
    await this.waitForStep('fields');
    console.log('[PublicSigningPage] Identity verified, moved to fields step');
  }

  // ============================================
  // Fields Signing Step
  // ============================================

  async waitForPdfToLoad(): Promise<boolean> {
    try {
      const canvas = this.page.locator('canvas').first();
      await canvas.waitFor({ state: 'visible', timeout: 30000 });
      // Wait a bit for rendering
      await this.page.waitForTimeout(2000);
      return true;
    } catch {
      return false;
    }
  }

  async getFieldsCount(): Promise<number> {
    // Count visible field inputs/overlays on the page
    const inputs = await this.page.locator('input[style*="position: absolute"], div[style*="position: absolute"][class*="border"]').count();
    return inputs;
  }

  async getSignatureFieldsCount(): Promise<number> {
    // Fields that have "Click to sign" or similar
    const signatureFields = await this.page.locator('div:has-text("Click to sign"), div:has-text("add initials")').count();
    return signatureFields;
  }

  async clickSignatureField(index: number = 0): Promise<void> {
    const signatureFields = this.page.locator('div:has-text("Click to sign"), div:has-text("add initials")');
    await signatureFields.nth(index).click();
    // Wait for signature modal - use separate locators
    await this.page.locator('.fixed.inset-0, [class*="fixed"][class*="inset-0"]').or(this.page.locator('div:has(canvas)')).or(this.page.getByText(/Draw|Type/i)).first().waitFor({ state: 'visible', timeout: 5000 });
    console.log(`[PublicSigningPage] Opened signature modal for field ${index}`);
  }

  async drawSignature(): Promise<void> {
    // Find signature canvas in modal
    const canvas = this.page.locator('.fixed canvas, [class*="modal"] canvas').first();
    await canvas.waitFor({ state: 'visible', timeout: 5000 });

    const box = await canvas.boundingBox();
    if (box) {
      // Draw a simple signature line
      await this.page.mouse.move(box.x + 20, box.y + box.height / 2);
      await this.page.mouse.down();
      await this.page.mouse.move(box.x + box.width - 20, box.y + box.height / 2, { steps: 10 });
      await this.page.mouse.up();
    }
    console.log('[PublicSigningPage] Drew signature');
  }

  async saveSignature(): Promise<void> {
    // Click the save button in the modal
    const saveBtn = this.page.locator('button:has-text("Save Signature"), button:has-text("Save Initials"), button:has-text("Save")').first();
    await saveBtn.click({ timeout: 5000 });
    // Wait for modal to close
    await this.page.locator('.fixed.inset-0.bg-black').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {
      console.log('[PublicSigningPage] Warning: Modal may not have closed');
    });
    await this.page.waitForTimeout(300);
    console.log('[PublicSigningPage] Saved signature');
  }

  async signField(index: number = 0): Promise<void> {
    await this.clickSignatureField(index);
    await this.drawSignature();
    await this.saveSignature();
  }

  async fillTextField(fieldIndex: number, value: string): Promise<void> {
    const textInputs = this.page.locator('input[type="text"][style*="position: absolute"], input[style*="position: absolute"]:not([type="date"])');
    await textInputs.nth(fieldIndex).fill(value);
    console.log(`[PublicSigningPage] Filled text field ${fieldIndex} with: ${value}`);
  }

  async completeAllRequiredFields(): Promise<void> {
    // Find all signature/initials fields (combined)
    const signatureFields = this.page.locator('div:has-text("Click to sign")');
    const initialsFields = this.page.locator('div:has-text("add initials")');

    const signatureCount = await signatureFields.count();
    const initialsCount = await initialsFields.count();
    console.log(`[PublicSigningPage] Found ${signatureCount} signature fields, ${initialsCount} initials fields`);

    // Sign each signature field
    for (let i = 0; i < signatureCount; i++) {
      try {
        await signatureFields.nth(i).click({ timeout: 5000 });
        await this.page.waitForTimeout(500);
        // Check if modal opened
        const modalVisible = await this.page.locator('.fixed canvas, [class*="modal"] canvas, [role="dialog"] canvas').first().isVisible().catch(() => false);
        if (modalVisible) {
          await this.drawSignature();
          await this.saveSignature();
          console.log(`[PublicSigningPage] Signed signature field ${i + 1}/${signatureCount}`);
        } else {
          console.log(`[PublicSigningPage] Warning: Modal not visible for signature field ${i}`);
        }
      } catch (e) {
        console.log(`[PublicSigningPage] Could not sign field ${i}: ${e}`);
      }
    }

    // Sign each initials field
    for (let i = 0; i < initialsCount; i++) {
      try {
        await initialsFields.nth(i).click({ timeout: 5000 });
        await this.page.waitForTimeout(500);
        const modalVisible = await this.page.locator('.fixed canvas, [class*="modal"] canvas, [role="dialog"] canvas').first().isVisible().catch(() => false);
        if (modalVisible) {
          await this.drawSignature();
          await this.saveSignature();
          console.log(`[PublicSigningPage] Signed initials field ${i + 1}/${initialsCount}`);
        } else {
          console.log(`[PublicSigningPage] Warning: Modal not visible for initials field ${i}`);
        }
      } catch (e) {
        console.log(`[PublicSigningPage] Could not sign initials field ${i}: ${e}`);
      }
    }
  }

  async submitSigning(): Promise<void> {
    const signBtn = this.page.locator('button:has-text("Complete Signing"), button:has-text("Sign"), button:has-text("Finish")').first();
    await signBtn.click();
    console.log('[PublicSigningPage] Clicked complete signing');
  }

  // ============================================
  // Document Header / Status Verification
  // ============================================

  async getDocumentTitle(): Promise<string> {
    const title = this.page.locator('header h1, h1').first();
    const text = await title.textContent();
    return text?.trim() || '';
  }

  async getRoleName(): Promise<string> {
    // "Signing as: Signatory 1" text
    const roleText = this.page.locator('text=/Signing as:/i').first();
    const text = await roleText.textContent();
    return text?.replace(/Signing as:\s*/i, '').trim() || '';
  }

  async getCurrentPage(): Promise<number> {
    // Page navigation buttons
    const activeBtn = this.page.locator('button[class*="bg-zinc-900"], button[class*="bg-zinc"]').filter({
      hasText: /^\d+$/
    }).first();
    const text = await activeBtn.textContent();
    return parseInt(text || '1');
  }

  async getTotalPages(): Promise<number> {
    const buttons = await this.page.locator('header button').filter({ hasText: /^\d+$/ }).count();
    return buttons || 1;
  }

  async goToPage(pageNumber: number): Promise<void> {
    const pageBtn = this.page.locator(`header button:has-text("${pageNumber}")`);
    if (await pageBtn.isVisible()) {
      await pageBtn.click();
      await this.page.waitForTimeout(1000);
    }
  }

  // ============================================
  // Pre-filled Field Verification
  // ============================================

  async getPrefilledFieldValue(fieldType: string): Promise<string> {
    // Look for field with specific type
    const field = this.page.locator(`input[data-field-type="${fieldType}"], [data-field-type="${fieldType}"] input`).first();
    if (await field.isVisible()) {
      return await field.inputValue();
    }
    return '';
  }

  async verifyContactFieldPrefilled(fieldName: string, expectedValue: string): Promise<boolean> {
    // Contact fields should be auto-filled
    const fieldLabels: Record<string, string[]> = {
      'contact.name': ['Contact Name'],
      'contact.email': ['Contact Email'],
      'contact.phone': ['Contact Phone'],
      'contact.company': ['Contact Company'],
      'contact.address': ['Contact Address'],
    };

    const labels = fieldLabels[fieldName] || [fieldName];

    for (const label of labels) {
      const field = this.page.locator(`[title="${label}"], [data-testid="${label}"], text=${expectedValue}`);
      if (await field.isVisible()) {
        return true;
      }
    }
    return false;
  }

  // ============================================
  // Complete Step Verification
  // ============================================

  async verifySigningComplete(): Promise<boolean> {
    try {
      await this.waitForStep('complete');
      return true;
    } catch {
      return false;
    }
  }

  async getCompletionMessage(): Promise<string> {
    const message = this.page.locator('h1, h2').filter({ hasText: /Signed|Complete|Thank/i }).first();
    const text = await message.textContent();
    return text?.trim() || '';
  }

  // ============================================
  // Error Handling
  // ============================================

  async getErrorMessage(): Promise<string | null> {
    try {
      const error = this.page.locator('[class*="bg-red"], text=/error|failed|invalid/i').first();
      const text = await error.textContent({ timeout: 2000 });
      return text?.trim() || null;
    } catch {
      return null;
    }
  }

  // ============================================
  // Screenshots
  // ============================================

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/${name}.png`, fullPage: true });
  }
}
