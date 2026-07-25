# Refactoring Roadmap

Strategic plan for addressing technical debt. **NO implementation - planning only.**

---

## Executive Summary

**Total Effort**: 280 hours (~7 weeks)
**Team Required**: 2-3 senior engineers
**Timeline**: 8 weeks (including planning and testing)
**Blocking Production**: Yes
**Go/No-Go Gate**: Must complete Phase 1 before any GA deployment

---

## Phase 1: Security Foundation (Week 1-2) 🔴 CRITICAL BLOCKER

### Sprint 1.1: Fix JWT & Authentication (Week 1, Days 1-2)

**Objective**: Replace custom JWT with proper signature verification

**Files Affected**:
- `src/lib/password-utils.ts`
- `src/lib/server-session.ts`
- `src/app/api/login/route.ts`
- `src/app/api/signup/route.ts`
- `src/lib/auth-client.ts`

**Changes**:
1. Replace PBKDF2 with bcrypt
2. Implement jose library for JWT
3. Add signature verification
4. Add token expiration enforcement
5. Implement refresh token mechanism

**Breaking Changes**:
- All existing sessions become invalid
- Need grace period for token refresh

**Rollback Strategy**:
- Keep PBKDF2 code in separate branch
- Support both signing methods during transition
- Plan 1-week grace period

**Acceptance Criteria**:
- ✅ Tokens verified with RS256
- ✅ Tokens expire in 7 days
- ✅ Password hashing uses bcrypt
- ✅ No 'none' algorithm accepted
- ✅ All existing sessions invalidated safely

**Testing Requirements**:
- Unit tests for hashing
- Unit tests for JWT signing/verification
- Integration test for login flow
- E2E test for session invalidation

**Estimated Effort**: 8 hours
**Risk**: Medium (affects all auth flows)

---

### Sprint 1.2: Enable RLS & Data Security (Week 1, Days 3-4)

**Objective**: Enable Row-Level Security on all tables

**Files Affected**:
- Database schema (Supabase)
- All API routes that query data

**Changes**:
1. Enable RLS on: user, organization, organization_member, ticket, ticket_message, customer
2. Create policies for each table
3. Update API queries to respect RLS
4. Test that users can only access their org

**Breaking Changes**:
- Existing queries may fail if not following RLS
- Admin access needs special handling

**Rollback Strategy**:
- Keep old policies in SQL file
- Test on staging first
- Gradual rollout by feature

**Acceptance Criteria**:
- ✅ RLS enabled on all tables
- ✅ Users only see their org data
- ✅ Admins see org data
- ✅ Cross-org access blocked
- ✅ No data leakage in logs

**Testing Requirements**:
- Query test for isolation
- Admin access verification
- Cross-org access prevention test

**Estimated Effort**: 12 hours
**Risk**: High (affects all data access)

---

### Sprint 1.3: Add Input Validation (Week 1, Days 5, Week 2, Days 1-2)

**Objective**: Validate all user inputs on all 39 API routes

**Files Affected**:
- All 39 API routes
- Form components

**Changes**:
1. Create Zod schemas for each endpoint
2. Add validation middleware
3. Return consistent error format
4. Sanitize HTML outputs

**Breaking Changes**:
- Stricter validation may reject some valid inputs
- Error format changes

**Rollback Strategy**:
- Feature flag for strict validation
- Gradual rollout

**Acceptance Criteria**:
- ✅ All routes validate input
- ✅ Consistent error format
- ✅ No XSS injection possible
- ✅ All validation tests pass

**Testing Requirements**:
- Unit tests for each schema
- Integration tests for error cases
- Security tests for injection

**Estimated Effort**: 16 hours
**Risk**: Medium

---

### Sprint 1.4: Security Headers & CSRF (Week 2, Days 3-4)

**Objective**: Add security headers and CSRF protection

**Files Affected**:
- `next.config.ts`
- `middleware.ts`
- All forms

