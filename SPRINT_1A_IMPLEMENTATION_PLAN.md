# SPRINT 1A IMPLEMENTATION PLAN: Foundation & Standardization

## Executive Summary

Sprint 1A focuses on standardizing the Tickly codebase **without changing business logic**. This is a prerequisite for all future sprints and must establish the foundation that the approved ADRs depend on.

**Duration**: 2 weeks (80 engineering hours)  
**Team**: 2 senior engineers  
**Outcome**: Clean, standardized, enterprise-ready foundation

---

## Current State Assessment

### ✅ What's Working
- Core features are functional (authentication, tickets, customers, organizations)
- Database schema exists with proper tables
- API endpoints exist and respond
- UI components render
- Deployed on Vercel

### 🔴 Critical Issues Blocking Foundation
1. **Folder structure does NOT match ADR-001** (approved feature-based modular monolith)
   - Current: Flat `src/lib/` with 18 files, flat `src/components/` with 24 files
   - Expected: Feature-based `src/features/auth/`, `src/features/tickets/`, etc.
   - Impact: Cannot cleanly separate concerns, code sharing is chaotic

2. **Monolithic `supabase-helpers.ts` (2,757 LOC)**
   - Contains 95+ functions across ALL domains (auth, tickets, customers, organizations)
   - No separation between read, write, business logic
   - Functions are deeply interdependent
   - Blocks developers from making changes

3. **No centralized response format (violates ADR-005)**
   - 39 API routes use inconsistent response patterns
   - Some use `{ success, error }`, others use direct data
   - No standardized error format
   - No structured logging

4. **No centralized error handling**
   - 128 console.error statements scattered across codebase
   - No error code registry
   - No centralized error recovery

5. **No centralized configuration**
   - Constants scattered: `src/lib/`, `src/components/`, page files
   - Environment variables accessed directly via `process.env`
   - No config validation at startup

6. **No centralized logging**
   - Uses raw console.log/console.error
   - No log levels
   - No structured logging format

7. **Dead code not removed**
   - `manta-client.ts` (unused dependency)
   - `mantahq-sdk` in package.json (not imported anywhere)

---

## Scope: What Sprint 1A Must Accomplish

### 1. Apply Feature-Based Folder Structure (ADR-001)

**Target Structure**:
```
src/
├── app/                          # Next.js App Router only
│   ├── layout.tsx
│   ├── page.tsx
│   ├── [route]/
│   └── api/
│
├── features/                     # Feature modules
│   ├── auth/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── types/
│   │   ├── constants.ts
│   │   └── index.ts              # Feature exports
│   ├── organizations/
│   ├── customers/
│   ├── tickets/
│   ├── widget/
│   ├── portal/
│   ├── analytics/
│   └── settings/
│
├── shared/                       # Truly shared code only
│   ├── ui/
│   │   ├── components/
│   │   └── hooks/
│   ├── hooks/
│   ├── types/
│   ├── utils/
│   ├── constants/
│   ├── config/
│   └── api/
│
├── infrastructure/               # External integrations
│   ├── database/
│   ├── auth/
│   ├── email/
│   ├── cache/
│   ├── monitoring/
│   └── logging/
│
└── middleware.ts
```

**Affected Files**: ~70 files need migration to new folder structure
**Complexity**: HIGH - requires careful import rewriting
**Risk**: HIGH - many imports can break

### 2. Create Shared Utilities Infrastructure

**New Files to Create**:

#### `src/shared/api/response.ts` - Standardized Response Format (ADR-005)
```typescript
// Every API response must use this format
interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?: string
  timestamp: string
  traceId: string
}

// Export helpers
export function successResponse<T>(data: T)
export function errorResponse(error: string, code?: string)
export function handleApiError(error: unknown)
```

#### `src/shared/api/error.ts` - Centralized Error Handling
```typescript
// Error code registry
export const ERROR_CODES = {
  INVALID_INPUT: 'INVALID_INPUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  // ... others
}

// Custom error class
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
  ) {
    super(message)
  }
}
```

