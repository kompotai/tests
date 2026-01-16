/**
 * Test data constants and generators
 */

export const TestCredentials = {
  get workspaceId(): string {
    return process.env.WORKSPACE_ID || 'test-workspace';
  },
  get email(): string {
    return process.env.TEST_USER_EMAIL || 'test@example.com';
  },
  get password(): string {
    return process.env.TEST_USER_PASSWORD || 'password123';
  },
  get adminEmail(): string {
    return process.env.ADMIN_EMAIL || 'admin@example.com';
  },
  get adminPassword(): string {
    return process.env.ADMIN_PASSWORD || 'admin123';
  },
};

export const InvalidCredentials = {
  workspaceId: 'invalid-workspace-id-123',
  email: 'nonexistent@example.com',
  password: 'wrongpassword123',
  shortPassword: '12345', // Less than 6 characters
  invalidEmail: 'not-an-email',
};

export const TestUrls = {
  get base(): string {
    return process.env.BASE_URL || 'https://kompot-stage.up.railway.app';
  },
  login: '/account/login',
  register: '/account/register',
  adminLogin: '/account/admin-login',
  forgotPassword: '/account/forgot-password',
  home: '/',
};

export const Timeouts = {
  short: 5000,
  medium: 10000,
  long: 30000,
  navigation: 15000,
};

/**
 * Common test user data
 */
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
