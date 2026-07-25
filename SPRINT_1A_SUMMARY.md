# SPRINT 1A SUMMARY: What Will Happen & Why

## TL;DR

We will reorganize the Tickly codebase to follow the approved architecture without changing any user-facing features. This is the mandatory foundation that enables all future work.

**Timeline**: 2 weeks  
**Team**: 2 engineers  
**Risk**: Medium (lots of code movement)  
**Outcome**: Clean, standardized, maintainable foundation

---

## The Problem We're Solving

### Current State (Before Sprint 1A)
```
src/lib/                    # 18 files
  ├── supabase-helpers.ts   # 2,757 LOC (!)
  ├── password-utils.ts
  ├── email-service.ts
  ├── form-validation.ts
  └── ... 14 more files

src/components/             # 24 files (mixed purposes)
  ├── LoginForm.tsx
  ├── TicketCard.tsx
  ├── widget-form.tsx       # 620 LOC
  └── ... 21 more

src/app/                    # Pages mixed with API routes
  ├── api/                  # 39 API routes
  ├── login/
  ├── admin-dashboard/
  └── ... scattered pages
```

**The Result**:
- ❌ Can't find where ticket logic lives (scattered across lib/, components/, api/)
- ❌ `supabase-helpers.ts` is too big to modify safely
- ❌ API responses are inconsistent
- ❌ Error handling is scattered (128 console.error statements)
- ❌ Hard to understand how features interact

### After Sprint 1A
```
src/features/
  ├── auth/                 # All auth code together
  │   ├── api/
  │   ├── components/
  │   ├── lib/
  │   └── types/
  ├── tickets/              # All ticket code together
  ├── organizations/
  ├── customers/
  └── ... other features

src/shared/                 # Truly shared utilities only
  ├── ui/
  ├── types/
  ├── utils/
  ├── api/                  # Standardized response format
  ├── config/               # Centralized configuration
  └── constants/

src/infrastructure/         # External services
  ├── database/
  ├── auth/
  ├── email/
  └── logging/
```

**The Result**:
- ✅ Find ticket code in `src/features/tickets/`
- ✅ Easier to modify individual features
- ✅ Consistent API responses everywhere
- ✅ Centralized error handling
- ✅ Clear feature boundaries

---

## What's Changing

### What Users Will Notice
**Nothing.** All features work exactly the same. This is an internal reorganization only.

### What Developers Will Notice

#### 1. Feature-Based Organization
Instead of searching `lib/` for ticket utilities, you go to `features/tickets/lib/`.

**Before**:
```typescript
import { getTickets } from '@/lib/supabase-helpers'
import { formatTicketDate } from '@/lib/ticket-utils'
import TicketCard from '@/components/TicketCard'
```

**After**:
```typescript
import { getTickets, formatTicketDate } from '@/features/tickets'
import { TicketCard } from '@/features/tickets'
```

#### 2. Consistent API Responses
All API routes return the same format.

**Before**:
```javascript
// login returns
{ success: true, session: { user: {} } }

// admin/tickets returns
[{ id, title, status }]

// customers/signup returns
{ success: true, error: null }
```

**After** (all routes):
```javascript
{
  success: true,
  data: { ... },
  error: null,
  code: 'OK',
  timestamp: '2026-07-25T...',
  traceId: 'abc-123'
}
```

#### 3. Centralized Error Handling
Errors are handled consistently with structured logging.

**Before**:
```typescript
try {
  // code
} catch (error) {
  console.error("Error:", error)
  return { success: false }
}
```

**After**:
```typescript
try {
  // code
} catch (error) {
  logger.error('[auth] Login failed', { email, reason: error.message })
  return errorResponse('Invalid credentials', 'INVALID_CREDENTIALS')
}
```

#### 4. Centralized Configuration
Environment variables and constants are managed centrally.

**Before**:
```typescript
const pageSize = 50  // Hardcoded in component
const apiKey = process.env.RESEND_API_KEY  // Scattered access
```

**After**:
```typescript
import { config } from '@/shared/config'
const pageSize = config.PAGINATION.DEFAULT_PAGE_SIZE
const apiKey = config.email.resendApiKey
```

---

## The Work Being Done

### 1. Create Infrastructure (2 days)
- ✅ Create folder structure
- ✅ Create response format helpers
- ✅ Create error handling helpers
- ✅ Create logger

### 2. Reorganize Features (5 days)
- ✅ Move auth code → `src/features/auth/`
- ✅ Move ticket code → `src/features/tickets/`
- ✅ Move organization code → `src/features/organizations/`
- ✅ Move customer code → `src/features/customers/`
- ✅ Move other features