#### `src/shared/lib/logger.ts` - Centralized Logging (ADR-011)
```typescript
// Structured logging with levels
export const logger = {
  debug: (msg: string, data?: unknown) => {}
  info: (msg: string, data?: unknown) => {}
  warn: (msg: string, data?: unknown) => {}
  error: (msg: string, data?: unknown) => {}
}

// Usage: logger.error('[auth] Login failed', { email, reason })
```

#### `src/shared/config/constants.ts` - Centralized Constants
```typescript
// All application constants
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 200,
}

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  AGENT: 'agent',
}

// ... others
```

#### `src/shared/types/api.ts` - Shared Types
```typescript
export interface User {
  id: string
  email: string
  role: string
  organization_id?: string
  created_at: string
}

export interface Organization {
  id: string
  name: string
  owner_id: string
  // ...
}

// ... others
```

### 3. Remove Dead Code

**Files to Delete**:
- `src/lib/manta-client.ts` (no imports found)

**Dependencies to Remove from package.json**:
- `mantahq-sdk` (no usage found)

**Verification**: Grep entire codebase to confirm no usage

### 4. Standardize API Response Format

**Current Problem**:
- `/api/login/route.ts`: Returns `{ success, session }`
- `/api/admin/tickets/route.ts`: Returns raw data array
- `/api/customers/signup/route.ts`: Returns `{ success, error }`

**Solution**: Apply consistent format to all 39 API routes
- Create response wrapper helpers
- Update each route to use standardized format
- Add centralized error handling

### 5. Create Shared Utility Libraries

**Extract and Organize Utilities**:

From `src/lib/supabase-helpers.ts` (2,757 LOC), extract:
- Database operations → `src/infrastructure/database/`
- Query builders → `src/shared/lib/query-builders.ts`
- Repository patterns → `src/features/[feature]/lib/repository.ts`

From scattered validation:
- Consolidate in `src/shared/lib/validation.ts`

From scattered formatting:
- Consolidate in `src/shared/lib/formatters.ts`

### 6. Create Centralized Configuration

**New Files**:
- `src/shared/config/index.ts` - Load and validate env vars at startup
- `src/shared/config/database.ts` - Database connection config
- `src/shared/config/auth.ts` - Auth configuration
- `src/shared/config/email.ts` - Email service configuration

**Benefit**: Single source of truth, validation at startup, type safety

---

## Detailed Migration Plan

### Phase 1: Create New Infrastructure (2 days)

**Step 1.1**: Create folder structure
- Create `src/features/` directories
- Create `src/shared/` subdirectories
- Create `src/infrastructure/` subdirectories

**Step 1.2**: Create shared utilities
- `src/shared/api/response.ts`
- `src/shared/api/error.ts`
- `src/shared/lib/logger.ts`
- `src/shared/config/constants.ts`
- `src/shared/types/index.ts`

**Step 1.3**: Verify build passes
- TypeScript compilation
- No broken imports
- All tests pass (if any)

### Phase 2: Organize Features (5 days)

**Step 2.1**: Migrate `auth` feature
- Move auth-related code to `src/features/auth/`
- Create `src/features/auth/index.ts` exports
- Update all imports

**Step 2.2**: Migrate `tickets` feature
- Move ticket-related code
- Create `src/features/tickets/index.ts` exports
- Update all imports

**Step 2.3**: Migrate `organizations` feature
- Similar pattern

**Step 2.4**: Migrate `customers` feature
- Similar pattern

**Step 2.5**: Migrate remaining features
- analytics, settings, portal, widget

**Detailed for Each Feature**:
1. Create feature directory structure
2. Move related components
3. Move related types
4. Move related hooks
5. Move related utilities
6. Create `index.ts` with exports
7. Update all imports in codebase
8. Verify no import cycles
9. Test functionality

### Phase 3: Standardize API Routes (2 days)

**Step 3.1**: Apply response format to 39 routes
- Login route
- Signup route
- All admin routes (20+)
- All customer routes (10+)
- All ticket routes (5+)

