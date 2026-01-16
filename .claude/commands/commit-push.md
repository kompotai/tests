Analyze and commit ALL changes in the test framework project.

## Project:
- **Kompot E2E Tests**: `/Users/sh/a/kompot/tests` (Playwright Test Framework)

---

## FORBIDDEN OPERATIONS - NEVER USE:
- `git stash` — creates forgotten changes, leads to lost work
- `git rebase` — rewrites history, causes issues on shared branches
- `git push --force` — destroys remote history
- `git reset --hard` — loses uncommitted changes
- `git clean -fd` — permanently deletes untracked files
- `--autostash` flag — same problem as stash
- `-S` or `--gpg-sign` — НЕ подписывать коммиты GPG ключом
- `--no-verify` — НЕ пропускать хуки

---

## COMMIT MESSAGE RULES:

### Язык и формат:
- **Описание на РУССКОМ языке** — подробно что было сделано
- **Тип коммита на английском** — test/feat/fix/refactor/docs/chore
- **Без подписи GPG** — обычные коммиты без криптографической подписи
- **Без упоминания AI/Claude** — не писать что код сгенерирован

### Формат сообщения:
```
type(scope): Краткое описание на русском

Подробное описание изменений на русском языке:
- Что было добавлено/изменено/исправлено
- Какие файлы затронуты
- Почему это было сделано (если не очевидно)
```

### Типы коммитов для тестового проекта:
- `test` — новые тесты или изменения существующих
- `feat` — новый функционал (page objects, fixtures, utils)
- `fix` — исправление багов в тестах или фреймворке
- `refactor` — рефакторинг без изменения функционала
- `docs` — документация (README, комментарии)
- `chore` — конфигурация, зависимости, CI/CD

### Примеры хороших коммитов:
```bash
git commit -m "test(auth): Добавлены тесты для страницы логина

- 11 тестов для проверки формы авторизации
- Проверка валидации полей
- Тесты успешного/неуспешного входа
- Тесты навигации между страницами"
```

```bash
git commit -m "feat(pages): Добавлен Page Object для главной страницы

- HomePage с методами для работы с интерфейсом
- Методы проверки статуса авторизации
- Методы для logout
- Полная типизация всех элементов"
```

```bash
git commit -m "fix(fixtures): Исправлена фикстура автоматической авторизации

- Добавлена проверка наличия environment variables
- Улучшена обработка ошибок при неудачном логине
- Добавлено ожидание загрузки страницы после логина"
```

---

## Step 0: Safety checks

1. **Check current branch**:
   ```bash
   git branch --show-current
   ```
   - If on `main` or `master`, warn user and ask if they want to commit directly

2. **Check for stashed changes** (legacy cleanup):
   ```bash
   git stash list
   ```
   - If stashes exist, **WARN USER**: "You have stashed changes! Apply them first with `git stash pop`"

3. **Check for uncommitted changes**:
   ```bash
   git status
   ```

## Step 1: Pre-commit checks

1. Gather all changes:
   ```bash
   git status
   git diff --stat
   ```

2. Security checks:
   - Scan for secrets, API keys, passwords in .env files
   - Check for merge conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
   ```bash
   git diff | grep -E "^[+-].*(password|secret|api_key|WORKSPACE_ID.*=.*[^example])" || echo "No secrets"
   git diff | grep -E "^[+-].*(<<<<<<<|=======|>>>>>>>)" || echo "No merge markers"
   ```

3. **Environment files check**:
   - Убедиться что `.env` не добавлен в коммит (должен быть только `.env.example`)
   ```bash
   git status --porcelain | grep "^[AM].*\.env$" && echo "⚠️  WARNING: .env file detected!" || echo "✓ No .env in commit"
   ```

4. Group and commit (БЕЗ подписи, на русском):
   ```bash
   git add <files>
   git commit --no-gpg-sign -m "type(scope): Описание на русском

   Подробности что сделано"
   ```

## Step 2: Pre-push Verification

