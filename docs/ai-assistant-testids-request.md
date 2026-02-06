# Запрос: data-testid для AI Assistant

Для написания E2E тестов AI Assistant нужно добавить `data-testid` атрибуты.

## Паттерн именования

```
{module}-{component}-{element}
```

Используем модуль: `ai-assistant`

---

## AI Assistant - Чат (панель справа)

| Элемент | data-testid | Тип |
|---------|-------------|-----|
| Кнопка открытия (в header) | `ai-assistant-button-open` | button |
| Панель/окно чата | `ai-assistant-panel` | aside/div |
| Кнопка закрытия (×) | `ai-assistant-button-close` | button |
| Кнопка свернуть (−) | `ai-assistant-button-minimize` | button |
| Контейнер с сообщениями | `ai-assistant-messages` | div |
| Поле ввода сообщения | `ai-assistant-input-message` | input |
| Кнопка отправки | `ai-assistant-button-send` | button |

---

## AI Assistant - Settings (страница настроек)

| Элемент | data-testid | Тип |
|---------|-------------|-----|
| Таб Claude | `ai-assistant-tab-claude` | button |
| Таб GPT | `ai-assistant-tab-gpt` | button |
| Таб Gemini | `ai-assistant-tab-gemini` | button |
| Dropdown выбора модели | `ai-assistant-select-model` | select/combobox |
| Поле API Key | `ai-assistant-input-apikey` | input |
| Показать/скрыть ключ (глазик) | `ai-assistant-button-togglekey` | button |
| Ссылка на получение ключа (стрелка) | `ai-assistant-link-getkey` | a |
| Поле System Prompt | `ai-assistant-input-prompt` | textarea |
| Кнопка Save and activate | `ai-assistant-button-save` | button |

---

## Всего: 16 элементов

## Пример использования в тестах

```typescript
// Открытие AI Assistant
await page.getByTestId('ai-assistant-button-open').click();
await expect(page.getByTestId('ai-assistant-panel')).toBeVisible();

// Отправка сообщения
await page.getByTestId('ai-assistant-input-message').fill('Hello');
await page.getByTestId('ai-assistant-button-send').click();

// Смена модели в настройках
await page.getByTestId('ai-assistant-tab-gpt').click();
await page.getByTestId('ai-assistant-select-model').click();
```

## Проверка

После добавления, можно проверить в браузере:
```javascript
document.querySelector('[data-testid="ai-assistant-button-open"]')
```

Должен вернуть элемент, а не null.
