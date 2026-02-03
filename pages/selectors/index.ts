/**
 * Centralized selectors - barrel export
 */

import { LoginSelectors } from './login.selectors';
import { ContactsSelectors } from './contacts.selectors';
import { OpportunitiesSelectors } from './opportunities.selectors';
import { TasksSelectors } from './tasks.selectors';
import { CommonSelectors } from './common.selectors';
import { AgreementsSelectors, AgreementTemplatesSelectors } from './agreements.selectors';

export const Selectors = {
  login: LoginSelectors,
  contacts: ContactsSelectors,
  opportunities: OpportunitiesSelectors,
  tasks: TasksSelectors,
  common: CommonSelectors,
  agreements: AgreementsSelectors,
  agreementTemplates: AgreementTemplatesSelectors,
} as const;

// Re-export individual selectors for direct import
export { LoginSelectors, ContactsSelectors, OpportunitiesSelectors, TasksSelectors, CommonSelectors };
export {
  LoginSelectors,
  ContactsSelectors,
  OpportunitiesSelectors,
  CommonSelectors,
  AgreementsSelectors,
  AgreementTemplatesSelectors,
};
