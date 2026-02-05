/**
 * Centralized selectors - barrel export
 */

import { LoginSelectors } from './login.selectors';
import { ContactsSelectors } from './contacts.selectors';
import { OpportunitiesSelectors } from './opportunities.selectors';
import { CommonSelectors } from './common.selectors';
import { AgreementsSelectors, AgreementTemplatesSelectors } from './agreements.selectors';
import { PipelinesSelectors } from './pipelines.selectors';
import { ProductsSelectors } from './products.selectors';

export const Selectors = {
  login: LoginSelectors,
  contacts: ContactsSelectors,
  opportunities: OpportunitiesSelectors,
  common: CommonSelectors,
  agreements: AgreementsSelectors,
  agreementTemplates: AgreementTemplatesSelectors,
  pipelines: PipelinesSelectors,
  products: ProductsSelectors,
} as const;

// Re-export individual selectors for direct import
export {
  LoginSelectors,
  ContactsSelectors,
  OpportunitiesSelectors,
  CommonSelectors,
  AgreementsSelectors,
  AgreementTemplatesSelectors,
  PipelinesSelectors,
  ProductsSelectors,
};
