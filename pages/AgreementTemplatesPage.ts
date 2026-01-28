/**
 * Agreement Templates Page Object
 *
 * Handles template creation, editing, and field placement.
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Selectors } from './selectors';
import path from 'path';

export interface TemplateFieldData {
  type: string;
  label?: string;
  pageNumber?: number;
  x?: number;
  y?: number;
  required?: boolean;
}

// Mapping from human-readable field names to internal type names
// NOTE: Contact fields use dots (contact.name) which need to be converted to dashes for data-testid
const FIELD_TYPE_MAP: Record<string, string> = {
  'Signature': 'signature',
  'Initials': 'initials',
  'Creation Date': 'creationDate',
  'Date Signed': 'dateSigned',
  'Text': 'text',
  'Number': 'number',
  'Date': 'date',
  'Checkbox': 'checkbox',
  // Contact fields - UI uses dots but data-testid uses dashes
  'Contact Name': 'contact-name',
  'Contact Email': 'contact-email',
  'Contact Phone': 'contact-phone',
  'Contact Address': 'contact-address',
  'Contact Company': 'contact-company',
  'Full Name': 'fullName',
  'Email': 'email',
  'Company': 'company',
};

export interface TemplateData {
  name: string;
  type?: string;
  description?: string;
  pdfPath?: string; // Path to PDF file to upload during creation
}

export class AgreementTemplatesPage extends BasePage {
  readonly path = '/ws/agreements';

  private get selectors() {
    return Selectors.agreementTemplates;
  }

  // ============================================
  // Navigation
  // ============================================

  async goto(): Promise<void> {
    await this.page.goto(this.path);
    await this.waitForPageLoad();
    // Switch to Templates tab
    await this.switchToTemplatesTab();
  }

  async switchToTemplatesTab(): Promise<void> {
    const templatesTab = this.page.locator(Selectors.agreements.tabs.templates).first();
    await templatesTab.click();
    await this.wait(500);
  }

  async waitForPageLoad(): Promise<void> {
    await super.waitForPageLoad();
    await this.page.locator('h1').first().waitFor({ state: 'visible', timeout: 10000 });
  }

  // ============================================
  // Template CRUD
  // ============================================

  async openCreateForm(): Promise<void> {
    // Wait for button to be ready
    const createButton = this.page.locator(this.selectors.createButton);
    await createButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.wait(300);

    // Click and wait for form
    await createButton.click();

    // Wait for form to appear (SlideOver) with retry
    try {
      await this.page.locator(this.selectors.form.container).waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      // Retry click if form didn't appear
      console.log('[openCreateForm] Form not visible, retrying click...');
      await createButton.click({ force: true });
      await this.page.locator(this.selectors.form.container).waitFor({ state: 'visible', timeout: 10000 });
    }
    await this.wait(500);
  }

  async create(data: TemplateData): Promise<void> {
    await this.openCreateForm();
    await this.fillForm(data);
    await this.submitForm();
    // After creation, we're redirected to editor page
    // Wait for editor to load
    await this.page.waitForURL(/\/templates\/[a-f0-9]+\/edit/, { timeout: 10000 });

    // If PDF was uploaded, wait for PDF viewer to be ready
    if (data.pdfPath) {
      // Wait for loading spinner to disappear and PDF viewer to appear
      await this.waitForSpinner();
      await this.page.waitForSelector('[data-testid="pdf-viewer"], canvas', { timeout: 30000 }).catch(() => {
        // PDF viewer might not have data-testid, try alternative selectors
      });
      await this.wait(2000); // Give PDF extra time to render
    }
  }

  async createAndReturnToList(data: TemplateData): Promise<void> {
    await this.create(data);
    // Go back to templates list
    await this.goto();
  }

  async fillForm(data: TemplateData): Promise<void> {
    // Name - wait for input to be ready
    const nameInput = this.page.locator(this.selectors.form.name).first();
    await nameInput.waitFor({ state: 'visible', timeout: 15000 });
    await nameInput.fill(data.name);

    // Type
    if (data.type) {
      const typeSelect = this.page.locator(this.selectors.form.typeSelect).first();
      await typeSelect.selectOption(data.type);
    }

    // Description
    if (data.description) {
      const descInput = this.page.locator(this.selectors.form.description).first();
      await descInput.fill(data.description);
    }

    // Upload PDF if provided (during template creation)
    if (data.pdfPath) {
      const absolutePath = path.isAbsolute(data.pdfPath)
        ? data.pdfPath
        : path.join(process.cwd(), data.pdfPath);

      // The file input is hidden inside a label
      const fileInput = this.page.locator('input[type="file"][accept*="pdf"]').first();
      await fileInput.setInputFiles(absolutePath);

      // Wait for upload to complete (uploading indicator should disappear)
      await this.page.waitForSelector('text=Uploading', { state: 'hidden', timeout: 30000 }).catch(() => {
        // If "Uploading" text never appeared, the upload was quick
      });
      await this.wait(1000);
    }
  }

  async submitForm(): Promise<void> {
    await this.page.locator(this.selectors.form.submit).click();
    await this.waitForSpinner();
    await this.wait(1000);
  }

  async openEditPage(templateName: string): Promise<void> {
    const editButton = this.page.locator(this.selectors.rowEditButton(templateName)).first();
    await editButton.click();
    await this.page.waitForURL(/\/templates\/[a-f0-9]+\/edit/, { timeout: 10000 });
    await this.waitForPageLoad();
  }

  // Alias for openEditPage
  async openTemplate(templateName: string): Promise<void> {
    return this.openEditPage(templateName);
  }

  // ============================================
  // Editor - PDF Upload
  // ============================================

  async uploadPDF(filePath: string): Promise<void> {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);

    // Find file input
    const fileInput = this.page.locator(this.selectors.editor.fileInput).first();

    // Set file
    await fileInput.setInputFiles(absolutePath);
    await this.waitForSpinner();
    await this.wait(1000);
  }

  // ============================================
  // Editor - Roles/Signatories
  // ============================================

  async selectDocumentFields(): Promise<void> {
    const docFields = this.page.locator(this.selectors.editor.documentFields).first();
    await docFields.click();
    await this.wait(300);
  }

  async addSignatory(name?: string): Promise<void> {
    const addBtn = this.page.locator(this.selectors.editor.addSignatory).first();
    await addBtn.click();
    await this.wait(500);

    // If name provided, rename the signatory
    // (by default it will be "Signatory N")
  }

  async selectSignatory(name: string): Promise<void> {
    const signatory = this.page.locator(this.selectors.editor.signatoryItem(name)).first();
    await signatory.click();
    await this.wait(300);
  }

  // ============================================
  // Editor - Field Management
  // ============================================

  async addField(type: string): Promise<void> {
    // Click "Add Field" button to open dropdown
    const addFieldBtn = this.page.locator(this.selectors.editor.addFieldButton).first();
    await addFieldBtn.click();
    await this.wait(300);

    // Convert human-readable name to internal type if needed
    const internalType = FIELD_TYPE_MAP[type] || type.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '-');

    // Select field type using data-testid
    const typeOption = this.page.locator(`[data-testid="field-type-${internalType}"]`).first();
    await typeOption.click();
    await this.wait(500);
  }

  /**
   * Add a field and position it at specific coordinates.
   *
   * @param type - Field type (e.g., 'Signature', 'Contact Name')
   * @param targetX - Target X coordinate in editor units (0-595 for A4)
   * @param targetY - Target Y coordinate in editor units (0-842 for A4)
   * @param pageWidth - PDF page width in editor units (default 595 for A4)
   * @param pageHeight - PDF page height in editor units (default 842 for A4)
   *
   * Coordinates use top-left origin (same as browser/editor).
   * This method simulates realistic user drag-and-drop behavior.
   */
  async addFieldAtPosition(
    type: string,
    targetX: number,
    targetY: number,
    pageWidth = 595,
    pageHeight = 842
  ): Promise<void> {
    // First add the field (it will appear at default position 100,100)
    await this.addField(type);

    // Wait for field to be added and selected
    await this.wait(500);

    // Find the PDF viewer container (div that wraps the canvas)
    const pdfContainer = this.page.locator('.relative.mx-auto.shadow-lg').first();
    const containerBox = await pdfContainer.boundingBox();
    if (!containerBox) {
      throw new Error('Could not find PDF container');
    }

    // Calculate scale factor: screen pixels / editor units
    const scaleX = containerBox.width / pageWidth;
    const scaleY = containerBox.height / pageHeight;

    // Find all fields on the canvas - look for the selected field first
    const selectedField = pdfContainer.locator('.absolute.cursor-move.ring-2, .absolute.cursor-move[data-selected="true"]').first();
    let field = selectedField;

    // If no selected field found, fall back to last field
    if (!(await field.isVisible().catch(() => false))) {
      const fields = pdfContainer.locator('.absolute.cursor-move');
      const fieldCount = await fields.count();
      if (fieldCount === 0) {
        throw new Error('No fields found on canvas');
      }
      field = fields.last();
    }

    const fieldBox = await field.boundingBox();
    if (!fieldBox) {
      throw new Error('Could not get field bounding box');
    }

    // Current field position (top-left corner in screen coordinates)
    const currentScreenX = fieldBox.x;
    const currentScreenY = fieldBox.y;

    // Target position (top-left corner in screen coordinates)
    const targetScreenX = containerBox.x + (targetX * scaleX);
    const targetScreenY = containerBox.y + (targetY * scaleY);

    // Calculate where to drag FROM (center of field) and TO
    // We drag from field center, but want top-left to land at target
    const dragFromX = currentScreenX + fieldBox.width / 2;
    const dragFromY = currentScreenY + fieldBox.height / 2;

    // We want top-left at target, so drag target is offset by half field size
    const dragToX = targetScreenX + fieldBox.width / 2;
    const dragToY = targetScreenY + fieldBox.height / 2;

    // For small fields (like checkbox), use more precise movement
    const isSmallField = fieldBox.width < 30 || fieldBox.height < 30;
    const steps = isSmallField ? 25 : 15;

    await this.page.mouse.move(dragFromX, dragFromY);
    await this.wait(100);
    await this.page.mouse.down();
    await this.wait(100);

    // Move in small steps to simulate human movement
    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      const currentX = dragFromX + (dragToX - dragFromX) * progress;
      const currentY = dragFromY + (dragToY - dragFromY) * progress;
      await this.page.mouse.move(currentX, currentY);
      await this.wait(isSmallField ? 20 : 10);
    }

    // For small fields, do a final precise positioning
    if (isSmallField) {
      await this.page.mouse.move(dragToX, dragToY);
      await this.wait(50);
    }

    await this.page.mouse.up();
    await this.wait(300);
  }

  /**
   * Drag an existing field (by label) to a new position.
   *
   * @param label - Field label text
   * @param targetX - Target X coordinate in editor units
   * @param targetY - Target Y coordinate in editor units
   * @param pageWidth - PDF page width in editor units (default 595)
   * @param pageHeight - PDF page height in editor units (default 842)
   */
  async dragFieldToPosition(
    label: string,
    targetX: number,
    targetY: number,
    pageWidth = 595,
    pageHeight = 842
  ): Promise<void> {
    const pdfContainer = this.page.locator('.relative.mx-auto.shadow-lg').first();
    const containerBox = await pdfContainer.boundingBox();
    if (!containerBox) {
      throw new Error('Could not find PDF container');
    }

    const scaleX = containerBox.width / pageWidth;
    const scaleY = containerBox.height / pageHeight;

    const field = pdfContainer.locator(`.absolute.cursor-move:has-text("${label}")`).first();
    const fieldBox = await field.boundingBox();
    if (!fieldBox) {
      throw new Error(`Could not find field with label: ${label}`);
    }

    const targetScreenX = containerBox.x + (targetX * scaleX);
    const targetScreenY = containerBox.y + (targetY * scaleY);

    const dragFromX = fieldBox.x + fieldBox.width / 2;
    const dragFromY = fieldBox.y + fieldBox.height / 2;
    const dragToX = targetScreenX + fieldBox.width / 2;
    const dragToY = targetScreenY + fieldBox.height / 2;

    await this.page.mouse.move(dragFromX, dragFromY);
    await this.wait(50);
    await this.page.mouse.down();
    await this.wait(50);

    const steps = 15;
    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      await this.page.mouse.move(
        dragFromX + (dragToX - dragFromX) * progress,
        dragFromY + (dragToY - dragFromY) * progress
      );
      await this.wait(10);
    }

    await this.page.mouse.up();
    await this.wait(200);
  }

  async selectField(label: string): Promise<void> {
    const field = this.page.locator(this.selectors.editor.field(label)).first();
    await field.click();
    await this.wait(300);
  }

  async updateFieldLabel(newLabel: string): Promise<void> {
    const labelInput = this.page.locator(this.selectors.editor.fieldLabel).first();
    await labelInput.clear();
    await labelInput.fill(newLabel);
    await this.wait(200);
  }

  async deleteSelectedField(): Promise<void> {
    const deleteBtn = this.page.locator(this.selectors.editor.deleteField).first();
    await deleteBtn.click();
    await this.wait(300);
  }

  // ============================================
  // Editor - Field Properties
  // ============================================

  /**
   * Set the default value for a text or number field.
   * The field must be selected before calling this method.
   *
   * The Field Properties panel has this structure:
   * - Label input (first)
   * - Required checkbox
   * - Default Value input (second text input, under "Default Value" label)
   * - Size inputs (Width, Height)
   */
  async setFieldDefaultValue(value: string): Promise<void> {
    await this.wait(300);

    // The Field Properties panel is on the left side
    // Find the section with "Default Value" label and get the input inside it
    const fieldPropertiesPanel = this.page.locator('.space-y-4, [class*="field-properties"]').first();

    // Look for the Default Value section by finding the label text
    // The structure is: <div><label>Default Value</label><Input/></div>
    const defaultValueSection = this.page.locator('div:has(> label:text-matches("Default Value|Значение по умолчанию", "i"))').first();

    let input = defaultValueSection.locator('input').first();

    // If not found, try alternative approach - find by placeholder or position
    if (!(await input.isVisible().catch(() => false))) {
      // Default Value input typically has placeholder "0" for number or is the second input
      // after Label input but before Size inputs
      const allInputs = this.page.locator('.space-y-4 input[type="text"], .space-y-4 input[type="number"]');
      const count = await allInputs.count();

      // The inputs order is typically: Label (0), DefaultValue (1), Width (2), Height (3)
      // But Width/Height are in a grid, so DefaultValue should be at index 1
      if (count >= 2) {
        input = allInputs.nth(1);
      }
    }

    if (!(await input.isVisible().catch(() => false))) {
      console.log('[setFieldDefaultValue] Could not find default value input');
      return;
    }

    await input.fill(value);
    await this.wait(200);
    console.log(`[setFieldDefaultValue] Set default value to: ${value}`);
  }

  // ============================================
  // Editor - Signature Pad
  // ============================================

  /**
   * Draw a signature on the signature pad for a document signature/initials field.
   * The field must be selected and be a document field (not signatory field).
   *
   * The SignaturePad component has two modes:
   * 1. "Type" mode (default) - type text and select a font
   * 2. "Draw" mode - opens a modal with a canvas to draw
   *
   * This method uses "Type" mode for simplicity - types a name and it becomes a signature.
   */
  async drawSignature(): Promise<void> {
    await this.wait(300);

    // The SignaturePad should be visible in the Field Properties panel
    // for document signature/initials fields

    // First, check if we're in Type mode (default) or need to switch
    const typeButton = this.page.locator('button:has-text("Type"), button:has-text("Текст")').first();
    const isTypeModeActive = await typeButton.evaluate(
      (btn) => btn.classList.contains('bg-white') || btn.classList.contains('shadow-sm')
    ).catch(() => false);

    if (!isTypeModeActive) {
      // Click Type button to switch to type mode
      await typeButton.click();
      await this.wait(200);
    }

    // Find the signature text input (placeholder contains "Type" or "Введите")
    const signatureInput = this.page.locator('input[placeholder*="ype"], input[placeholder*="введите"], input[placeholder*="name"], input.text-center').first();

    if (await signatureInput.isVisible().catch(() => false)) {
      // Type a signature name
      await signatureInput.fill('John Smith');
      await this.wait(500); // Wait for signature to be generated

      // Select first font option for consistent look
      const fontButton = this.page.locator('button[style*="Dancing Script"], button[style*="cursive"]').first();
      if (await fontButton.isVisible().catch(() => false)) {
        await fontButton.click();
        await this.wait(300);
      }

      console.log('[drawSignature] Typed signature: John Smith');
    } else {
      console.log('[drawSignature] Could not find signature input, trying draw mode');

      // Try draw mode as fallback
      const drawButton = this.page.locator('button:has-text("Draw"), button:has-text("Рисовать")').first();
      if (await drawButton.isVisible().catch(() => false)) {
        await drawButton.click();
        await this.wait(500);

        // Wait for modal to appear
        const modalCanvas = this.page.locator('.fixed canvas.cursor-crosshair').first();
        if (await modalCanvas.isVisible().catch(() => false)) {
          const box = await modalCanvas.boundingBox();
          if (box) {
            console.log(`[drawSignature] Drawing on modal canvas at (${box.x}, ${box.y}) size ${box.width}x${box.height}`);

            // Draw a simple signature
            await this.page.mouse.move(box.x + 20, box.y + box.height / 2);
            await this.page.mouse.down();

            const points = [
              { x: 0.2, y: 0.3 },
              { x: 0.35, y: 0.7 },
              { x: 0.5, y: 0.4 },
              { x: 0.65, y: 0.6 },
              { x: 0.8, y: 0.5 },
            ];

            for (const point of points) {
              await this.page.mouse.move(
                box.x + box.width * point.x,
                box.y + box.height * point.y
              );
              await this.wait(30);
            }

            await this.page.mouse.up();
            await this.wait(200);

            // Click Apply button
            const applyBtn = this.page.locator('button:has-text("Apply"), button:has-text("Применить")').first();
            if (await applyBtn.isVisible().catch(() => false)) {
              await applyBtn.click();
              await this.wait(300);
              console.log('[drawSignature] Applied drawn signature');
            }
          }
        }
      }
    }
  }

  async clearSignature(): Promise<void> {
    const clearBtn = this.page.locator('button:has-text("Clear"), button:has-text("Очистить")').first();
    await clearBtn.click();
    await this.wait(200);
  }

  // ============================================
  // Editor - Page Navigation
  // ============================================

  /**
   * Navigate to a specific page by clicking the page number button.
   * The editor has numbered buttons (1, 2, 3...) for each page.
   */
  async goToPage(pageNumber: number): Promise<void> {
    // Click the page number button directly (buttons are in a flex container with gap-1)
    // Looking for buttons that contain just the number
    const pageButton = this.page.locator(`button:text-is("${pageNumber}")`).first();
    await pageButton.click();
    await this.wait(500); // Wait for page to render
  }

  async getCurrentPage(): Promise<number> {
    // The current page button has a dark background (bg-zinc-900)
    const activeButton = this.page.locator('button.bg-zinc-900').first();
    const pageText = await activeButton.textContent();
    return pageText ? parseInt(pageText, 10) : 1;
  }

  /**
   * Wait for PDF page to fully load (canvas rendered).
   */
  async waitForPdfPageLoad(): Promise<void> {
    await this.page.locator('canvas').first().waitFor({ state: 'visible', timeout: 10000 });
    await this.wait(500); // Extra time for render
  }

  // ============================================
  // Editor - Save
  // ============================================

  async save(): Promise<void> {
    const saveBtn = this.page.locator(this.selectors.editor.saveButton).first();
    await saveBtn.click();
    await this.waitForSpinner();
    await this.wait(500);
  }

  // ============================================
  // Assertions
  // ============================================

  async shouldSeeTemplate(name: string): Promise<void> {
    await expect(this.page.getByText(name).first()).toBeVisible({ timeout: 10000 });
  }

  async shouldNotSeeTemplate(name: string): Promise<void> {
    await expect(this.page.getByText(name).first()).not.toBeVisible({ timeout: 5000 });
  }

  async shouldSeeFieldOnCanvas(label: string): Promise<void> {
    const field = this.page.locator(this.selectors.editor.field(label)).first();
    await expect(field).toBeVisible({ timeout: 5000 });
  }

  async shouldSeePDFViewer(): Promise<boolean> {
    // Wait for loading to disappear first
    try {
      await this.page.getByText('Loading...').waitFor({ state: 'hidden', timeout: 30000 });
    } catch {
      // Loading might not have appeared or already gone
    }

    // Wait a bit for PDF to render
    await this.wait(2000);

    // Check for multiple indicators that PDF is loaded:
    // 1. Page numbers in header (1, 2, 3 buttons)
    // 2. PDF viewer container or canvas
    // 3. PDF content text
    const indicators = [
      this.selectors.editor.pdfViewer,
      'canvas',
      'button:has-text("1")', // Page number button
      ':has-text("Test Agreement Document")', // PDF content
    ];

    for (const selector of indicators) {
      try {
        const visible = await this.page.locator(selector).first()
          .isVisible({ timeout: 5000 });
        if (visible) return true;
      } catch {
        // Try next selector
      }
    }
    return false;
  }
}
