# Быстрый старт

Это руководство поможет вам начать работу с тестовым фреймворком Kompot за 5 минут.

## 1. Установка (2 минуты)

```bash
# Установите зависимости
npm install

# Установите браузеры Playwright
npx playwright install
```

## 2. Настройка учетных данных (1 минута)

Создайте файл `.env` в корне проекта:

```bash
cp .env.example .env
```

Отредактируйте `.env` и укажите ваши тестовые данные:

```env
BASE_URL=https://kompot-stage.up.railway.app
WORKSPACE_ID=your_test_workspace
TEST_USER_EMAIL=your_test_email@example.com
TEST_USER_PASSWORD=your_test_password
```

## 3. Первый запуск (1 минута)

Запустите тесты навигации (не требуют авторизации):

```bash
npx playwright test tests/navigation
```

## 4. Запуск всех тестов

После настройки учетных данных запустите все тесты:

```bash
npm test
```

## 5. Просмотр результатов

Откройте отчет в браузере:

```bash
npm run report
```

## Полезные команды

### Разработка тестов

```bash
# Запуск в UI режиме (удобно для разработки)
npm run test:ui

# Запуск с отображением браузера
npm run test:headed

# Режим отладки
npm run test:debug

# Генерация тестов (запись действий)
npm run codegen
```

### Запуск конкретных тестов

```bash
# Только тесты авторизации
npx playwright test tests/auth

# Только тесты навигации
npx playwright test tests/navigation

# Только тесты форм
npx playwright test tests/forms

# Конкретный файл
npx playwright test tests/auth/login.spec.ts

# Тест по названию
npx playwright test -g "should successfully login"
```

### Запуск в разных браузерах

```bash
# Chrome
npm run test:chrome

# Firefox
npm run test:firefox

# Safari
npm run test:webkit

# Все браузеры
npm test
```

## Пример: Написание своего теста

Создайте файл `tests/my-test.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('my first test', async ({ page }) => {
  // Открыть главную страницу
  await page.goto('/');

  // Проверить заголовок
  await expect(page).toHaveTitle(/Kompot/);

  // Кликнуть на кнопку Sign In
  await page.getByRole('link', { name: 'Sign In' }).click();

  // Проверить, что перешли на страницу логина
  await expect(page).toHaveURL(/login/);
});
```

Запустите ваш тест:

```bash
npx playwright test tests/my-test.spec.ts --headed
```

## Пример: Тест с Page Objects

Создайте файл `tests/my-page-object-test.spec.ts`:

```typescript
import { test, expect } from '../fixtures/auth.fixture';

test('login with page objects', async ({ loginPage, homePage }) => {
  // Перейти на страницу логина
  await loginPage.goto();

  // Войти с тестовыми данными
  await loginPage.login(
    process.env.WORKSPACE_ID!,
    process.env.TEST_USER_EMAIL!,
    process.env.TEST_USER_PASSWORD!
  );

  // Проверить успешный вход
  await loginPage.waitForSuccessfulLogin();
  const isLoggedIn = await homePage.isLoggedIn();
  expect(isLoggedIn).toBeTruthy();
});
```

## Пример: Тест с автоматической авторизацией

Для тестов, требующих авторизованного пользователя:

```typescript
import { test, expect } from '../fixtures/auth.fixture';

test('test with auto login', async ({ authenticatedPage, page }) => {
  // Пользователь уже авторизован!
  // Просто переходите к тестированию функционала

  await page.goto('/dashboard');
  await expect(page).toHaveURL(/dashboard/);
});
```

## Отладка упавшего теста

Если тест упал:

1. Посмотрите скриншот в папке `test-results/`
2. Посмотрите видео (если включено)
3. Откройте trace для детального анализа:

```bash
npx playwright show-trace test-results/.../trace.zip
```

## Следующие шаги

1. Прочитайте полный [README.md](README.md)
2. Изучите существующие тесты в папке `tests/`
3. Посмотрите Page Objects в папке `pages/`
4. Изучите [документацию Playwright](https://playwright.dev)

## Нужна помощь?

- Проверьте, что `.env` файл заполнен корректно
- Убедитесь, что тестовые данные валидны
- Посмотрите логи выполнения тестов
- Запустите с флагом `--headed` чтобы видеть браузер
- Используйте `--debug` для пошаговой отладки
