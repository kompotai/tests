/**
 * Centralized selectors - barrel export
 */

import { LoginSelectors } from './login.selectors';
import { ContactsSelectors } from './contacts.selectors';
import { OpportunitiesSelectors } from './opportunities.selectors';
import { CommonSelectors } from './common.selectors';

export const Selectors = {
  login: LoginSelectors,
  contacts: ContactsSelectors,
  opportunities: OpportunitiesSelectors,
  common: CommonSelectors,
} as const;

// Re-export individual selectors for direct import
export { LoginSelectors, ContactsSelectors, OpportunitiesSelectors, CommonSelectors };
