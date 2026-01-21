# Story: Opportunities

## Overview
Opportunity (deal) management including pipeline stages, CRUD operations, and relationships.

## User Stories

### O1: View Opportunities List
As a user, I want to view opportunities so that I can track my deals.

#### Acceptance Criteria
- [ ] **AC1**: User can see opportunities list
- [ ] **AC2**: Opportunities show title, stage, amount
- [ ] **AC3**: Empty state shown when no opportunities
- [ ] **AC4**: Filter by pipeline works

### O2: Create Opportunity
As a user, I want to create opportunities so that I can track new deals.

#### Acceptance Criteria
- [ ] **AC1**: User can open opportunity creation form
- [ ] **AC2**: User can select pipeline
- [ ] **AC3**: User can set stage
- [ ] **AC4**: User can link to contact
- [ ] **AC5**: Created opportunity appears in list

### O3: Move Through Pipeline
As a user, I want to move opportunities through stages so that I can track progress.

#### Acceptance Criteria
- [ ] **AC1**: User can change stage via dropdown
- [ ] **AC2**: Stage change is saved
- [ ] **AC3**: Stage history is tracked

### O4: Edit Opportunity
As a user, I want to edit opportunities so that I can update deal information.

#### Acceptance Criteria
- [ ] **AC1**: User can edit all fields
- [ ] **AC2**: Changes saved immediately
- [ ] **AC3**: Validation errors shown

### O5: Delete Opportunity
As a user, I want to delete opportunities so that I can remove cancelled deals.

#### Acceptance Criteria
- [ ] **AC1**: User sees delete confirmation
- [ ] **AC2**: Opportunity removed after confirmation

## Test File
`tests/stories/opportunities/opportunities.spec.ts`

## Status
- [ ] All acceptance criteria implemented
- [ ] All tests passing
