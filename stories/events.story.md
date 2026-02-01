# Events Module User Stories
**Kompot Management System**

## Overview
Event management, including creation, viewing, and organizing activities.

---

## User Stories

### E1: View Events List
**As a** user
**I want to** view the list of events
**So that** I can plan my activities

**Acceptance Criteria:**
- AC1: User sees the events table after logging in
- AC2: Table contains columns: Name, Code, Type, Format, Start Date, Registrations
- AC3: Empty state "No events yet" is displayed correctly
- AC4: Events are displayed in the table when present

**Test Coverage:** `tests/e2e/10-events/events.spec.ts`

---

### E2: Create Event
**As a** user
**I want to** create new events
**So that** I can plan activities

**Acceptance Criteria:**
- AC1: User can open the event creation form
- AC2: Mandatory fields: Name*, Type*, Format*, Start Date*
- AC3: Can specify End Date
- AC4: Ability to select event type (e.g., Webinar)
- AC5: Can choose format (Online/Offline)
- AC6: Option to add Meeting URL for online events
- AC7: Optional Max Attendees field
- AC8: Can add event description
- AC9: "Create Event" button is active after filling mandatory fields

**Test Coverage:** `tests/e2e/10-events/events.spec.ts`

---

### E3: Edit Event
**As a** user
**I want to** edit created events
**So that** I can update event information

**Acceptance Criteria:**
- AC1: Ability to edit existing events
- AC2: All fields available for modification
- AC3: Changes are saved correctly

**Test Coverage:** `tests/e2e/10-events/events.spec.ts`

---

### E4: Filtering and Searching Events
**As a** user
**I want to** work conveniently with the event list
**So that** I can quickly find needed events

**Acceptance Criteria:**
- AC1: Ability to sort by columns
- AC2: Search/filter events by various parameters

**Test Coverage:** `tests/e2e/10-events/events.spec.ts`

---

## Test Implementation

### Test File Location
```
tests/e2e/10-events/events.spec.ts
```

### Page Objects
```
pages/EventsPage.ts
```

---

## Status
- All user stories E1-E4 are covered with automated tests
- Full functionality testing implemented
- Ready for review

---

**Author:** Farkhad Baiguzhin
**Project:** Kompot Management System - Events Module
