export const WelcomeSelectors = {
  heading: 'h1:has-text("Welcome!")',
  contactsLink: 'a[href="/ws/contacts"]',
  opportunitiesLink: 'a[href="/ws/opportunities"]',
  jobsLink: 'a[href="/ws/jobs"]',
  invoicesLink: 'a[href="/ws/finances/invoices"]',
  paymentsLink: 'a[href="/ws/finances/payments"]',
  tasksLink: 'a[href="/ws/tasks"]',
  calendarLink: 'a[href="/ws/calendar"]',
  callsLink: 'a[href="/ws/calls"]',
  smsLink: 'a[href="/ws/sms"]',
  productsLink: 'a[href="/ws/products"]',
} as const;
