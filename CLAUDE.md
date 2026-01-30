# Claude Code Instructions

## Language

Always respond in the same language that the developer uses to communicate with you. If the developer writes in Russian, respond in Russian. If they write in English, respond in English.

## Rules of Engagement

1. **Strict execution**: Do exactly what the user says. Do not touch or modify files not directly related to the task.

2. **Suggestions before actions**: If you notice a potential improvement or error in other files, voice it first. Only after user approval can we discuss or make changes to unrelated files.

3. **User speech patterns**: If the user says "I will check/do this" (as if they're going to do something themselves), this is likely a slip of tongue — treat it as a command for you to execute.

4. **Improvements require approval**: If you see something that can be improved, first inform or ask about it. Only then, after agreement, take action.

## Git Commits

**Do NOT add co-author line in commits for this project.** This is a tests repository, not the main product. Commit messages should be simple without the `Co-Authored-By: Claude` footer.

## GitHub Actions

- **Workflow runs**: https://github.com/kompotai/tests/actions
- **Workflow file**: `.github/workflows/e2e-stage.yml`

### Triggers

1. **Push to main** — when tests are updated
2. **repository_dispatch** — triggered by kompot.ai deploy (via `trigger-tests.yml` in kompot.ai repo)
3. **Manual** — workflow_dispatch with optional commit SHA

### Note on Actor

Dispatched runs show as "Andrew1326" because `TESTS_DISPATCH_TOKEN` in kompot.ai secrets is his PAT. To change the displayed actor, replace the token with another user's PAT.

## Testing Environment

- Tests run **locally** or on **stage** environment only
- **NEVER** run tests against production: `kompot.ai`
- E2E tests verify possible user scenarios

## Timeouts and Waits

**ЗАПРЕЩЕНО использовать:**

| Запрещено | Почему |
|-----------|--------|
| `test.setTimeout(120000)` | Увеличение таймаута теста — признак плохого дизайна |
| `page.waitForTimeout(3000)` | Жёсткие паузы делают тесты медленными и нестабильными |
| Любые таймауты > 10 секунд | Если требуется больше — проблема в тесте или приложении |

**Вместо этого использовать:**

```typescript
// ❌ Плохо
await page.waitForTimeout(3000);

// ✅ Хорошо — ждём конкретное условие
await element.waitFor({ state: 'visible', timeout: 10000 });
await page.locator('text=Success').waitFor({ state: 'visible' });

// ❌ Плохо
test.setTimeout(120000);

// ✅ Хорошо — если тест долгий, разбить на несколько
test('part 1: setup', async () => { ... });
test('part 2: verify', async () => { ... });
```

**Принципы:**
- Используй `waitFor()` с конкретными условиями
- Стандартный таймаут `10000ms` достаточен для большинства операций
- Если элемент не появляется за 10 секунд — проблема в приложении, а не в тесте
- Длинные тесты разбивай на части с `describe` блоками

## Project Overview

This is an E2E test framework for the Kompot business platform using Playwright.

### Structure

```
tests/
├── tests/e2e/           # E2E tests
│   ├── setup/           # Workspace setup tests (run first)
│   ├── auth/            # Authentication tests
│   ├── contacts/        # Contact management tests
│   └── opportunities/   # Opportunity/deal tests
├── fixtures/            # Playwright fixtures (TestWorld)
├── helpers/             # Reusable test helpers
├── pages/               # Page Objects
│   └── selectors/       # Centralized selectors
├── utils/               # Test data and utilities
├── global-setup.ts      # Pre-test setup (env validation, DB cleanup)
└── playwright.config.ts # Playwright configuration
```

### Test Execution Order

Tests are organized into Playwright projects with dependencies:
1. `setup` project runs first - creates workspace "megatest"
2. `chromium` project runs after setup - all other E2E tests

### Environment Variables

Required variables (set via Doppler or `.env`):
- `BASE_URL` - Application URL
- `WS_MEGATEST_ID` - Workspace ID (megatest)
- `MONGODB_URI` - MongoDB connection string
- `WS_MEGATEST_OWNER_EMAIL` / `WS_MEGATEST_OWNER_PASSWORD` - Owner credentials
- `WS_MEGATEST_ADMIN_EMAIL` / `WS_MEGATEST_ADMIN_PASSWORD` - Admin credentials
- `WS_MEGATEST_EMPLOYEE_EMAIL` / `WS_MEGATEST_EMPLOYEE_PASSWORD` - Employee credentials

### Commands

```bash
npm run test:setup    # First time: create workspace
npm test              # Run tests
npm run test:headed   # With visible browser
npm run test:ui       # Interactive mode
```

If tests fail on login — run `npm run test:setup` again.

### Key Files

- `fixtures/world.fixture.ts` - TestWorld class with login/navigation helpers
- `utils/test-data.ts` - Test credentials and constants (lazy-loaded via getters)
- `global-setup.ts` - Validates env vars and deletes test workspace before tests

### Recent Changes

- Added workspace setup tests (`tests/e2e/setup/workspace-setup.spec.ts`)
- Configured Playwright projects with dependencies (setup runs before chromium)
- Global setup validates env vars and deletes workspace + owner account before tests
- Environment variables are required (no fallback values)
- Fixed login URL: `/account/login` (not `/login`)
- MONGODB_URI is universal (no database in URI); specify database explicitly in code
- Added `dotenv.config({ override: true })` to override shell env vars
