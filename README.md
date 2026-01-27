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

Запуск:

```bash
npm test
```

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
- Email или пароль в `.env` не совпадают с данными при регистрации

**Ошибка "WS_OWNER_EMAIL и WS_OWNER_PASSWORD не заданы"**
- Добавьте в `.env` ваши реальные credentials (Tester Mode)

**Ошибка "WS_ID не задан"**
- Добавьте `WS_ID=ваш-workspace-id` в `.env`