**IMPORTANT**: Проверить тесты и типизацию ПЕРЕД пушем!

### Обязательные проверки:

1. **TypeScript** (быстро, ~10 сек):
   ```bash
   npx tsc --noEmit
   ```
   - Ловит все ошибки типизации
   - Если есть ошибки — ИСПРАВИТЬ перед пушем

   **При обнаружении ошибок TypeScript**:
   - Исправить все найденные проблемы
   - Создать ОТДЕЛЬНЫЙ коммит:
     ```bash
     git add <fixed-files>
     git commit --no-gpg-sign -m "fix(types): Исправлены ошибки TypeScript

     - Добавлены недостающие типы
     - Исправлены импорты
     - Обновлены сигнатуры методов"
     ```
   - Повторить `npx tsc --noEmit` для проверки

2. **Playwright Tests** (опционально, если нужно):
   ```bash
   # Запуск тестов навигации (не требуют авторизации)
   npm test tests/navigation 2>/dev/null || echo "Tests skipped (env not configured)"
   ```
   - Проверяет что тесты не падают
   - Можно пропустить если нет `.env` файла

3. **Dependencies check**:
   ```bash
   npm outdated || echo "Dependencies checked"
   ```
   - Проверка на устаревшие зависимости

### Что ловят эти проверки:

| Проверка | Время | Что ловит |
|----------|-------|-----------|
| `tsc --noEmit` | ~10 сек | Ошибки типов, неправильные импорты, несовместимые сигнатуры |
| `npm test` | ~30 сек | Падающие тесты, ошибки в Page Objects, проблемы с фикстурами |

### Если проверка не прошла:

1. **НЕ ПУШИТЬ** с ошибками
2. Исправить ошибки
3. Сделать отдельный коммит с исправлениями
4. Повторить проверку

## Step 3: Pull remote changes

After verification passes:

```bash
git fetch origin
git status -uno  # Check if behind remote
```

If behind remote:
```bash
git pull --no-rebase --no-autostash
```

This creates a merge commit if needed.

## Step 4: Resolve conflicts (if any)

If merge conflicts occur:
1. Open conflicted files
2. Resolve conflicts manually (keep both changes or choose one)
3. Remove conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
4. Stage resolved files:
   ```bash
   git add <resolved-files>
   ```
5. Complete merge:
   ```bash
   git commit --no-gpg-sign -m "merge: Разрешены конфликты с origin"
   ```
6. **Повторить Step 2** (проверка после merge!)

## Step 5: Push to remote

```bash
git push origin <branch-name>
```

## Step 6: Verify

```bash
git status  # Should show "nothing to commit, working tree clean"
git log -3 --oneline  # Check recent commits
```

---

## Execution order:

```bash
# ============================================
# PROJECT: KOMPOT E2E TESTS
# ============================================
cd /Users/sh/a/kompot/tests

echo "=== Kompot E2E Tests ==="

# Step 0: Safety
git branch --show-current
git stash list
git status

# Step 1: Pre-commit checks and commit
git diff --stat

# Security checks
git diff | grep -E "^[+-].*(password|secret|api_key)" || echo "✓ No secrets"
git diff | grep -E "^[+-].*(<<<<<<<|=======|>>>>>>>)" || echo "✓ No merge markers"
git status --porcelain | grep "^[AM].*\.env$" && echo "⚠️  .env detected!" || echo "✓ No .env"

# ... analyze and commit all changes ...

# Step 2: Verification (ОБЯЗАТЕЛЬНО!)
echo "Running TypeScript check..."
npx tsc --noEmit
# Если ошибки — исправить и сделать отдельный коммит fix(types)

echo "Running tests check..."
npm test tests/navigation 2>/dev/null || echo "Tests skipped"
# Если тесты падают — исправить и сделать коммит fix(test)

# Step 3: Pull after verification
git fetch origin && git status -uno
git pull --no-rebase --no-autostash  # if behind

# Step 4: Resolve conflicts if any
# После merge — повторить tsc --noEmit!

# Step 5: Push
git push origin $(git branch --show-current)

# Step 6: Verify
git status
git log -3 --oneline

# ============================================
# FINAL SUMMARY
# ============================================
```

