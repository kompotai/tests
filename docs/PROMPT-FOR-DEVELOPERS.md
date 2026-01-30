# Prompt для добавления data-testid

Скопируй этот prompt и отдай разработчикам для выполнения в Claude Code или Cursor.

---

## Prompt

```
Добавь data-testid атрибуты для E2E тестирования согласно спецификации ниже.

## Паттерн именования
{module}-{component}-{element}

Примеры:
- contacts-button-create
- opportunity-form-input-name
- agreement-form-select-template

## OPPORTUNITIES MODULE (приоритет)

### Форма создания/редактирования Opportunity

Найди компонент формы opportunity и добавь следующие data-testid:

| Элемент | data-testid |
|---------|-------------|
| Pipeline combobox | opportunity-form-select-pipeline |
| Stage combobox | opportunity-form-select-stage |
| Priority combobox | opportunity-form-select-priority |
| Source combobox | opportunity-form-select-source |
| Contact combobox | opportunity-form-select-contact |
| Owner combobox | opportunity-form-select-owner |
| Expected Close (date picker trigger) | opportunity-form-input-expectedClose |

Примечание: testid нужно добавлять на сам combobox/input элемент, чтобы Playwright мог найти его через getByTestId().

### Страница списка Opportunities

| Элемент | data-testid |
|---------|-------------|
| Заголовок h1 | opportunities-heading |
| Таблица | opportunities-table |
| Поле поиска | opportunities-input-search |
| Pipeline tabs container | opportunities-tabs-pipeline |
| Кнопка Table view | opportunities-toggle-table |
| Кнопка Kanban view | opportunities-toggle-kanban |
| Empty state | opportunities-empty-state |

### Действия в строке таблицы

| Элемент | data-testid |
|---------|-------------|
| View/Open button | opportunities-row-button-view |
| Edit button | opportunities-row-button-edit |
| Delete button | opportunities-row-button-delete |

### Inline badges (в ячейках таблицы)

| Элемент | data-testid |
|---------|-------------|
| Stage badge | opportunities-badge-stage |
| Priority badge | opportunities-badge-priority |
| Source badge | opportunities-badge-source |

---

## CONTACTS MODULE

### Форма контакта

| Элемент | data-testid |
|---------|-------------|
| Type select | contact-form-select-type |
| Source select | contact-form-select-source |
| Owner select | contact-form-select-owner |
| Telegram input (индекс i) | contact-form-input-telegram-{i} |

### Страница списка

| Элемент | data-testid |
|---------|-------------|
| Заголовок | contacts-heading |
| Поле поиска | contacts-input-search |
| Empty state | contacts-empty-state |

### Действия в строке

| Элемент | data-testid |
|---------|-------------|
| View button | contacts-row-button-view |
| Edit button | contacts-row-button-edit |
| Delete button | contacts-row-button-delete |

### Badges

| Элемент | data-testid |
|---------|-------------|
| Type badge | contacts-badge-type |
| Source badge | contacts-badge-source |
| Badge popover | contacts-badge-popover |
| Clear button | contacts-badge-clear |

### Quick View Panel

| Элемент | data-testid |
|---------|-------------|
| Panel container | contact-preview-panel |
| Close button | contact-preview-close |
| Name | contact-preview-name |
| Edit button | contact-preview-button-edit |

---

## AGREEMENTS MODULE

### Форма создания

| Элемент | data-testid |
|---------|-------------|
| Template select | agreement-form-select-template |
| Title input | agreement-form-input-title |
| Type select | agreement-form-select-type |
| Description | agreement-form-input-description |
| Submit | agreement-form-button-submit |
| Cancel | agreement-form-button-cancel |

### Секция подписантов (в форме)

| Элемент | data-testid |
|---------|-------------|
| Container | agreement-form-signers |
| Signer row | agreement-form-signer-{order} |
| Role label | agreement-form-signer-{order}-role |
| Contact combobox | agreement-form-signer-{order}-contact |

### Страница списка

| Элемент | data-testid |
|---------|-------------|
| Заголовок | agreements-heading |
| Таблица | agreements-table |
| Create button | agreements-button-create |
| Empty state | agreements-empty-state |

### Страница просмотра

| Элемент | data-testid |
|---------|-------------|
| Number | agreement-view-number |
| Title | agreement-view-title |
| Status | agreement-view-status |
| PDF container | agreement-view-pdf |
| PDF page button | agreement-view-pdf-page-{n} |
| Signers section | agreement-view-signers |
| Signer card | agreement-view-signer-{index} |
| Send for signature | agreement-button-sendForSignature |
| Edit | agreement-button-edit |
| Delete | agreement-button-delete |

---

## AGREEMENT TEMPLATES MODULE

### Редактор шаблона

| Элемент | data-testid |
|---------|-------------|
| Editor container | template-editor |
| PDF viewer | template-editor-pdf |
| Prev page | template-editor-pdf-prev |
| Next page | template-editor-pdf-next |
| Page indicator | template-editor-pdf-page |
| Save button | template-editor-button-save |
| Add field button | template-editor-button-addField |
| Field type option | template-editor-fieldType-{type} |
| Field on canvas | template-editor-field-{id} |
| Field properties panel | template-editor-fieldProps |
| Add signatory | template-editor-button-addSignatory |
| Signatory row | template-editor-signatory-{order} |

---

## COMMON COMPONENTS

### Confirmation Dialog

| Элемент | data-testid |
|---------|-------------|
| Dialog | confirm-dialog |
| Title | confirm-dialog-title |
| Message | confirm-dialog-message |
| Confirm | confirm-dialog-button-confirm |
| Cancel | confirm-dialog-button-cancel |

### Toast Notifications

| Элемент | data-testid |
|---------|-------------|
| Container | toast-container |
| Success | toast-success |
| Error | toast-error |
| Warning | toast-warning |
| Close | toast-close |

### Navigation

| Элемент | data-testid |
|---------|-------------|
| Sidebar | nav-sidebar |
| Header | nav-header |
| User menu | nav-user-menu |
| Logout | nav-button-logout |

---

## Правила

1. Добавляй testid на интерактивные элементы (buttons, inputs, selects)
2. Для combobox добавляй testid на сам combobox элемент или его wrapper
3. Для динамических списков используй индексы: element-{i} или element-{order}
4. Не удаляй существующие testid
5. После добавления проверь что Playwright находит элемент:
   ```typescript
   await page.getByTestId('opportunity-form-select-pipeline').click();
   ```

## Проверка

После добавления, разработчик может проверить в браузере:
```javascript
document.querySelector('[data-testid="opportunity-form-select-pipeline"]')
```

Должен вернуть элемент, а не null.
```

---

## Быстрая версия (только Opportunities)

Если нужно срочно только для Opportunities:

```
Добавь data-testid в форму создания/редактирования Opportunity:

1. opportunity-form-select-pipeline - на Pipeline combobox
2. opportunity-form-select-stage - на Stage combobox
3. opportunity-form-select-priority - на Priority combobox
4. opportunity-form-select-source - на Source combobox
5. opportunity-form-select-contact - на Contact combobox
6. opportunity-form-select-owner - на Owner combobox
7. opportunity-form-input-expectedClose - на Expected Close date picker

Уже есть (не трогать):
- opportunity-form-input-name
- opportunity-form-input-amount
- opportunity-form-input-description
- opportunity-form-input-externalId
- opportunity-form-checkbox-archived
- opportunity-form-button-submit
- opportunity-form-button-cancel
```
