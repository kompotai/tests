# Story: Opportunities

## Overview
Opportunity (deal) management including pipeline stages, CRUD operations, and relationships.

## User Stories

### O1: View Opportunities List
As a user, I want to view opportunities so that I can track my deals.

#### Acceptance Criteria
- [x] **AC1**: User can see opportunities list
- [x] **AC2**: Opportunities show title, stage, amount
- [x] **AC3**: Empty state shown when no opportunities
- [x] **AC4**: Filter by pipeline works

### O2: Create Opportunity
As a user, I want to create opportunities so that I can track new deals.

#### Acceptance Criteria
- [x] **AC1**: User can open opportunity creation form
- [ ] **AC2**: User can select pipeline
- [ ] **AC3**: User can set stage
- [x] **AC4**: User can link to contact
- [x] **AC5**: Created opportunity appears in list

### O3: Move Through Pipeline
As a user, I want to move opportunities through stages so that I can track progress.

#### Acceptance Criteria
- [x] **AC1**: User can change stage via dropdown
- [ ] **AC2**: Stage change is saved
- [ ] **AC3**: Stage history is tracked

### O4: Edit Opportunity
As a user, I want to edit opportunities so that I can update deal information.

#### Acceptance Criteria
- [ ] **AC1**: User can edit all fields (skipped - button not visible)
- [ ] **AC2**: Changes saved immediately
- [x] **AC3**: Validation errors shown

### O5: Delete Opportunity
As a user, I want to delete opportunities so that I can remove cancelled deals.

#### Acceptance Criteria
- [ ] **AC1**: User sees delete confirmation (skipped)
- [ ] **AC2**: Opportunity removed after confirmation (skipped)

## Test File
`tests/stories/opportunities/opportunities.spec.ts`

## Status
- [ ] All acceptance criteria implemented
- [x] Core tests passing (9/12, 3 skipped)