**Changes**:
1. Add CSP, X-Frame-Options, etc.
2. Implement CSRF tokens
3. Set SameSite=Strict on cookies
4. Validate Origin header

**Breaking Changes**:
- CSP may break inline scripts
- CSRF tokens required in forms

**Acceptance Criteria**:
- ✅ All headers present
- ✅ CSRF tokens validated
- ✅ Cookies have SameSite
- ✅ Security audit passes

**Estimated Effort**: 6 hours
**Risk**: Low

---

### Sprint 1.5: Review & Testing (Week 2, Day 5)

**Objective**: Comprehensive security review

**Testing**:
- Full security audit
- Penetration testing
- Code review

**Estimated Effort**: 8 hours

---

### Phase 1 Summary

**Total Effort**: 50 hours
**Timeline**: 2 weeks
**Team**: 2 senior engineers
**Risk**: Medium-High
**Blocking**: YES - Nothing goes to production without this

---

## Phase 2: Architecture Foundation (Week 3-4)

### Sprint 2.1: Monolithic File Split (Week 3)

**Objective**: Break apart 2,757-line supabase-helpers.ts

**Current File**: `src/lib/supabase-helpers.ts`

**New Structure**:
```
src/features/
├── auth/lib/
│   ├── authService.ts
│   └── sessionService.ts
├── tickets/lib/
│   ├── ticketService.ts
│   ├── ticketQueries.ts
│   └── ticketValidation.ts
├── organizations/lib/
│   ├── organizationService.ts
│   └── organizationQueries.ts
```

**Files to Create**: 8-10 new files
**Files to Delete**: 1 (old monolithic file)
**Files Modified**: All imports

**Breaking Changes**: ALL imports break - need comprehensive find/replace

**Rollback Strategy**:
- Keep old file in branch
- Migration script to update imports
- Run in parallel for verification

**Acceptance Criteria**:
- ✅ Each file < 300 LOC
- ✅ Clear responsibilities
- ✅ All imports updated
- ✅ Tests pass

**Estimated Effort**: 20 hours
**Risk**: High (touch every file)

---

### Sprint 2.2: Feature-Based Organization (Week 3-4)

**Objective**: Reorganize folders by feature

**Current Structure** → **New Structure**:
```
src/lib/ → src/features/*/lib/
src/components/Widget* → src/features/widget/components/
src/app/admin → src/app/(admin)/
src/app/api/admin/tickets → src/features/tickets/api/
```

**Breaking Changes**: All imports change

**Effort**: 24 hours

---

### Sprint 2.3: Error Handling & Logging (Week 4)

**Objective**: Centralized error handling and logging

**Add**:
- Error boundary components
- Error handler middleware
- Logger utility
- Error types

**Effort**: 12 hours

---

### Sprint 2.4: State Management (Week 4)

**Objective**: Implement React Context + SWR

**Add**:
- Auth context
- Organization context
- SWR hooks for data fetching

**Effort**: 16 hours

---

### Phase 2 Summary

**Total Effort**: 72 hours
**Timeline**: 2 weeks
**Team**: 2-3 engineers
**Risk**: High

---

## Phase 3: Code Quality (Week 5-6)

### Sprint 3.1: Component Refactoring

**Large Components to Split**:
- widget-form.tsx (620 LOC) → 4-5 components
- team-management.tsx (469 LOC) → 3-4 components
- admin-ticket-list.tsx (347 LOC) → 3-4 components

**Effort**: 24 hours

---

### Sprint 3.2: Testing Infrastructure

**Setup**:
- Vitest for unit tests
- Supertest for API tests
- Playwright for E2E tests

**Create Tests** (aim for 40% coverage):
- API endpoint tests
- Utility function tests
- Component tests
- Integration tests

**Effort**: 40 hours

---

### Phase 3 Summary

**Total Effort**: 64 hours
**Timeline**: 2 weeks

---

## Phase 4: Performance (Week 7-8)

### Sprint 4.1: Database Optimization

**Changes**:
- Add missing indexes
- Implement pagination
- Add soft deletes
- Fix N+1 queries

