# Data Test ID Specification

Спецификация `data-testid` атрибутов для E2E тестирования платформы Kompot.

## Паттерн именования

```
{module}-{component}-{element}
```

Где:
- **module**: название модуля (login, contacts, opportunities, agreements, templates)
- **component**: тип компонента (form, table, button, input, select, etc.)
- **element**: конкретный элемент (name, email, submit, cancel, etc.)

Примеры:
- `contacts-form-input-name`
- `opportunities-button-create`
- `agreements-table-row-edit`

---

## 1. Login Page

### Форма входа
| Элемент | data-testid | Тип |
|---------|-------------|-----|
| Форма | `login-form` | form |
| Workspace ID | `login-input-wsid` | input |
| Email | `login-input-email` | input |
| Password | `login-input-password` | input |
| Submit button | `login-button-submit` | button |
| Error message | `login-error` | div |

### Admin Login
| Элемент | data-testid | Тип |
|---------|-------------|-----|
| Форма | `admin-login-form` | form |
| Email | `admin-login-input-email` | input |
| Password | `admin-login-input-password` | input |
| Submit | `admin-login-button-submit` | button |

---

## 2. Contacts Module

### Страница списка
| Элемент | data-testid | Тип |
|---------|-------------|-----|
| Заголовок | `contacts-heading` | h1 |
| Таблица | `contacts-table` | table |
| Поиск | `contacts-input-search` | input |
| Кнопка создания | `contacts-button-create` | button |
| Empty state | `contacts-empty-state` | div |

### Форма создания/редактирования
| Элемент | data-testid | Тип |
|---------|-------------|-----|
| Контейнер формы | `contact-form` | form |
| Имя | `contact-form-input-name` | input |
| Компания | `contact-form-input-company` | input |
| Должность | `contact-form-input-position` | input |
| Заметки | `contact-form-input-notes` | textarea |
| Email (индекс) | `contact-form-input-email-{i}` | input |
| Телефон (индекс) | `contact-form-input-phone-{i}` | input |
| Telegram (индекс) | `contact-form-input-telegram-{i}` | input |
| Тип контакта | `contact-form-select-type` | select |
| Источник | `contact-form-select-source` | select |
| Владелец | `contact-form-select-owner` | select |
| + Add Email | `contact-form-button-addEmail` | button |
| + Add Phone | `contact-form-button-addPhone` | button |
| + Add Address | `contact-form-button-addAddress` | button |
| Submit | `contact-form-button-submit` | button |
| Cancel | `contact-form-button-cancel` | button |

### Адрес (индекс i)
| Элемент | data-testid | Тип |
|---------|-------------|-----|
| Line 1 | `contact-form-input-address-{i}-line1` | input |
| Line 2 | `contact-form-input-address-{i}-line2` | input |
| City | `contact-form-input-address-{i}-city` | input |
| State | `contact-form-input-address-{i}-state` | input |
| ZIP | `contact-form-input-address-{i}-zip` | input |
| Country | `contact-form-select-address-{i}-country` | select |

### Действия в таблице
| Элемент | data-testid | Тип |
|---------|-------------|-----|
| Строка | `contacts-table-row-{id}` | tr |
| View button | `contacts-row-button-view` | button |
| Edit button | `contacts-row-button-edit` | button |
| Delete button | `contacts-row-button-delete` | button |

### Badges (inline edit)
| Элемент | data-testid | Тип |
|---------|-------------|-----|
| Type badge | `contacts-badge-type` | button |
| Source badge | `contacts-badge-source` | button |
| Badge popover | `contacts-badge-popover` | div |
| Badge option | `contacts-badge-option-{value}` | button |
| Badge clear | `contacts-badge-clear` | button |

### Quick View Panel
| Элемент | data-testid | Тип |
|---------|-------------|-----|
| Panel | `contact-preview-panel` | aside |
| Close button | `contact-preview-close` | button |
| Name | `contact-preview-name` | h2 |
| Edit button | `contact-preview-button-edit` | button |

---

## 3. Opportunities Module

### Страница списка
| Элемент | data-testid | Тип |
|---------|-------------|-----|
| Заголовок | `opportunities-heading` | h1 |
| Таблица | `opportunities-table` | table |
| Поиск | `opportunities-input-search` | input |
| Кнопка создания | `opportunities-button-create` | button |
| Pipeline tabs | `opportunities-tabs-pipeline` | div |
| Pipeline tab | `opportunities-tab-{pipelineSlug}` | button |
| View toggle (Table) | `opportunities-toggle-table` | button |
| View toggle (Kanban) | `opportunities-toggle-kanban` | button |
| Empty state | `opportunities-empty-state` | div |

