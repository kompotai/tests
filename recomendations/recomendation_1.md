## 📋 Code Review - PR #17 (Tasks Module Tests)

Previous review covered **stories** only. This review covers the **test code** quality.

---

## ✅ Strengths

1. **Centralized selectors** (`tasks.selectors.ts`) — good pattern, matches project conventions
2. **Test data setup in `beforeAll`** — creates tasks for edit/delete tests, avoids dependency on existing data
3. **Serial test mode** — correct for dependent CRUD operations
4. **Story expansion** from 2 to 12 stories — comprehensive coverage plan

---

## 🚨 Critical Issues (Must fix)

### 1. **Not Using Project Auth Infrastructure**

The project provides `ownerTest` fixture with pre-authenticated sessions via `storageState`. Instead, this PR:

- Manually launches `chromium.launch()` in each test describe
- Implements custom `loginOwner()` function
- Bypasses the entire fixture system

**Current (wrong):**
```typescript
import { test, expect, chromium, Browser, BrowserContext, Page } from '@playwright/test';

test.describe('T1: View Tasks List', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ baseURL: process.env.BASE_URL });
    page = await context.newPage();
    await loginOwner(page);
    // ...
  });
```

**Should be:**
```typescript
import { ownerTest, expect } from '@fixtures/auth.fixture';

ownerTest.describe('T1: View Tasks List', () => {
  ownerTest.beforeEach(async ({ page }) => {
    tasksPage = new TasksPage(page);
    await tasksPage.goto();
  });
```

**Why this matters:**
- `loginOwner()` performs full login on every test suite — slow and fragile
- `storageState` reuses auth session — fast and reliable
- Manual browser management bypasses Playwright config (viewport, device, etc.)
- No `storageState` in the config project entry either

---

### 2. **Hardcoded Personal Workspace ID**

```typescript
readonly path = `/ws/${process.env.WS_ID || 'testlubas'}/tasks`;
```

Fallback should be `megatest`, not `testlubas`. The project uses a shared `megatest` workspace for all tests (see CLAUDE.md).

---

### 3. **Tests That Always Pass (`expect(true).toBe(true)`)**

**T1-AC4 (Pagination):**
```typescript
test('T1-AC4: Pagination works', async () => {
  // ...
  if (paginationVisible) {
    await tasksPage.goToNextPage();
  }
  expect(true).toBe(true);  // ❌ Always passes, tests nothing
});
```

**T4-AC2 (Delete confirmation):**
```typescript
test('T4-AC2: Delete confirmation dialog', async () => {
  // ...
  if (dialogVisible) {
    await tasksPage.cancelDialog();
  }
  expect(true).toBe(true);  // ❌ Always passes
});
```

**Fix:** Use `test.skip()` if feature not available, or write a meaningful assertion.

---

### 4. **15+ Hardcoded Waits**

```typescript
await this.wait(500);   // in openCreateForm
await this.wait(500);   // in fillForm (after container visible)
await this.wait(200);   // after nameField.click()
await this.wait(100);   // after clear
await this.wait(500);   // after pressSequentially
await this.wait(300);   // in selectOption
await this.wait(500);   // in selectAssignee
await this.wait(500);   // in submitForm before click
await this.wait(300);   // after cookie dismiss
await this.wait(1000);  // in submitForm after click
await this.wait(1000);  // in submitForm final
await this.wait(1000);  // in clickRowEdit
await this.wait(500);   // in clickRowDelete
await this.wait(500);   // in search
// + page.waitForTimeout(500), page.waitForTimeout(1000) in spec
```

This makes tests slow (~8-10 seconds of pure waiting per test) and flaky. Replace with proper `waitFor` conditions.

---

### 5. **Fallback Selector Chains**

```typescript
name: 'input#title, input[placeholder*="Call client"], [data-testid="task-form-input-name"]',
createButton: '[data-testid="tasks-create-button"], button:has-text("Create task")',
```

CSS selector lists (`a, b, c`) match the **first** one found, which may not be the right element. If `data-testid` attributes exist, use them directly without fallbacks.

**Fix:** Use only `data-testid` selectors. If they don't exist yet, request them.

---

### 6. **Duplicate Export Block**

`pages/selectors/index.ts` diff adds a new export line **before** the existing export block, creating duplicate re-exports:

```typescript
export { LoginSelectors, ContactsSelectors, OpportunitiesSelectors, TasksSelectors, CommonSelectors };
export {                      // ← duplicate block starts here
  LoginSelectors,
  ContactsSelectors,
  OpportunitiesSelectors,     // ← same exports repeated
  CommonSelectors,
```

This will cause a TypeScript compilation error.

---

### 7. **Unused Imports**

```typescript
import { Page, expect } from '@playwright/test';  // Page unused in TasksPage.ts
import * as path from 'path';   // unused in spec
import * as fs from 'fs';       // unused in spec
```

---

### 8. **Weak Edit Assertions**

After editing description/priority/status, tests only verify the task name is still visible:

```typescript
test('T3-AC3: Edit task description', async () => {
  await tasksPage.edit(taskToEdit, { description: 'Updated description' });
  await tasksPage.shouldSeeTask(taskToEdit);  // ❌ Only checks name, not description
});

test('T3-AC4: Edit task priority', async () => {
  await tasksPage.edit(taskToEdit, { priority: 'High' });
  await tasksPage.shouldSeeTask(taskToEdit);  // ❌ Only checks name, not priority value
});
```

**Fix:** Verify the actual changed field value.

---

### 9. **Search via URL Navigation**

```typescript
async search(query: string): Promise<void> {
  await this.page.goto(`${this.path}?search=${encodeURIComponent(query)}`);
}
```

E2E tests should simulate user behavior — type into search input, not manipulate URL. Also fragile if URL query parameter changes.

---

## ⚠️ Minor Issues

### 10. **`force: true` Click**

```typescript
await submitBtn.click({ force: true }); // Force click to bypass any remaining overlays
```

Force clicks bypass visibility/overlay checks. If an overlay blocks the button, the test should handle it properly, not force through.

### 11. **Missing `storageState` in Config**

```typescript
{
  name: 'tasks',
  testDir: './tests/e2e/04-tasks',
  use: {
    ...devices['Desktop Chrome'],
    // Missing: storageState: '.auth/owner.json',
  },
},
```

---

## 📋 Action Items

**Before this PR can be merged:**

1. ⛔ Switch from manual `chromium.launch()` to `ownerTest` fixture
2. ⛔ Fix workspace ID fallback: `testlubas` → `megatest`
3. ⛔ Remove `expect(true).toBe(true)` — use real assertions or `test.skip()`
4. ⛔ Fix duplicate export block in `selectors/index.ts`
5. ⛔ Remove unused imports (`Page`, `path`, `fs`)
6. ⛔ Add `storageState` to config or use `ownerTest` fixture
7. ⚠️ Reduce hardcoded waits (target: ≤ 2 in entire suite)
8. ⚠️ Use data-testid directly, not fallback chains
9. ⚠️ Implement search via input interaction, not URL
10. ⚠️ Strengthen edit assertions to verify actual field values

**Also:**
- Pull latest changes from `main` — there have been updates since this PR was created
- Run `npx tsc --noEmit` to verify no compilation errors

---

## 📊 Quality Assessment

| Criterion | Rating | Notes |
|-----------|--------|-------|
| **Structure** | ✅ 8/10 | Good organization, selectors file |
| **Infrastructure** | ❌ 3/10 | Bypasses auth fixtures, manual browser |
| **Selector Reliability** | ⚠️ 5/10 | Fallback chains, some data-testid |
| **Assertion Strength** | ⚠️ 4/10 | Two always-pass tests, weak edit checks |
| **Performance** | ❌ 3/10 | 15+ hardcoded waits |
| **Code Quality** | ⚠️ 5/10 | Unused imports, duplicate exports, force clicks |

**Overall: 4.7/10** — Good ideas, needs significant infrastructure alignment

---

## 🎯 Recommendation

**CHANGES REQUESTED**

The main issue is that the tests don't use the project's auth infrastructure (`ownerTest` fixture + `storageState`). This is the foundation — everything else builds on it.

**Suggested approach:**
1. Study how existing tests work (e.g., `tests/e2e/02-contacts/`)
2. Use `ownerTest` instead of manual browser launch
3. Fix the compilation error (duplicate exports)
4. Then address the other issues

Looking forward to the updated version!