### 3. Standardize APIs (2 days)
- ✅ Update all 39 API routes to use new response format
- ✅ Add structured logging to all routes
- ✅ Add error handling to all routes

### 4. Consolidate Utilities (3 days)
- ✅ Extract validation utilities
- ✅ Extract formatting utilities
- ✅ Plan database helper refactoring (Phase 2)

### 5. Clean Up (1 day)
- ✅ Delete unused files (`manta-client.ts`)
- ✅ Remove unused dependencies

### 6. Test & Document (2 days)
- ✅ Verify everything works
- ✅ Update documentation
- ✅ Code review

---

## Why This Matters

### For Developers
- **Easier to find code**: Know exactly where to look for ticket features
- **Easier to change code**: Smaller, focused files instead of giant monoliths
- **Easier to understand code**: Clear feature boundaries and responsibilities
- **Easier to test code**: Features can be tested independently

### For the Product
- **Faster feature development**: Clear structure = faster coding
- **Fewer bugs**: Organized code is easier to review and maintain
- **Better security**: Centralized error/auth handling reduces vulnerabilities
- **Better observability**: Structured logging helps diagnose issues

### For the Business
- **Lower onboarding time**: New engineers understand the codebase faster
- **Higher velocity**: Less time spent searching/refactoring = more features
- **Easier scaling**: Clean architecture supports 10x growth
- **Reduced technical debt**: Foundation is solid for next phases

---

## Risks & How We Manage Them

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Breaking imports | Features stop working | TypeScript catches errors, thorough testing |
| Circular dependencies | Build fails | ESLint rules, code review |
| Regression bugs | Features break subtly | Manual testing all flows, careful code review |
| Merge conflicts | Git headaches | One feature branch, careful merging |
| Developer confusion | Slower onboarding | Clear documentation, examples |

---

## Quality Gates

Before we declare Sprint 1A done:

✅ **Build Quality**
- TypeScript compiles without errors
- ESLint passes
- No console errors on startup
- No broken imports

✅ **Functionality**
- Login works
- Signup works
- Create/view tickets works
- Create/view customers works
- Admin dashboard loads
- Widget loads

✅ **Code Quality**
- No import cycles
- All features use exports correctly
- Consistent naming
- Proper TypeScript types

✅ **API Consistency**
- All 39 routes return same format
- All errors have codes
- All responses have traceId
- Structured logging on all routes

✅ **Documentation**
- ADRs updated
- Feature structure documented
- Import patterns documented
- Response format documented

---

## Timeline

| Week | Days | Task | Status |
|------|------|------|--------|
| 1 | 1-2 | Create infrastructure | Pending |
| 1 | 3-5 | Migrate features | Pending |
| 2 | 1-2 | Standardize APIs | Pending |
| 2 | 3 | Clean up & fix | Pending |
| 2 | 4-5 | Test & document | Pending |

---

## What Happens After Sprint 1A

Sprint 1A is the foundation. After this, we can:

### Sprint 1B: Architecture Refactoring
- Split monolithic `supabase-helpers.ts`
- Refactor giant components
- Clean up dependencies
- Introduce service/repository patterns

### Sprint 1C: Security Hardening
- Fix JWT validation (critical!)
- Enable Row-Level Security (critical!)
- Add input validation (critical!)
- Add security headers

### Sprint 1D: Performance
- Fix N+1 queries
- Add pagination
- Optimize bundle size
- Implement caching

---

## Questions?

**Q: Will my features stop working?**  
A: No. Every line of business logic stays the same. We're just reorganizing files.

**Q: Will I need to update my code?**  
A: If you're a developer, yes - imports will change. But the functionality stays identical.

**Q: How long will this take?**  
A: 2 weeks with 2 engineers.

**Q: Is this necessary?**  
A: Yes. Without this foundation:
- Sprint 1B (refactoring) becomes 50% harder
- Sprint 1C (security) cannot be done properly
- Sprint 1D (performance) cannot be done properly
- All future sprints are harder

**Q: What if something breaks?**  
A: We test thoroughly before merging. TypeScript catches 90% of issues. We do manual testing of all critical flows.

---

## Summary

Sprint 1A is a **mandatory 2-week investment** that sets up the codebase for success. It requires careful execution but has low risk if done systematically. After this, we have a clean foundation for:

- Security fixes (Sprint 1C)
- Performance optimization (Sprint 1D)  
- Future feature development (Milestone 2+)
- Easy onboarding of new team members

**Status**: Ready for approval. Waiting for sign-off to begin implementation.