### Форма создания/редактирования
| Элемент | data-testid | Тип |
|---------|-------------|-----|
| Контейнер | `opportunity-form` | form |
| Name | `opportunity-form-input-name` | input |
| Amount | `opportunity-form-input-amount` | input |
| Description | `opportunity-form-input-description` | textarea |
| External ID | `opportunity-form-input-externalId` | input |
| Expected Close | `opportunity-form-input-expectedClose` | button (date picker trigger) |
| Pipeline | `opportunity-form-select-pipeline` | combobox |
| Stage | `opportunity-form-select-stage` | combobox |
| Priority | `opportunity-form-select-priority` | combobox |
| Source | `opportunity-form-select-source` | combobox |
| Contact | `opportunity-form-select-contact` | combobox |
| Owner | `opportunity-form-select-owner` | combobox |
| Archived | `opportunity-form-checkbox-archived` | checkbox |
| Submit | `opportunity-form-button-submit` | button |
| Cancel | `opportunity-form-button-cancel` | button |

### Действия в таблице
| Элемент | data-testid | Тип |
|---------|-------------|-----|
| View button | `opportunities-row-button-view` | a |
| Edit button | `opportunities-row-button-edit` | button |
| Delete button | `opportunities-row-button-delete` | button |

### Inline Badges
| Элемент | data-testid | Тип |
|---------|-------------|-----|
| Stage badge | `opportunities-badge-stage` | button |
| Priority badge | `opportunities-badge-priority` | button |
| Source badge | `opportunities-badge-source` | button |

---

## 4. Agreements Module

### Страница списка
| Элемент | data-testid | Тип |
|---------|-------------|-----|
| Заголовок | `agreements-heading` | h1 |
| Таблица | `agreements-table` | table |
| Кнопка создания | `agreements-button-create` | button |
| Empty state | `agreements-empty-state` | div |

### Форма создания
| Элемент | data-testid | Тип |
|---------|-------------|-----|
| Контейнер | `agreement-form` | form |
| Template select | `agreement-form-select-template` | combobox |
| Title | `agreement-form-input-title` | input |
| Type | `agreement-form-select-type` | select |
| Description | `agreement-form-input-description` | textarea |
| Submit | `agreement-form-button-submit` | button |
| Cancel | `agreement-form-button-cancel` | button |

### Секция подписантов (Signers)
| Элемент | data-testid | Тип |
|---------|-------------|-----|
| Контейнер | `agreement-form-signers` | div |
| Signer row (order) | `agreement-form-signer-{order}` | div |
| Role label | `agreement-form-signer-{order}-role` | span |
| Contact input | `agreement-form-signer-{order}-contact` | combobox |
| Contact email | `agreement-form-signer-{order}-email` | span |
| Contact phone | `agreement-form-signer-{order}-phone` | span |

### Document Fields секция
| Элемент | data-testid | Тип |
|---------|-------------|-----|
| Контейнер | `agreement-form-documentFields` | div |
| Field input | `agreement-form-field-{fieldName}` | input |

### Страница просмотра
| Элемент | data-testid | Тип |
|---------|-------------|-----|
| Номер | `agreement-view-number` | span |
| Title | `agreement-view-title` | h1 |
| Status | `agreement-view-status` | span |
| Type | `agreement-view-type` | span |
| PDF Container | `agreement-view-pdf` | div |
| PDF Page button | `agreement-view-pdf-page-{n}` | button |
| Signers section | `agreement-view-signers` | div |
| Signer card | `agreement-view-signer-{index}` | div |
| Send for signature | `agreement-button-sendForSignature` | button |
| Edit button | `agreement-button-edit` | button |
| Delete button | `agreement-button-delete` | button |

### PDF Field Overlays
| Элемент | data-testid | Тип |
|---------|-------------|-----|
| Field overlay | `agreement-field-{fieldType}-{index}` | div |
| Signature field | `agreement-field-signature-{index}` | div |
| Text field | `agreement-field-text-{index}` | div |
| Date field | `agreement-field-date-{index}` | div |

---

## 5. Agreement Templates Module

### Страница списка
| Элемент | data-testid | Тип |
|---------|-------------|-----|
| Заголовок | `templates-heading` | h1 |
| Таблица | `templates-table` | table |
| Кнопка создания | `templates-button-create` | button |
| Empty state | `templates-empty-state` | div |

### Форма создания
| Элемент | data-testid | Тип |
|---------|-------------|-----|
| Контейнер | `template-form` | form |
| Name | `template-form-input-name` | input |
| Description | `template-form-input-description` | textarea |
| PDF upload | `template-form-input-file` | input[type=file] |
| Submit | `template-form-button-submit` | button |
| Cancel | `template-form-button-cancel` | button |

### Редактор шаблона
| Элемент | data-testid | Тип |
|---------|-------------|-----|
| Editor container | `template-editor` | div |
| PDF Viewer | `template-editor-pdf` | div |
| PDF Page prev | `template-editor-pdf-prev` | button |
| PDF Page next | `template-editor-pdf-next` | button |
| PDF Page indicator | `template-editor-pdf-page` | span |
| Toolbar | `template-editor-toolbar` | div |
| Save button | `template-editor-button-save` | button |

