# Sprint 1B – Phase 2: Shared Layer Extraction

**Milestone:** 1

**Sprint:** 1B

**Phase:** 2

**Status:** Ready for Implementation

**Priority:** High

---

# Objective

The architecture foundation has been completed.

This phase begins the actual migration of reusable code into the approved Tickly v2 architecture.

The objective is **not** to redesign the application.

The objective is to relocate reusable code into the Shared layer while preserving existing behavior.

No new features will be developed during this phase.

No business logic will be modified.

---

# Goals

At the completion of this phase:

- Shared components are centralized.
- Shared hooks are centralized.
- Shared utilities are centralized.
- Shared validation is centralized.
- Shared schemas are centralized.
- Shared constants are centralized.
- Shared types are centralized.
- Duplicate implementations are removed.
- Existing functionality remains unchanged.

---

# Migration Principles

Every migration must follow this sequence:

1. Locate reusable code.
2. Move the code into the appropriate Shared directory.
3. Update imports.
4. Verify functionality.
5. Remove duplicate implementation.
6. Run TypeScript.
7. Run ESLint.
8. Run application verification.

No migration should modify business behavior.

---

# Scope

## Included

Move reusable:

- Components
- Hooks
- Utilities
- Constants
- Types
- Validators
- Schemas
- Providers
- Layouts
- Icons

---

## Excluded

Do NOT migrate:

- Business services
- Repository classes
- Database queries
- Authentication logic
- API routes
- Feature-specific components
- Ticket logic
- Customer logic
- Organization logic

These belong to later phases.

---

# Shared Components

Review every component.

If a component can be reused by multiple features, migrate it to:

```
shared/components/
```

Examples include:

- Button
- Card
- Modal
- Dialog
- Badge
- Avatar
- Input
- Select
- Table
- EmptyState
- LoadingSpinner
- Toast
- Alert
- Pagination

Feature-specific components remain inside their feature.

---

# Shared Hooks

Review every custom hook.

Move reusable hooks into:

```
shared/hooks/
```

Examples:

- useDebounce
- useLocalStorage
- useMediaQuery
- usePrevious
- usePagination
- useClickOutside

Hooks that contain ticket or customer logic remain inside their respective features.

---

# Shared Utilities

Review existing utility functions.

Move reusable utilities into:

```
shared/utils/
```

Examples:

- formatDate()
- formatCurrency()
- formatFileSize()
- slugify()
- debounce()
- throttle()
- classNames()
- generateId()

Do not move business calculations.

---

# Shared Constants

Move reusable constants into:

```
shared/constants/
```

Examples:

- Status values
- Role values
- Colors
- API limits
- Pagination defaults
- Regex patterns
- Route constants

---

# Shared Types

Create centralized reusable interfaces.

Move common types into:

```
shared/types/
```

Examples:

- ApiResponse
- Pagination
- UserSummary
- OrganizationSummary
- Timestamp
- BaseEntity

Feature-specific types remain inside each feature.

---

# Shared Validation

Move reusable validation helpers into:

```
shared/validation/
```

Examples:

- email validation
- password validation
- phone validation
- UUID validation
- URL validation

Do not move ticket validation rules.

---

# Shared Schemas

Move reusable Zod schemas into:

```
shared/schemas/
```

Examples:

- PaginationSchema
- ApiResponseSchema
- EmailSchema
- PasswordSchema
- AddressSchema

Business schemas remain inside features.

---

# Shared Providers

Move reusable providers into:

```
shared/providers/
```

Examples:

- ThemeProvider
- QueryProvider
- AuthContext Provider
- ToastProvider

---

# Shared Layouts

Move reusable layouts into:

```
shared/layouts/
```

Examples:

- DashboardLayout
- AuthLayout
- EmptyLayout
- Container
- PageLayout

---

# Shared Icons

Centralize reusable icons inside:

```
shared/icons/
```

---

# Import Rules

After migration, update imports.

Preferred:

```ts
import { Button } from "@/shared/components"

import { formatDate } from "@/shared/utils"

import { PaginationSchema } from "@/shared/schemas"
```

Avoid:

```ts
../../../components/Button

../../utils/date
```

---

# Duplicate Removal

After verifying a migrated module:

- remove duplicate implementation
- update all imports
- verify application

Never leave duplicate utilities.

---

# Verification Checklist

Before closing Phase 2:

- TypeScript passes.
- ESLint passes.
- Build succeeds.
- Development server starts.
- Login works.
- Dashboard loads.
- Widget loads.
- Ticket creation works.
- Customer pages work.
- No runtime errors.
- No circular imports.
- No duplicated utilities remain.

---

# Deliverables

By the end of this phase:

- Shared layer populated.
- Imports updated.
- Duplicate utilities removed.
- Documentation updated.
- Build verification complete.

---

# Completion Report

Create:

```
docs/04-implementation/MILESTONE_1/PHASE_2_COMPLETION_REPORT.md
```

Include:

## Executive Summary

## Files Migrated

## Files Removed

## Imports Updated

## Validation Results

## Build Status

## TypeScript Status

## Known Issues

## Technical Debt Remaining

## Phase 3 Readiness

---

# Exit Criteria

Phase 2 is complete when:

- Shared layer contains all reusable assets.
- No duplicated shared code exists.
- Existing functionality behaves exactly as before.
- Application builds successfully.
- Documentation is updated.

Only after formal approval may Phase 3 begin.