For each route:
1. Import response helpers
2. Wrap success responses
3. Wrap error responses
4. Use centralized error codes
5. Add structured logging

### Phase 4: Consolidate Shared Code (3 days)

**Step 4.1**: Extract validation utilities
- `src/shared/lib/validation.ts`
- Export all validators
- Create validation schema registry

**Step 4.2**: Extract formatting utilities
- `src/shared/lib/formatters.ts`
- Date formatting
- Number formatting
- String formatting

**Step 4.3**: Extract Supabase helpers
- Decide: Keep monolith or split by domain?
- Recommended: Keep for now, split in Sprint 1B
- Create feature-specific repositories

### Phase 5: Remove Dead Code (1 day)

**Step 5.1**: Remove unused files
- Delete `src/lib/manta-client.ts`

**Step 5.2**: Remove unused dependencies
- Remove `mantahq-sdk` from package.json
- Run `npm dedupe`
- Test build

### Phase 6: Testing & Cleanup (2 days)

**Step 6.1**: Verify everything works
- Build passes
- TypeScript clean
- No console errors
- All features functional

**Step 6.2**: Update documentation
- Update ARCHITECTURE_DECISIONS.md with actual implementation details
- Create feature documentation
- Document import patterns

**Step 6.3**: Code review checklist
- No broken imports
- No circular dependencies
- Consistent naming
- Proper TypeScript types

---

## Affected Files Summary

### Files to Create (~35 new files)
- Feature directories and index files (12)
- Shared infrastructure (8)
- Infrastructure modules (6)
- Configuration files (4)
- Type definitions (5)

### Files to Refactor (~70 files)
- API routes: 39 files (update response format + imports)
- Components: 24 files (update imports to use features/)
- Lib files: 18 files (reorganize or move)
- App pages: 35 files (update imports)

### Files to Delete (~2 files)
- `src/lib/manta-client.ts`
- Entry in `package.json` for `mantahq-sdk`

---

## Risk Assessment

### HIGH RISKS
1. **Import cycles**: Feature imports must not create circular dependencies
   - Mitigation: Enforce strict import rules, use ESLint plugins
   
2. **Breaking changes**: Many components/pages importing from `src/lib/`
   - Mitigation: Update all imports systematically, use TypeScript to catch errors

3. **Regression bugs**: Changing structure can introduce subtle bugs
   - Mitigation: Test all features manually, keep builds passing

### MEDIUM RISKS
4. **Developer confusion**: New structure takes time to understand
   - Mitigation: Document clearly, provide examples

5. **Git conflicts**: Large refactoring across many files
   - Mitigation: Work on separate branch, merge carefully

### LOW RISKS
6. **Performance**: No expected performance change
   - Verification: Bundle size analysis

---

## Implementation Rules

### Must Follow
✅ **Do NOT introduce new features** - Only reorganize existing code  
✅ **Preserve all functionality** - No behavior changes  
✅ **Keep builds passing** - Build after each major change  
✅ **Use TypeScript strictly** - Let TypeScript catch import errors  
✅ **Atomic commits** - Each file migration or feature move = 1 commit  
✅ **Update imports systematically** - Don't leave broken imports  
✅ **Create feature exports** - `src/features/tickets/index.ts`  
✅ **No cross-feature imports** - Use exports only  

### Must NOT Do
❌ **Do NOT leave old files** - Delete or move everything  
❌ **Do NOT create duplicate utilities** - Consolidate instead  
❌ **Do NOT import from features directly** - Use index.ts exports  
❌ **Do NOT skip TypeScript checks** - Fix all type errors  

---

## Acceptance Criteria

### Functional Requirements
- [x] All existing features work identically
- [x] No functionality is removed or changed
- [x] User experience is identical
- [x] Database operations work the same

### Code Organization
- [x] Code is organized by features (ADR-001)
- [x] No cross-feature direct imports
- [x] Shared code is truly shared
- [x] Each feature has clear exports