---

## Correct workflow order:

```
1. git status              # Смотрим что изменилось
2. git add + commit        # Коммитим изменения (без GPG, на русском)
3. npx tsc --noEmit        # Проверяем TypeScript
   → Если ошибки: исправить + отдельный коммит fix(types)
4. npm test (optional)     # Запускаем тесты
   → Если падают: исправить + коммит fix(test)
5. git fetch               # Проверяем remote
6. git pull --no-rebase    # Тянем изменения (merge)
7. npx tsc --noEmit        # Повторяем проверку после merge
8. git push                # Пушим ТОЛЬКО после успешных проверок
```

**ВАЖНО: Цикл исправления ошибок**
```
┌─────────────────────────────────────────┐
│         npx tsc --noEmit                │
└─────────────────┬───────────────────────┘
                  │
         ┌────────▼────────┐
         │  Проверка OK?   │
         └────────┬────────┘
                  │
        ┌─────────┴─────────┐
        │ НЕТ               │ ДА
        ▼                   ▼
   Исправить ошибки    git push ✓
        │
   git commit fix(types)
        │
        └──────► Повторить проверку
```

**WHY this order?**
- Your work is saved in a commit — can't be lost
- Type errors caught BEFORE they break CI/CD
- Tests verified BEFORE pushing
- Git won't pull with uncommitted changes anyway
- Conflicts are resolved in merge, not in working directory
- No need for dangerous stash operations
- **CI/CD никогда не получит сломанный код**

---

## Summary output format:

```
✅ COMMIT SUMMARY
================

📦 Kompot E2E Tests
   Branch: main
   Коммиты:
   - test(auth): Добавлены тесты для страницы логина
   - feat(pages): Добавлен HomePage Page Object
   - fix(types): Исправлены ошибки TypeScript (если были)
   - fix(test): Исправлены падающие тесты (если были)
   TypeScript: ✓ (0 errors)
   Tests: ✓ (passed) / ⚠️ (skipped - no .env)
   Pulled: Да (без конфликтов)
   Pushed: ✓

📊 Stats:
   - Файлов изменено: N
   - Строк добавлено: +N
   - Строк удалено: -N
   - Тестов добавлено: N
```

---

## Common test project scenarios:

### Scenario 1: Добавление новых тестов
```bash
# 1. Написать тесты
# 2. Коммит
git add tests/
git commit --no-gpg-sign -m "test(navigation): Добавлены тесты для меню навигации

- 5 новых тестов для проверки меню
- Проверка активных элементов
- Тесты для dropdown меню"

# 3. Проверка
npx tsc --noEmit
npm test tests/navigation

# 4. Push
git pull --no-rebase && git push
```

### Scenario 2: Добавление нового Page Object
```bash
# 1. Создать Page Object
# 2. Коммит
git add pages/DashboardPage.ts
git commit --no-gpg-sign -m "feat(pages): Добавлен DashboardPage

- Локаторы для всех элементов дашборда
- Методы для взаимодействия с виджетами
- Типизация всех методов"

# 3. Проверка
npx tsc --noEmit

# 4. Push
git pull --no-rebase && git push
```

### Scenario 3: Обновление документации
```bash
git add README.md
git commit --no-gpg-sign -m "docs: Обновлена документация по запуску тестов

- Добавлены примеры для CI/CD
- Обновлены команды запуска
- Добавлены troubleshooting секции"

git pull --no-rebase && git push
```

### Scenario 4: Обновление зависимостей
```bash
# Обновить package.json
npm update @playwright/test

git add package.json package-lock.json
git commit --no-gpg-sign -m "chore(deps): Обновлен Playwright до последней версии

- Playwright 1.49.0 → 1.50.0
- Исправлены breaking changes в API
- Обновлена документация"

npx tsc --noEmit
git pull --no-rebase && git push
```
