/**
 * Agreement Setup Utilities
 *
 * Shared state for agreement tests. The setup spec (00-agreement-setup.spec.ts)
 * creates a template with signer roles via API and saves it here.
 * Other test files read this data to find a guaranteed template.
 */

import * as fs from 'fs';
import * as path from 'path';

const SETUP_DATA_PATH = path.join(__dirname, '.agreement-setup-data.json');

export interface AgreementSetupData {
  templateId: string;
  templateName: string;
  createdAt: string;
}

export function getSetupData(): AgreementSetupData | null {
  try {
    return JSON.parse(fs.readFileSync(SETUP_DATA_PATH, 'utf-8'));
  } catch {
    return null;
  }
}

export function getSetupTemplateName(): string | null {
  return getSetupData()?.templateName ?? null;
}

export function writeSetupData(data: AgreementSetupData): void {
  fs.writeFileSync(SETUP_DATA_PATH, JSON.stringify(data, null, 2));
}
