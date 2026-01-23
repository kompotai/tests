# Story: Contacts

## Overview
Contact management including CRUD operations, search, and relationships.

## User Stories

### C1: View Contacts List
As a user, I want to view my contacts so that I can find contact information.

#### Acceptance Criteria
- [x] **AC1**: User can see contacts list after login
- [x] **AC2**: Contacts display name, email, phone
- [x] **AC3**: Empty state shown when no contacts
- [ ] **AC4**: Pagination works for large lists

### C2: Create Contact
As a user, I want to create new contacts so that I can store their information.

#### Acceptance Criteria
- [x] **AC1**: User can open contact creation form
- [x] **AC2**: User can create contact with name only (minimal)
- [ ] **AC3**: User can create contact with all fields
- [ ] **AC4**: Validation errors shown for invalid data
- [x] **AC5**: Created contact appears in list

### C3: Edit Contact
As a user, I want to edit contacts so that I can update their information.

#### Acceptance Criteria
- [x] **AC1**: User can open contact edit form
- [x] **AC2**: Form shows current contact data
- [x] **AC3**: User can save changes
- [x] **AC4**: Changes reflected immediately

### C4: Delete Contact
As a user, I want to delete contacts so that I can remove outdated records.

#### Acceptance Criteria
- [ ] **AC1**: User sees delete confirmation (skipped - button not visible)
- [ ] **AC2**: Contact removed after confirmation (skipped)
- [ ] **AC3**: Delete action can be cancelled

### C5: Search Contacts
As a user, I want to search contacts so that I can quickly find specific people.

#### Acceptance Criteria
- [x] **AC1**: Search by name works
- [x] **AC2**: Search by email works
- [x] **AC3**: No results message when empty

## Test File
`tests/stories/contacts/contacts.spec.ts`

## Status
- [ ] All acceptance criteria implemented
- [x] Core tests passing (10/12, 2 skipped)
