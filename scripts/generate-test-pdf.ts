/**
 * Generate test PDF with field placeholders for E2E testing.
 *
 * This script generates a 3-page PDF with marked areas for each field type:
 * - Page 1: Document Fields (blue) - Company side fields
 * - Page 2: Signatory 1 Fields (green) - Client side fields
 * - Page 3: Signatory 2 Fields (pink) - Partner side fields
 *
 * IMPORTANT: Coordinates are exported in EDITOR units (top-left origin, same scale as PDF).
 * The editor uses the same coordinate system as PDF but with Y inverted.
 *
 * Usage: npx tsx scripts/generate-test-pdf.ts
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

// PDF page dimensions (A4 in points: 595 x 842)
// These are also the base units used by the editor (before zoom)
const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;

// Colors (RGB 0-1 scale)
const COLORS = {
  blue: rgb(0.231, 0.510, 0.965), // #3B82F6 - Document fields
  green: rgb(0.063, 0.725, 0.506), // #10B981 - Signatory 1
  pink: rgb(0.925, 0.282, 0.600), // #EC4899 - Signatory 2
  black: rgb(0, 0, 0),
};

// Field position type (PDF coordinates - origin bottom-left)
interface FieldDef {
  name: string;
  type: string;
  pdfX: number;
  pdfY: number;
  width: number;
  height: number;
}

// Convert PDF Y (bottom-left origin) to Editor Y (top-left origin)
// This gives the Y coordinate for the TOP-LEFT corner of the field
function pdfToEditorY(pdfY: number, height: number): number {
  return PAGE_HEIGHT - pdfY - height;
}

// X coordinate is the same in both systems
function pdfToEditorX(pdfX: number): number {
  return pdfX;
}

// Page 1: Document Fields (Company Side) - Blue
// Contains ALL 5 document-level field types available in UI: signature, initials, creationDate, text, number
// Note: email and company are only available for Signatory Fields (filled from signer data)
const PAGE1_FIELDS: FieldDef[] = [
  { name: 'Company Signature', type: 'signature', pdfX: 50, pdfY: 620, width: 200, height: 60 },
  { name: 'Company Initials', type: 'initials', pdfX: 350, pdfY: 620, width: 80, height: 50 },
  { name: 'Creation Date', type: 'creationDate', pdfX: 50, pdfY: 500, width: 150, height: 30 },
  { name: 'Document Text Field', type: 'text', pdfX: 300, pdfY: 500, width: 200, height: 30 },
  { name: 'Document Number Field', type: 'number', pdfX: 50, pdfY: 400, width: 100, height: 30 },
];

// Page 2: Signatory 1 Fields (Client) - Green
// Contains ALL 14 signatory field types available in UI:
// - Signature: signature, initials
// - Auto-fill from signer: dateSigned, fullName, email, company
// - Dynamic from contact: contact.name, contact.email, contact.phone, contact.company, contact.address
// - Input: text, date, checkbox
const PAGE2_FIELDS: FieldDef[] = [
  // Contact data fields (dynamic - from Contact entity)
  { name: 'Contact Name', type: 'contact.name', pdfX: 50, pdfY: 700, width: 180, height: 35 },
  { name: 'Contact Email', type: 'contact.email', pdfX: 300, pdfY: 700, width: 220, height: 35 },
  { name: 'Contact Phone', type: 'contact.phone', pdfX: 50, pdfY: 620, width: 150, height: 35 },
  { name: 'Contact Company', type: 'contact.company', pdfX: 280, pdfY: 620, width: 180, height: 35 },
  { name: 'Contact Address', type: 'contact.address', pdfX: 50, pdfY: 540, width: 400, height: 35 },
  // Signature fields
  { name: 'Signature', type: 'signature', pdfX: 50, pdfY: 430, width: 200, height: 60 },
  { name: 'Initials', type: 'initials', pdfX: 350, pdfY: 430, width: 80, height: 50 },
  // Auto-fill fields (from signer form data)
  { name: 'Date Signed', type: 'dateSigned', pdfX: 50, pdfY: 330, width: 120, height: 30 },
  { name: 'Full Name', type: 'fullName', pdfX: 250, pdfY: 330, width: 150, height: 30 },
  { name: 'Signer Email', type: 'email', pdfX: 420, pdfY: 330, width: 120, height: 30 },
  { name: 'Signer Company', type: 'company', pdfX: 50, pdfY: 280, width: 180, height: 30 },
  // Input fields
  { name: 'Text Input', type: 'text', pdfX: 280, pdfY: 280, width: 120, height: 30 },
  { name: 'Date Input', type: 'date', pdfX: 420, pdfY: 280, width: 120, height: 30 },
  { name: 'Checkbox', type: 'checkbox', pdfX: 50, pdfY: 180, width: 25, height: 25 },
];

// Page 3: Signatory 2 Fields (Partner) - Pink (same positions as Page 2)
const PAGE3_FIELDS: FieldDef[] = PAGE2_FIELDS.map(f => ({ ...f }));

// Helper to draw a dashed rectangle
function drawDashedRect(
  page: ReturnType<PDFDocument['addPage']>,
  x: number,
  y: number,
  width: number,
  height: number,
  color: ReturnType<typeof rgb>,
  dashLength = 5,
  gapLength = 3
) {
  // Top line
  let currentX = x;
  while (currentX < x + width) {
    const segmentEnd = Math.min(currentX + dashLength, x + width);
    page.drawLine({ start: { x: currentX, y: y + height }, end: { x: segmentEnd, y: y + height }, color, thickness: 1 });
    currentX = segmentEnd + gapLength;
  }
  // Bottom line
  currentX = x;
  while (currentX < x + width) {
    const segmentEnd = Math.min(currentX + dashLength, x + width);
    page.drawLine({ start: { x: currentX, y }, end: { x: segmentEnd, y }, color, thickness: 1 });
    currentX = segmentEnd + gapLength;
  }
  // Left line
  let currentY = y;
  while (currentY < y + height) {
    const segmentEnd = Math.min(currentY + dashLength, y + height);
    page.drawLine({ start: { x, y: currentY }, end: { x, y: segmentEnd }, color, thickness: 1 });
    currentY = segmentEnd + gapLength;
  }
  // Right line
  currentY = y;
  while (currentY < y + height) {
    const segmentEnd = Math.min(currentY + dashLength, y + height);
    page.drawLine({ start: { x: x + width, y: currentY }, end: { x: x + width, y: segmentEnd }, color, thickness: 1 });
    currentY = segmentEnd + gapLength;
  }
}

async function generatePDF() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Page 1: Document Fields
  const page1 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  page1.drawText('Test Agreement Document', { x: 130, y: 780, size: 24, font: boldFont, color: COLORS.black });
  page1.drawText('This is a test document for E2E testing of the Agreement system.', { x: 50, y: 745, size: 11, font, color: COLORS.black });
  page1.drawText('Document Fields (Company Side)', { x: 50, y: 710, size: 14, font: boldFont, color: COLORS.blue });
  page1.drawLine({ start: { x: 50, y: 705 }, end: { x: 280, y: 705 }, color: COLORS.blue, thickness: 1 });

  for (const field of PAGE1_FIELDS) {
    page1.drawText(field.name, { x: field.pdfX, y: field.pdfY + field.height + 5, size: 9, font, color: COLORS.blue });
    drawDashedRect(page1, field.pdfX, field.pdfY, field.width, field.height, COLORS.blue);
  }

  page1.drawText('This Agreement is entered into by and between the parties described below.', { x: 50, y: 300, size: 11, font, color: COLORS.black });
  page1.drawText('Terms and conditions apply as stated in the document.', { x: 50, y: 280, size: 11, font, color: COLORS.black });

  // Page 2: Signatory 1 (Client)
  const page2 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  page2.drawText('Signatory 1 - Client', { x: 180, y: 780, size: 24, font: boldFont, color: COLORS.black });
  page2.drawText('Signatory 1 Fields', { x: 50, y: 750, size: 14, font: boldFont, color: COLORS.green });
  page2.drawLine({ start: { x: 50, y: 745 }, end: { x: 180, y: 745 }, color: COLORS.green, thickness: 1 });

  for (const field of PAGE2_FIELDS) {
    page2.drawText(field.name, { x: field.pdfX, y: field.pdfY + field.height + 5, size: 9, font, color: COLORS.green });
    drawDashedRect(page2, field.pdfX, field.pdfY, field.width, field.height, COLORS.green);
  }

  // Page 3: Signatory 2 (Partner)
  const page3 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  page3.drawText('Signatory 2 - Partner', { x: 170, y: 780, size: 24, font: boldFont, color: COLORS.black });
  page3.drawText('Signatory 2 Fields', { x: 50, y: 750, size: 14, font: boldFont, color: COLORS.pink });
  page3.drawLine({ start: { x: 50, y: 745 }, end: { x: 180, y: 745 }, color: COLORS.pink, thickness: 1 });

  for (const field of PAGE3_FIELDS) {
    page3.drawText(field.name, { x: field.pdfX, y: field.pdfY + field.height + 5, size: 9, font, color: COLORS.pink });
    drawDashedRect(page3, field.pdfX, field.pdfY, field.width, field.height, COLORS.pink);
  }

  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  const outputPath = path.join(__dirname, '../fixtures/test-agreement.pdf');
  fs.writeFileSync(outputPath, pdfBytes);

  console.log('PDF generated:', outputPath);

  // Export coordinates JSON for tests
  // Coordinates are in EDITOR units (top-left origin, same scale as PDF base)
  const toEditorCoords = (fields: FieldDef[], page: number) => fields.map(f => ({
    name: f.name,
    type: f.type,
    page,
    // Absolute coordinates in editor units (0-595 for x, 0-842 for y)
    x: pdfToEditorX(f.pdfX),
    y: pdfToEditorY(f.pdfY, f.height),
    width: f.width,
    height: f.height,
  }));

  const coords = {
    // Metadata
    pageWidth: PAGE_WIDTH,
    pageHeight: PAGE_HEIGHT,
    generatedAt: new Date().toISOString(),
    description: 'Field coordinates in editor units (top-left origin). Use these values directly for field positioning.',

    // Fields by page
    page1: toEditorCoords(PAGE1_FIELDS, 1),
    page2: toEditorCoords(PAGE2_FIELDS, 2),
    page3: toEditorCoords(PAGE3_FIELDS, 3),
  };

  const coordsPath = path.join(__dirname, '../fixtures/test-agreement-coords.json');
  fs.writeFileSync(coordsPath, JSON.stringify(coords, null, 2));
  console.log('Coordinates JSON:', coordsPath);

  // Print summary
  console.log('\nField Summary:');
  console.log(`  Page 1 (Document): ${PAGE1_FIELDS.length} fields`);
  console.log(`  Page 2 (Signatory 1): ${PAGE2_FIELDS.length} fields`);
  console.log(`  Page 3 (Signatory 2): ${PAGE3_FIELDS.length} fields`);
  console.log(`  Total: ${PAGE1_FIELDS.length + PAGE2_FIELDS.length + PAGE3_FIELDS.length} fields`);
}

generatePDF().catch(console.error);