### API Standardization
- [x] All 39 API routes use consistent response format
- [x] All errors have codes and structured messages
- [x] All responses include timestamp and traceId

### Infrastructure
- [x] Centralized logger available
- [x] Centralized error handling available
- [x] Centralized configuration available
- [x] Constants consolidated

### Build & Quality
- [x] TypeScript builds without errors
- [x] ESLint passes without warnings
- [x] No broken imports
- [x] No orphaned files
- [x] No unused dependencies

### Documentation
- [x] Feature structure documented
- [x] Import patterns documented
- [x] Response format documented
- [x] ADRs updated with implementation details

---

## Validation Checklist

Before declaring Sprint 1A complete:

```
STRUCTURAL
[ ] Feature folders exist: auth, organizations, tickets, customers, widget, portal
[ ] Shared folder contains: api, hooks, types, utils, config, constants
[ ] Infrastructure folder contains: database, auth, email, monitoring, logging
[ ] No files in src/lib/ except infrastructure support
[ ] No files in src/components/ except UI components

BUILD QUALITY
[ ] npm run build passes
[ ] npx tsc passes (no type errors)
[ ] npm run lint passes
[ ] No console errors on startup
[ ] No broken imports in build output

FUNCTIONALITY
[ ] Login works
[ ] Signup works
[ ] Create ticket works
[ ] View tickets works
[ ] Create customer works
[ ] All admin pages load
[ ] Customer portal loads
[ ] Widget loads

API STANDARDIZATION
[ ] All API routes return ApiResponse format
[ ] All errors have ERROR_CODES
[ ] All errors have structured logging
[ ] 39/39 routes migrated

IMPORTS
[ ] No "from '../../../..'" relative imports
[ ] All imports use @ alias
[ ] No import cycles detected
[ ] All feature exports documented

DEPENDENCIES
[ ] package.json has no unused dependencies
[ ] npm ls shows no issues
[ ] Lock file is clean
```

---

## Success Metrics

At the end of Sprint 1A:

| Metric | Target | Status |
|--------|--------|--------|
| TypeScript errors | 0 | TBD |
| Build warnings | 0 | TBD |
| Import cycles | 0 | TBD |
| API response consistency | 100% | TBD |
| Code organization compliance | 100% | TBD |
| Dead code removed | 100% | TBD |
| Documentation updated | 100% | TBD |

---

## Timeline (2 weeks)

| Week | Days | Focus | Deliverables |
|------|------|-------|--------------|
| 1 | Day 1-2 | Infrastructure setup | Folder structure, shared utilities |
| 1 | Day 3-5 | Feature migration | Auth, tickets, organizations |
| 2 | Day 1-2 | API standardization | All 39 routes updated |
| 2 | Day 3 | Cleanup & validation | Dead code removal, testing |
| 2 | Day 4-5 | Documentation | ADRs updated, guide created |

---

## Next Steps

1. **Review this plan** - Get approval before starting
2. **Create feature branch** - `feature/sprint-1a-foundation`
3. **Execute Phase 1** - Create infrastructure
4. **Execute Phase 2** - Migrate features
5. **Execute Phase 3** - Standardize APIs
6. **Execute Phase 4-6** - Consolidate and cleanup
7. **Code review** - Full codebase review
8. **Test** - Comprehensive functionality test
9. **Merge** - Merge to main branch
10. **Sprint 1B** - Begin architecture refactoring

---

## Questions & Clarifications Needed

Before starting implementation, confirm:

1. **Feature-based structure**: Is the proposed structure correct? Any adjustments?
2. **Response format**: Should responses include `traceId`? What about pagination metadata?
3. **Error codes**: Should we use HTTP status codes or custom codes or both?
4. **Logging**: What log level should be default? Should we push to external service?
5. **Breaking changes**: Is it acceptable to change API response format (breaking client code)?

---

**Plan Status**: ⏳ READY FOR APPROVAL  
**Created**: 2026-07-25  
**Review By**: [TBD]  
**Approved By**: [TBD]  
**Start Date**: [TBD]