**Effort**: 16 hours

---

### Sprint 4.2: Bundle Optimization

**Changes**:
- Code splitting by route
- Lazy loading features
- Remove unused dependencies
- Optimize images

**Effort**: 16 hours

---

### Sprint 4.3: Caching Strategy

**Implement**:
- HTTP cache headers
- revalidateTag()
- SWR client caching
- Database query caching

**Effort**: 12 hours

---

### Phase 4 Summary

**Total Effort**: 44 hours
**Timeline**: 2 weeks

---

## Timeline & Dependencies

```
┌─ Phase 1: Security (Week 1-2) 🔴 BLOCKER
│   ├─ 1.1: JWT Auth (2d)
│   ├─ 1.2: RLS (2d)
│   ├─ 1.3: Input Validation (3d)
│   ├─ 1.4: Headers/CSRF (2d)
│   └─ 1.5: Testing (1d)
│
├─ Phase 2: Architecture (Week 3-4) [Depends on Phase 1]
│   ├─ 2.1: Monolithic Split (4d)
│   ├─ 2.2: Feature Org (3d)
│   ├─ 2.3: Error Handling (2d)
│   └─ 2.4: State Management (3d)
│
├─ Phase 3: Quality (Week 5-6) [Depends on Phase 2]
│   ├─ 3.1: Component Refactor (4d)
│   └─ 3.2: Testing (4d)
│
└─ Phase 4: Performance (Week 7-8) [Depends on Phase 1-3]
    ├─ 4.1: Database (3d)
    ├─ 4.2: Bundle (3d)
    └─ 4.3: Caching (2d)
```

**Total Timeline**: 8 weeks
**Cannot parallelize**: Phase 1 must complete before anything else

---

## Go/No-Go Gates

### Gate 1: After Phase 1
**Must Have**:
- ✅ JWT verified
- ✅ RLS enforced
- ✅ Input validation
- ✅ Security headers

**Decision**: PROCEED to Phase 2

### Gate 2: After Phase 2
**Must Have**:
- ✅ Monolithic file split
- ✅ Feature organization
- ✅ Error handling
- ✅ State management

**Decision**: PROCEED to Phase 3

### Gate 3: After Phase 3
**Must Have**:
- ✅ Components refactored
- ✅ 40% test coverage
- ✅ All tests passing

**Decision**: PROCEED to Phase 4

### Gate 4: After Phase 4
**Must Have**:
- ✅ Database indexes added
- ✅ Bundle < 200KB
- ✅ Caching working
- ✅ Performance tests pass

**Decision**: READY FOR PRODUCTION

---

## Team Assignments

### Core Team (Full-time)
- **Senior Engineer 1**: Security & Database (Phase 1-2)
- **Senior Engineer 2**: Architecture & State (Phase 2-3)
- **Engineer 3**: Testing & Performance (Phase 3-4)

### Support
- **Tech Lead**: Architecture decisions, reviews
- **QA**: Testing strategy, test infrastructure

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Breaking imports | Comprehensive find/replace, automated tests |
| Data loss | Database backup before each migration |
| Regression bugs | Full test coverage, staging environment |
| Performance issues | Load testing after each phase |
| Team disruption | Clear schedule, predictable changes |

---

## Success Metrics

### Phase 1
- ✅ 0 security vulnerabilities in audit
- ✅ All tests pass
- ✅ Smooth auth transition

### Phase 2
- ✅ All files < 300 LOC
- ✅ 0 import errors
- ✅ Clear feature boundaries

### Phase 3
- ✅ 40% test coverage
- ✅ 0 major bugs
- ✅ Faster development

### Phase 4
- ✅ Bundle < 200KB
- ✅ TTI < 3 seconds
- ✅ Pagination working

---

## Post-Refactoring

After completion:
- Document final architecture
- Create developer guide
- Plan for ongoing maintenance
- Establish code review standards
- Schedule quarterly reviews

**Result**: Production-ready, maintainable codebase.

