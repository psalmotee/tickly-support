# Phase 2: Shared Layer Extraction - Detailed Migration Plan

## Overview
Phase 2 extracts reusable code from `src/lib/` and `src/components/` into the approved shared layer structure. This maintains all existing functionality while organizing code by concern.

## Migration Categories

### 1. Utilities (src/shared/utils/)
- **form-validation.ts** → Validation functions for forms
- **sort-utils.ts** → Sorting functions
- **password-utils.ts** → Password hashing and JWT generation
- **ticket-id.ts** → Ticket ID generation
- **ticket-number.ts** → Ticket number formatting

### 2. Components (src/shared/components/)
- **form-error.tsx** → Error display component
- **modal.tsx** → Modal dialog component
- **delete-confirmation-modal.tsx** → Confirmation dialog

### 3. Providers (src/shared/providers/)
- **auth-provider.tsx** → Authentication context provider
- **useAuth hook** → Authentication hook

### 4. Hooks (src/shared/hooks/)
- Extract custom hooks when identified

## Features to Exclude (Phase 3+)
These stay in src/lib/ - they contain business logic:
- **ticket-rules.ts** - Business rules
- **access-control.ts** - Role-based access control
- **route-protection.ts** - Route protection logic
- **supabase-client.ts** - Database client
- **email-service.ts** - Email business logic
- **ticket-builder.ts** - Ticket domain logic
- **ticket-soft-delete.ts** - Soft delete business rules
- **ticket-table-resolver.ts** - Business logic resolver
- **manta-client.ts** - External API integration
- **admin-api-client.ts** - Admin API client

## Migration Priority

### Batch 1: Core Utilities (Safe, No Dependencies)
1. password-utils.ts → shared/utils/
2. sort-utils.ts → shared/utils/
3. ticket-id.ts → shared/utils/
4. ticket-number.ts → shared/utils/
5. form-validation.ts → shared/utils/

### Batch 2: UI Components (No Business Logic)
1. form-error.tsx → shared/components/
2. modal.tsx → shared/components/modals/
3. delete-confirmation-modal.tsx → shared/components/modals/

### Batch 3: Providers (Top-level Concerns)
1. auth-provider.tsx → shared/providers/
2. useAuth hook → shared/hooks/

## Migration Checklist Per File

For each migration:
- [ ] Identify all import locations
- [ ] Copy file to new location
- [ ] Update imports in new file (if any)
- [ ] Update imports in all consuming files
- [ ] Run TypeScript check
- [ ] Run ESLint
- [ ] Verify functionality in browser
- [ ] Delete old file
- [ ] Commit changes

## Success Criteria

- TypeScript compilation succeeds
- ESLint passes
- All tests pass (if any)
- Application renders correctly
- No console errors
- Form validation works
- Auth flows work
- Modals display correctly

## Files Currently in lib/ for Reference
- access-control.ts
- admin-api-client.ts
- auth-client.ts
- email-service.ts
- form-validation.ts ✓ MIGRATE
- manta-client.ts
- password-utils.ts ✓ MIGRATE
- route-protection.ts
- server-session.ts
- sort-utils.ts ✓ MIGRATE
- supabase-client.ts
- supabase-helpers.ts
- ticket-builder.ts
- ticket-id.ts ✓ MIGRATE
- ticket-local-store.ts
- ticket-number.ts ✓ MIGRATE
- ticket-rules.ts
- ticket-soft-delete.ts
- ticket-table-resolver.ts

## Files Currently in components/ for Reference
- admin-dashboard-header.tsx
- admin-stats.tsx
- admin-ticket-list.tsx
- admin-users-list.tsx
- auth-provider.tsx ✓ MIGRATE
- create-ticket-form.tsx
- custom-field-input.tsx
- customer-signup-content.tsx
- dashboard-selector.tsx
- dashboard-stats.tsx
- delete-confirmation-modal.tsx ✓ MIGRATE
- edit-ticket-form.tsx
- form-error.tsx ✓ MIGRATE
- join-organization-content.tsx
- login-form.tsx
- modal.tsx ✓ MIGRATE
- promote-demote-modal.tsx
- signup-form.tsx
- stats-cards.tsx
- team-management.tsx
- ticket-card.tsx
- ticket-list.tsx
- user-dashboard-header.tsx
- widget-form.tsx

## Notes
- All migrations follow one-way dependency flow
- No business logic changes
- Preserve existing behavior exactly
- Update all import paths consistently
- Use barrel exports (index.ts) to centralize imports
