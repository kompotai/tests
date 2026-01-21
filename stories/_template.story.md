# Story: [Feature Name]

## Overview
Brief description of the feature.

## User Stories

### [ID]: [Story Title]
As a [role], I want to [action] so that [benefit].

#### Acceptance Criteria
- [ ] **AC1**: [Description]
- [ ] **AC2**: [Description]

## Test File
`tests/stories/[domain]/[feature].spec.ts`

## Status
- [ ] All acceptance criteria implemented
- [ ] All tests passing

---

## Naming Convention

| Domain | Prefix | Example |
|--------|--------|---------|
| Auth/Guest | G | G1, G2, G3 |
| Contacts | C | C1, C2, C3 |
| Opportunities | O | O1, O2, O3 |
| Settings | S | S1, S2, S3 |

## Test Pattern

```typescript
test('[G1] User can login with valid credentials', async ({ world }) => {
  // Given
  await world.goto('/login');

  // When
  await world.fillField('email', 'test@example.com');
  await world.clickButton('Sign In');

  // Then
  await world.shouldBeOnPage('/dashboard');
});
```
