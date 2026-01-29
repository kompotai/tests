/**
 * Centralized selectors - barrel export
 */

import { LoginSelectors } from './login.selectors';
import { ContactsSelectors } from './contacts.selectors';
import { OpportunitiesSelectors } from './opportunities.selectors';
import { CommonSelectors } from './common.selectors';
import { AgreementsSelectors, AgreementTemplatesSelectors } from './agreements.selectors';
import { WelcomeSelectors } from './welcome.selectors';

export const Selectors = {
  login: LoginSelectors,
  contacts: ContactsSelectors,
  opportunities: OpportunitiesSelectors,
  common: CommonSelectors,
  agreements: AgreementsSelectors,
  agreementTemplates: AgreementTemplatesSelectors,
  welcome: WelcomeSelectors,
} as const;

// Re-export individual selectors for direct import
export {
  LoginSelectors,
  ContactsSelectors,
  OpportunitiesSelectors,
  CommonSelectors,
  AgreementsSelectors,
  AgreementTemplatesSelectors,
  WelcomeSelectors,
};
