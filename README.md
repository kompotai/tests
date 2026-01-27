# Kompot E2E Tests

## Для тестировщиков

### Шаг 1: Создайте workspace на Stage

Откройте https://kompot-stage.up.railway.app/account/register и зарегистрируйтесь.

При регистрации:
- Придумайте **Workspace ID** (например: `tester-ivan`)
- Используйте любой email и пароль

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
WS_OWNER_EMAIL=your-email@example.com
WS_OWNER_PASSWORD=your-password
```

### Шаг 3: Запустите тесты

```bash
npm test
```

---

## Для разработчиков

### Локальная разработка (CI Mode)

Создайте `.env` с полным набором переменных:

```env
# Обязательные
BASE_URL=http://localhost:3000
WS_ID=megatest
MONGODB_URI=mongodb://kompot:kompot@localhost:27017/?authSource=admin

# Для Super Admin тестов
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=your-password
```

### Запуск тестов

```bash
# Первый раз (создаёт workspace)
npm run test:setup

# Потом
npm test
```

Если тесты падают на логине — снова `npm run test:setup`.

### GitHub Actions

CI использует Doppler с конфигом `stagetest`:

```bash
doppler run --project kompot --config stagetest -- npx playwright test
```

Переменные в Doppler `stagetest`:

| Переменная | Описание |
|------------|----------|
| `BASE_URL` | https://kompot-stage.up.railway.app |
| `WS_ID` | megatest |
| `MONGODB_URI` | Stage MongoDB connection string |
| `SUPER_ADMIN_EMAIL` | Super admin email |
| `SUPER_ADMIN_PASSWORD` | Super admin password |

---

## Режимы работы

| Режим | Когда | Что происходит |
|-------|-------|----------------|
| **Tester** | Нет `MONGODB_URI` | Вход в существующий workspace, только UI тесты |
| **Developer** | Есть `MONGODB_URI` | Полный набор тестов с проверками в БД |

**Для тестировщиков** пропускаются:
- Super Admin тесты
- Создание workspace (уже существует)
- Проверки в базе данных

---

## Команды

| Команда | Описание |
|---------|----------|
| `npm test` | Запуск тестов |
| `npm run test:setup` | Создать workspace с нуля |
| `npm run test:headed` | С видимым браузером |
| `npm run test:ui` | Интерактивный режим |
| `npm run report` | Открыть отчёт |

---

## Проблемы

| Ошибка | Решение |
|--------|---------|
| Тест падает на логине | `npm run test:setup` (разработчики) или проверить `.env` (тестировщики) |
| "Invalid email or password" | `npm run test:setup` |
| "WS_ID не задан" | Добавить `WS_ID=...` в `.env` |
