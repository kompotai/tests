/**
 * Centralized selectors - barrel export
 */

import { LoginSelectors } from './login.selectors';
import { ContactsSelectors } from './contacts.selectors';
import { OpportunitiesSelectors } from './opportunities.selectors';
import { TasksSelectors } from './tasks.selectors';
import { CommonSelectors } from './common.selectors';
import { AgreementsSelectors, AgreementTemplatesSelectors } from './agreements.selectors';
import { PipelinesSelectors } from './pipelines.selectors';
import { ProductsSelectors } from './products.selectors';
import { ChatSelectors } from './chat.selectors';
import { AIAssistantSelectors } from './ai-assistant.selectors';
import { InvoicesSelectors } from './invoices.selectors';
import { PaymentsSelectors } from './payments.selectors';
import { ExpensesSelectors } from './expenses.selectors';
import { RefundsSelectors } from './refunds.selectors';
import { DictionariesSelectors } from './dictionaries.selectors';

export const Selectors = {
  login: LoginSelectors,
  contacts: ContactsSelectors,
  opportunities: OpportunitiesSelectors,
  tasks: TasksSelectors,
  common: CommonSelectors,
  agreements: AgreementsSelectors,
  agreementTemplates: AgreementTemplatesSelectors,
  pipelines: PipelinesSelectors,
  products: ProductsSelectors,
  chat: ChatSelectors,
  aiAssistant: AIAssistantSelectors,
  invoices: InvoicesSelectors,
  payments: PaymentsSelectors,
  expenses: ExpensesSelectors,
  refunds: RefundsSelectors,
  dictionaries: DictionariesSelectors,
} as const;

// Re-export individual selectors for direct import
export {
  LoginSelectors,
  ContactsSelectors,
  OpportunitiesSelectors,
  TasksSelectors,
  CommonSelectors,
  AgreementsSelectors,
  AgreementTemplatesSelectors,
  PipelinesSelectors,
  ProductsSelectors,
  ChatSelectors,
  AIAssistantSelectors,
  InvoicesSelectors,
  PaymentsSelectors,
  ExpensesSelectors,
  RefundsSelectors,
  DictionariesSelectors,
};
