# Kompot E2E Tests

## Для тестировщиков

### Шаг 1: Создайте workspace на Stage (один раз)

Откройте https://kompot-stage.up.railway.app/account/register

Придумайте свой **Workspace ID** (например: `tester-ivan`) и используйте его для регистрации:

| Поле | Значение | Пример |
|------|----------|--------|
| Name | Любое | Ivan Tester |
| Email | `{WS_ID}-owner@kompot.ai` | `tester-ivan-owner@kompot.ai` |
| Password | `{WS_ID}Owner123!` | `tester-ivanOwner123!` |
| Workspace ID | Ваш WS_ID | `tester-ivan` |

> **Важно:** Используйте именно этот формат email и пароля — тесты генерируют их автоматически из Workspace ID.

### Шаг 2: Настройте окружение

```bash
git clone git@github.com:kompotai/tests.git
cd tests
npm install
npx playwright install chromium
```

Создайте файл `.env`:

```env
BASE_URL=https://kompot-stage.up.railway.app
WS_ID=tester-ivan
```

### Шаг 3: Запустите тесты

```bash
npm test
```

### Что произойдёт

При запуске тесты:
1. Проверят наличие `WS_ID` в `.env`
2. Сгенерируют credentials: `{WS_ID}-owner@kompot.ai` / `{WS_ID}Owner123!`
3. Войдут в ваш существующий workspace
4. Выполнят UI тесты

Если workspace не существует или credentials неверные — тесты упадут на этапе логина.

---

## Режимы работы

| Режим | Когда | Что происходит |
|-------|-------|----------------|
| **Tester** | Нет `MONGODB_URI` | Вход в существующий workspace, только UI тесты |
| **CI** | Есть `MONGODB_URI` | Полный цикл: очистка → создание → все тесты |

В Tester Mode пропускаются:
- Super Admin тесты (SA1, SA2)
- Создание workspace (уже существует)
- Проверки в базе данных (REG1-REG3)

---

## Полезные команды

| Команда | Что делает |
|---------|------------|
| `npm test` | Запуск тестов |
| `npm run test:headed` | С видимым браузером |
| `npm run test:ui` | Интерактивный режим |
| `npm run report` | Открыть отчёт |

---

## Troubleshooting

**Тест падает на логине**
- Workspace не создан на Stage
- Email или пароль не соответствуют формату `{WS_ID}-owner@kompot.ai` / `{WS_ID}Owner123!`

**Ошибка "WS_ID не задан"**
- Создайте файл `.env` с `WS_ID=ваш-workspace-id`
