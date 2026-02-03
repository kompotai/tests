# Test Agreement PDF Generation

This document describes how to generate and maintain the test PDF document used for Agreement E2E tests.

## Overview

The test PDF (`fixtures/test-agreement.pdf`) is a 3-page A4 document with marked field positions:
- **Page 1 (Blue)**: Document Fields (Company side)
- **Page 2 (Green)**: Signatory 1 Fields (Client)
- **Page 3 (Pink)**: Signatory 2 Fields (Partner)

Each field position is marked with a dashed rectangle and labeled with the field name.

## Files

| File | Purpose |
|------|---------|
| `scripts/generate-test-pdf.ts` | PDF generation script |
| `fixtures/test-agreement.pdf` | Generated test PDF |
| `fixtures/test-agreement-coords.json` | Field coordinates for tests |

## Coordinate System

### PDF Coordinates (in script)
- Origin: **Bottom-left corner**
- X: 0 (left) to 595 (right)
- Y: 0 (bottom) to 842 (top)
- Units: PDF points (1/72 inch)

### Editor Coordinates (in JSON/tests)
- Origin: **Top-left corner**
- X: 0 (left) to 595 (right)
- Y: 0 (top) to 842 (bottom)
- Same scale as PDF (no conversion needed for X)

### Conversion Formula
```typescript
// PDF Y (bottom-left origin) → Editor Y (top-left origin)
editorY = PAGE_HEIGHT - pdfY - fieldHeight

// Example: signature field at pdfY=620, height=60
// editorY = 842 - 620 - 60 = 162
```

## Field Definitions

### Page 1: Document Fields

| Field | Type | PDF Position | Size |
|-------|------|--------------|------|
| Company Signature | signature | (50, 620) | 200×60 |
| Company Initials | initials | (350, 620) | 80×50 |
| Creation Date | creationDate | (50, 500) | 150×30 |
| Document Text Field | text | (300, 500) | 200×30 |
| Document Number Field | number | (50, 400) | 100×30 |

### Page 2 & 3: Signatory Fields

| Field | Type | PDF Position | Size |
|-------|------|--------------|------|
| Contact Name | contact.name | (50, 700) | 180×35 |
| Contact Email | contact.email | (300, 700) | 220×35 |
| Contact Phone | contact.phone | (50, 620) | 150×35 |
| Contact Company | contact.company | (280, 620) | 180×35 |
| Contact Address | contact.address | (50, 540) | 400×35 |
| Signature | signature | (50, 430) | 200×60 |
| Initials | initials | (350, 430) | 80×50 |
| Date Signed | dateSigned | (50, 330) | 120×30 |
| Full Name | fullName | (280, 330) | 220×30 |
| Text Input | text | (50, 250) | 180×30 |
| Date Input | date | (300, 250) | 140×30 |
| Checkbox | checkbox | (500, 250) | 25×25 |

**Note:** Checkbox is positioned on the same row as Text/Date fields (right side) to ensure it's within the visible/accessible area for E2E test drag-and-drop operations.

## Generating the PDF

```bash
cd /path/to/tests
npx tsx scripts/generate-test-pdf.ts
```

This generates:
1. `fixtures/test-agreement.pdf` - The visual PDF with marked fields
2. `fixtures/test-agreement-coords.json` - Coordinates for E2E tests

## Adding New Fields

1. **Add field definition** in `scripts/generate-test-pdf.ts`:
   ```typescript
   // In PAGE1_FIELDS, PAGE2_FIELDS, or PAGE3_FIELDS
   { name: 'New Field', type: 'newType', pdfX: 50, pdfY: 300, width: 150, height: 30 },
   ```

2. **Add UI type mapping** in `tests/e2e/05-agreements/agreement-comprehensive.spec.ts`:
   ```typescript
   const typeToUIName: Record<string, string> = {
     // ... existing mappings
     'newType': 'New Type',  // Must match UI dropdown text
   };
   ```

3. **Add internal type mapping** in `pages/AgreementTemplatesPage.ts`:
   ```typescript
   const FIELD_TYPE_MAP: Record<string, string> = {
     // ... existing mappings
     'New Type': 'newType',  // UI name → data-testid suffix
   };
   ```

4. **Regenerate PDF**:
   ```bash
   npx tsx scripts/generate-test-pdf.ts
   ```

5. **Run tests** to verify placement:
   ```bash
   npm test -- agreement-comprehensive
   ```

## Field Positioning Tips

### Vertical Spacing
- Standard row spacing: ~80px between field bottoms
- Title area: Y > 700 (top of page)
- Footer area: Y < 100 (bottom of page)

### Horizontal Positioning
- Left column: X = 50
- Right column: X = 280-350
- Full width: X = 50, Width = 400-500

### Field Sizes by Type
| Type | Recommended Size |
|------|-----------------|
| Signature | 200×60 |
| Initials | 80×50 |
| Text/Date | 150-220×30 |
| Checkbox | 25×25 |
| Contact fields | 150-220×35 |

## Troubleshooting

### Fields not in correct position
1. Check PDF Y vs Editor Y conversion
2. Verify scale factor in browser (containerWidth / 595)
3. Check for CSS transforms on PDF container

### Field type not found
1. Verify type string matches `data-testid="field-type-{type}"`
2. Check FIELD_TYPE_MAP in AgreementTemplatesPage.ts
3. Check typeToUIName in test file

### Drag not working
1. Increase wait times between mouse operations
2. Check if PDF container selector changed
3. Verify field is added before drag attempt
