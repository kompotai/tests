/**
 * Test data constants and generators
 *
 * Aligned with kompot.ai/tests/config.ts
 */

export const TestCredentials = {
  get workspaceId(): string {
    return process.env.TEST_WORKSPACE_ID || 'megatest';
  },
  get email(): string {
    return process.env.WS_MEGATEST_OWNER_EMAIL ||
           process.env.WS_MEGATEST_EMAIL ||
           'megatest-owner@kompot.ai';
  },
  get password(): string {
    return process.env.WS_MEGATEST_OWNER_PASSWORD ||
           process.env.WS_MEGATEST_PASSWORD ||
           'MegatestOwner123!';
  },
  get adminEmail(): string {
    return process.env.WS_MEGATEST_ADMIN_EMAIL || 'megatest-admin@kompot.ai';
  },
  get adminPassword(): string {
    return process.env.WS_MEGATEST_ADMIN_PASSWORD || 'MegatestAdmin123!';
  },
};

export const InvalidCredentials = {
  workspaceId: 'invalid-workspace-id-123',
  email: 'nonexistent@example.com',
  password: 'wrongpassword123',
  shortPassword: '12345',
  invalidEmail: 'not-an-email',
};

export const TestUrls = {
  get base(): string {
    return process.env.PLAYWRIGHT_BASE_URL || 'https://kompot-stage.up.railway.app';
  },
  login: '/login',
  register: '/register',
  adminLogin: '/admin-login',
  forgotPassword: '/forgot-password',
  home: '/',
};

export const Timeouts = {
  short: 5000,
  medium: 10000,
  long: 30000,
  navigation: 15000,
};

export const TestUsers = {
  validUser: {
    workspaceId: TestCredentials.workspaceId,
    email: TestCredentials.email,
    password: TestCredentials.password,
  },
  invalidUser: {
    workspaceId: InvalidCredentials.workspaceId,
    email: InvalidCredentials.email,
    password: InvalidCredentials.password,
  },
};