### Поля (Fields)
| Элемент | data-testid | Тип |
|---------|-------------|-----|
| Fields panel | `template-editor-fields` | div |
| Add field button | `template-editor-button-addField` | button |
| Field type option | `template-editor-fieldType-{type}` | button |
| Field on canvas | `template-editor-field-{id}` | div |
| Field properties | `template-editor-fieldProps` | div |
| Field label input | `template-editor-fieldProps-label` | input |
| Field required | `template-editor-fieldProps-required` | checkbox |
| Delete field | `template-editor-button-deleteField` | button |

### Signatories (Roles)
| Элемент | data-testid | Тип |
|---------|-------------|-----|
| Signatories panel | `template-editor-signatories` | div |
| Add signatory | `template-editor-button-addSignatory` | button |
| Signatory row | `template-editor-signatory-{order}` | div |
| Signatory name | `template-editor-signatory-{order}-name` | input |
| Delete signatory | `template-editor-signatory-{order}-delete` | button |

---

## 6. Common Components

### Confirmation Dialog
| Элемент | data-testid | Тип |
|---------|-------------|-----|
| Dialog | `confirm-dialog` | dialog |
| Title | `confirm-dialog-title` | h2 |
| Message | `confirm-dialog-message` | p |
| Confirm button | `confirm-dialog-button-confirm` | button |
| Cancel button | `confirm-dialog-button-cancel` | button |

### Toast Notifications
| Элемент | data-testid | Тип |
|---------|-------------|-----|
| Container | `toast-container` | div |
| Toast | `toast` | div |
| Success toast | `toast-success` | div |
| Error toast | `toast-error` | div |
| Warning toast | `toast-warning` | div |
| Close button | `toast-close` | button |

### Navigation
| Элемент | data-testid | Тип |
|---------|-------------|-----|
| Sidebar | `nav-sidebar` | nav |
| Header | `nav-header` | header |
| User menu | `nav-user-menu` | button |
| Logout | `nav-button-logout` | button |

### Loading States
| Элемент | data-testid | Тип |
|---------|-------------|-----|
| Page loader | `loader-page` | div |
| Spinner | `loader-spinner` | div |
| Skeleton | `loader-skeleton` | div |

### Empty States
| Элемент | data-testid | Тип |
|---------|-------------|-----|
| Container | `empty-state` | div |
| Title | `empty-state-title` | h3 |
| Description | `empty-state-description` | p |
| Action button | `empty-state-action` | button |

---

## 7. Public Signing Page

| Элемент | data-testid | Тип |
|---------|-------------|-----|
| Container | `signing-page` | div |
| Verification form | `signing-verification-form` | form |
| Code input | `signing-input-code` | input |
| Verify button | `signing-button-verify` | button |
| Document preview | `signing-document` | div |
| Signature pad | `signing-signature-pad` | canvas |
| Clear signature | `signing-button-clearSignature` | button |
| Submit signing | `signing-button-submit` | button |
| Success message | `signing-success` | div |

---

## Приоритеты внедрения

### P0 - Critical (блокируют основные тесты)
- Login form elements
- Create buttons (contacts, opportunities, agreements)
- Form inputs (name, email, phone)
- Submit/Cancel buttons
- Table containers

### P1 - High (нужны для полного покрытия CRUD)
- Edit/Delete row buttons
- Select/Combobox elements
- Quick view panels
- Confirmation dialogs

### P2 - Medium (улучшают стабильность тестов)
- Badge elements
- Status indicators
- Toast notifications
- Empty states

### P3 - Low (nice to have)
- Navigation elements
- Loading states
- Pagination controls

---

## Checklist для разработчиков

При добавлении `data-testid`:

1. **Используйте точные имена из этой спецификации**
2. **Добавляйте на интерактивные элементы** (buttons, inputs, links)
3. **Добавляйте на контейнеры** для проверки видимости (forms, panels, dialogs)
4. **Для динамических элементов** используйте индексы: `element-{i}` или `element-{id}`
5. **Не меняйте существующие testid** без согласования с QA

---

## Пример использования в тестах

```typescript
// Playwright
await page.getByTestId('contacts-button-create').click();
await page.getByTestId('contact-form-input-name').fill('John Doe');
await page.getByTestId('contact-form-button-submit').click();
await expect(page.getByTestId('toast-success')).toBeVisible();
```

```typescript
// Проверка формы opportunity
await page.getByTestId('opportunities-button-create').click();
await page.getByTestId('opportunity-form-input-name').fill('New Deal');
await page.getByTestId('opportunity-form-input-amount').fill('10000');
await page.getByTestId('opportunity-form-select-contact').click();
// ... select contact from dropdown
await page.getByTestId('opportunity-form-button-submit').click();
```
