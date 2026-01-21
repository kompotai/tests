# User Stories

Story-driven testing documentation for Kompot E2E tests.

## Structure

```
stories/
├── _template.story.md      # Template for new stories
├── authentication.story.md # Auth stories (G1-G4)
├── contacts.story.md       # Contact stories (C1-C5)
└── opportunities.story.md  # Opportunity stories (O1-O5)
```

## Running Tests

```bash
# All story tests
npx playwright test tests/stories

# By domain
npx playwright test tests/stories/auth

# By story ID
npx playwright test -g "G1"

# Smoke tests
npx playwright test -g "@smoke"
```
