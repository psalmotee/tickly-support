# Architecture Decision Records (ADR) - Tickly v2

## Index of Decisions

1. [ADR-001: Folder Structure & Feature Organization](#adr-001)
2. [ADR-002: Authentication & JWT Implementation](#adr-002)
3. [ADR-003: Authorization & RBAC](#adr-003)
4. [ADR-004: State Management](#adr-004)
5. [ADR-005: API Design & Conventions](#adr-005)
6. [ADR-006: Database Organization](#adr-006)
7. [ADR-007: Component Architecture](#adr-007)
8. [ADR-008: Server vs Client Components](#adr-008)
9. [ADR-009: Caching Strategy](#adr-009)
10. [ADR-010: Error Handling](#adr-010)
11. [ADR-011: Logging & Observability](#adr-011)
12. [ADR-012: Security Headers & CSRF](#adr-012)
13. [ADR-013: Testing Architecture](#adr-013)
14. [ADR-014: Deployment Strategy](#adr-014)

---

## ADR-001: Folder Structure & Feature Organization

### Decision
Reorganize from current flat structure to a feature-based modular architecture with clear separation of concerns.

### Problem
Current structure has:
- Single `lib/` directory with 2,757-line monolithic file
- Mixed responsibilities across files
- Difficult to locate feature-specific code
- No clear feature boundaries
- Hard to scale to multiple teams

### Current Implementation
```
src/
├── app/
│   ├── api/
│   ├── admin-dashboard/
│   ├── customer/
│   └── user-dashboard/
├── lib/ (mixed concerns)
├── components/ (all flat)
└── hooks/
```

### Options Considered

**Option A: Flat Structure (Current)**
- Pros: Simple, easy to start
- Cons: Doesn't scale, monolithic files, hard to find code

**Option B: Feature-Based Modules**
- Pros: Clear boundaries, scalable, team-friendly
- Cons: More directories to navigate

**Option C: Hexagonal Architecture**
- Pros: Clean separation, independent domains
- Cons: Over-engineered for current size

**Option D: Modular Monolith**
- Pros: Feature isolation, scalable, good for growing teams
- Cons: Needs clear module contracts

### Recommended Solution
Implement **Feature-Based Modular Architecture**:

```
src/
├── features/
│   ├── auth/
│   │   ├── api/
│   │   ├── hooks/
│   │   ├── components/
│   │   ├── lib/
│   │   └── types/
│   ├── tickets/
│   │   ├── api/
│   │   ├── hooks/
│   │   ├── components/
│   │   ├── lib/
│   │   └── types/
│   ├── organizations/
│   ├── customers/
│   ├── analytics/
│   └── notifications/
├── shared/
│   ├── api/
│   ├── lib/
│   ├── components/
│   ├── hooks/
│   └── types/
└── app/ (routing only)
```

### Reasoning
- **Scalability**: Each feature is independently maintainable
- **Ownership**: Teams can own specific features
- **Discoverability**: Related code is colocated
- **Testing**: Easier to test feature boundaries
- **Independence**: Features can be deployed/enabled independently

### Implementation Priority
🔴 HIGH - Block refactoring until complete

### Risk
- Need careful migration to avoid breaking changes
- Requires clear API contracts between features

### Breaking Changes
- All imports will need updating
- Need migration script for imports

### Rollback Strategy
- Git branch strategy: `refactor/folder-structure`
- Feature flags for gradual rollout
- Parallel old/new structure during transition

### Expected Benefits
- 40% faster feature development
- 30% fewer imports per file
- Easier onboarding for new team members

---

## ADR-002: Authentication & JWT Implementation

### Decision
Replace custom JWT implementation with industry-standard library using RS256 asymmetric signing.

### Problem
Current implementation:
- No JWT signature verification in `decodeJwtPayload()`
- Using HS256 with environment variable secret
- No expiration enforcement
- No token revocation support
- Vulnerable to token tampering

### Current Implementation
```typescript
// server-session.ts - INSECURE
function decodeJwtPayload(token: string): TokenPayload | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(json);  // ❌ NO SIGNATURE VERIFICATION
  } catch {
    return null;
  }
}
```

### Options Considered

**Option A: Keep Custom JWT**
- Pros: No external dependency
- Cons: Security liability, not tested, reinventing wheel

**Option B: Use jsonwebtoken library**
- Pros: Industry standard, widely used
- Cons: Requires secret management

**Option C: Use Next.js Auth.js**
- Pros: Full auth solution, session management
- Cons: More opinionated, larger footprint

**Option D: Use jose library**
- Pros: Modern, supports RS256, small footprint
- Cons: Need to manage key rotation

### Recommended Solution
Use **jose library with RS256 asymmetric signing**:

```typescript
import * as jose from 'jose'

const privateKey = Buffer.from(process.env.JWT_PRIVATE_KEY, 'base64')
const publicKey = Buffer.from(process.env.JWT_PUBLIC_KEY, 'base64')

export async function signToken(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(privateKey)
}

export async function verifyToken(token: string) {
  const verified = await jwtVerify(token, publicKey)
  return verified.payload
}
```

### Reasoning
- **Security**: RS256 provides public key verification, prevents tampering
- **Standard**: jose is modern, actively maintained
- **Scalability**: Supports key rotation
- **Auditability**: Clear signing/verification separation

### Implementation Priority
🔴 CRITICAL - Fix before production

### Risk
- Need to generate and manage RSA keys
- Existing sessions become invalid on migration
- Performance: RSA is slower than HS256

### Breaking Changes
- Existing JWT tokens will be invalid
- Need session migration script

### Rollback Strategy
- Support both old and new tokens during grace period
- Keep HS256 verification as fallback
- Plan 1-week grace period for token refresh

### Expected Benefits
- Eliminates token tampering vulnerability
- Enables multi-service token verification
- Industry-standard security practices

---

## ADR-003: Authorization & RBAC

### Decision
Implement role-based access control (RBAC) with organization-level and resource-level permissions.

### Problem
Current implementation:
- Only two roles: admin/user
- No organization scoping
- No resource-level permissions
- No permission matrix
- No delegation of roles

### Current Implementation
```typescript
// route-protection.ts - Overly simplistic
if (session && isAdminPage && !checkUserRole(session, "admin")) {
  return "/user-dashboard";
}
```

### Options Considered

**Option A: Keep Simple Roles**
- Pros: Simple to implement
- Cons: Doesn't scale, can't implement feature requests

**Option B: RBAC with Permissions Matrix**
- Pros: Flexible, scalable, fine-grained control
- Cons: More complex

**Option C: Attribute-Based Access Control (ABAC)**
- Pros: Extremely flexible
- Cons: Over-engineered for current needs

**Option D: Hierarchical Roles**
- Pros: More realistic, reflects org structure
- Cons: Additional complexity

### Recommended Solution
Implement **RBAC with Hierarchical Roles + Permissions Matrix**:

```typescript
enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  CUSTOMER = 'customer'
}

enum Permission {
  MANAGE_ORGANIZATION = 'manage_organization',
  MANAGE_USERS = 'manage_users',
  MANAGE_TICKETS = 'manage_tickets',
  VIEW_ANALYTICS = 'view_analytics',
  VIEW_TICKETS = 'view_tickets',
  CREATE_TICKET = 'create_ticket'
}

// Permissions matrix
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.OWNER]: [/* all permissions */],
  [Role.ADMIN]: [/* most permissions */],
  [Role.MEMBER]: [/* limited permissions */],
  [Role.CUSTOMER]: [Permission.VIEW_TICKETS, Permission.CREATE_TICKET]
}

function canAccess(user: User, permission: Permission): boolean {
  return ROLE_PERMISSIONS[user.role].includes(permission)
}
```

### Reasoning
- **Flexibility**: Supports future feature requests
- **Scalability**: Can add new roles/permissions without code changes
- **Security**: Fine-grained control
- **Audit**: Clear permission trails

### Implementation Priority
🔴 CRITICAL - Required for multi-tenant

### Risk
- Need migration of existing user roles
- Need to define permission matrix clearly

### Breaking Changes
- New role structure incompatible with current
- Need data migration script

### Rollback Strategy
- Keep old role column during transition
- Support both structures temporarily

### Expected Benefits
- Enables new customer tier features
- Better security posture
- Easier to audit permissions

---

## ADR-004: State Management

### Decision
Use React Context for shared state with SWR for server state and local React hooks for component state.

### Problem
Current implementation:
- No centralized state management
- Auth state scattered across cookies and context
- Inconsistent data fetching patterns
- No caching strategy

### Current Implementation
- Manual cookie handling
- Auth context in components
- No server state management
- Prop drilling

### Options Considered

**Option A: Redux**
- Pros: Robust, predictable
- Cons: Boilerplate-heavy for this size

**Option B: Zustand**
- Pros: Simple, modern, small footprint
- Cons: New library to learn

**Option C: React Context + SWR (Recommended)**
- Pros: Minimal dependencies, good for this scale
- Cons: Less powerful than Redux

**Option D: TanStack Query**
- Pros: Powerful, handles caching
- Cons: Larger bundle, overkill

### Recommended Solution
**React Context for auth + SWR for server state**:

```typescript
// contexts/auth-context.tsx
export const AuthContext = createContext<AuthContextType | null>(null)

// hooks/useAuth.ts
export function useAuth() {
  const { data: user, isLoading, error } = useSWR('/api/auth/me')
  return { user, isLoading, error }
}

// hooks/useTickets.ts
export function useTickets(orgId: string) {
  const { data, mutate, isLoading } = useSWR(
    `/api/admin/organizations/${orgId}/tickets`,
    fetcher
  )
  return { tickets: data, mutate, isLoading }
}
```

### Reasoning
- **Simplicity**: Easy to understand and maintain
- **Performance**: SWR provides caching out of box
- **Revalidation**: Automatic background sync
- **DevX**: Good debugging experience

### Implementation Priority
🟡 HIGH - Improves code quality

### Risk
- Need to migrate all data fetching patterns
- SWR learning curve

### Breaking Changes
- Change data fetching throughout app

### Rollback Strategy
- Gradual migration, route by route

### Expected Benefits
- 50% less state management code
- Automatic cache invalidation
- Better performance with background sync

---

## ADR-005: API Design & Conventions

### Decision
Standardize API design with consistent response format, error handling, and versioning.

### Problem
Current implementation has:
- Inconsistent response formats
- Mixed error handling
- No input validation
- Overlapping routes
- Missing API versioning

### Current Implementation
```typescript
// Some routes return { data }
return NextResponse.json({ data: tickets })

// Some return { success, data }
return NextResponse.json({ success: true, tickets })

// Some return raw data
return NextResponse.json(ticket)

// Errors are inconsistent
return NextResponse.json({ error: 'Not found' }, { status: 404 })
return NextResponse.json('Unauthorized', { status: 401 })
```

### Recommended Solution
**Standardized REST API with consistent format**:

```typescript
// Standard response format
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, string>
  }
  meta?: {
    pagination?: {
      total: number
      page: number
      pageSize: number
    }
  }
}

// Standard error responses
const ApiError = {
  BadRequest: (message: string) => ({
    success: false,
    error: { code: 'BAD_REQUEST', message }
  }),
  Unauthorized: () => ({
    success: false,
    error: { code: 'UNAUTHORIZED', message: 'Not authenticated' }
  }),
  Forbidden: () => ({
    success: false,
    error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
  })
}

// Use in routes
export async function GET(request: Request) {
  try {
    const tickets = await getTickets()
    return NextResponse.json({
      success: true,
      data: tickets
    })
  } catch (error) {
    return NextResponse.json(
      ApiError.BadRequest(error.message),
      { status: 400 }
    )
  }
}
```

### Reasoning
- **Consistency**: Frontend knows what to expect
- **Error Handling**: Clear error codes for client
- **Pagination**: Built-in support for list endpoints
- **Versioning**: Can evolve without breaking clients

### Implementation Priority
🔴 HIGH - Fix before scaling

### Risk
- Need to update all 39 API routes
- Breaking change for consumers

### Expected Benefits
- 50% faster frontend integration
- Better error handling
- Easier to add new features

---

## ADR-006: Database Organization

### Decision
Reorganize Supabase with clear table ownership, triggers, and RLS policies.

### Problem
Current implementation:
- No RLS policies enabled
- Missing foreign key constraints
- No indexes on query fields
- No automatic timestamp management
- No soft deletes

### Recommended Solution
**Implement RLS, indexes, and proper constraints**

### Implementation Priority
🔴 CRITICAL - Security blocker

---

## ADR-007: Component Architecture

### Decision
Implement composition-based component architecture with clear separation of UI and business logic.

### Problem
- giant components (620 LOC widget-form)
- Mixed concerns (UI + logic)
- Hard to test
- Difficult to reuse

### Recommended Solution
```typescript
// Separate presentational and container components
// widget-form.tsx (container) - handles logic
// widget-form-ui.tsx (presentational) - renders UI
// widget-form-hooks.ts (hooks) - business logic
```

### Implementation Priority
🟡 HIGH - Improves maintainability

---

## ADR-008: Server vs Client Components

### Decision
Use Server Components by default, Client Components only when needed.

### Problem
- Unclear which components should be Server vs Client
- Potential performance issues
- Possible security issues

### Current Implementation
Mix of both without clear strategy

### Recommended Solution
**Default to Server Components**:
- All pages are Server Components
- Data fetching happens on server
- Client Components only for interactivity

### Implementation Priority
🟡 MEDIUM - Optimization

---

## ADR-009: Caching Strategy

### Decision
Implement multi-layer caching: HTTP cache headers, revalidateTag, and SWR.

### Problem
- No caching strategy
- N+1 queries
- High database load
- Slow user experience

### Recommended Solution
- HTTP cache headers (public/private, max-age)
- revalidateTag for on-demand revalidation
- SWR for client-side caching

### Implementation Priority
🟡 HIGH - Performance

---

## ADR-010: Error Handling

### Decision
Implement centralized error handling with error boundaries and consistent logging.

### Problem
- Errors not caught consistently
- No error boundaries
- Users see blank screens
- Difficult to debug

### Recommended Solution
```typescript
// Error boundaries for React
class ErrorBoundary extends React.Component { }

// API error handler middleware
function handleApiError(error: Error) {
  logger.error(error)
  return ApiError.InternalServerError()
}
```

### Implementation Priority
🟡 HIGH - User experience

---

## ADR-011: Logging & Observability

### Decision
Implement structured logging with Winston/Pino and integrate with Sentry.

### Problem
- console.error scattered everywhere
- No log aggregation
- Hard to trace issues
- No error tracking

### Recommended Solution
```typescript
import { logger } from '@/lib/logger'

logger.info('User logged in', { userId: user.id })
logger.error('Database query failed', { error })
```

### Implementation Priority
🟡 MEDIUM - Essential for production

---

## ADR-012: Security Headers & CSRF

### Decision
Add comprehensive security headers and CSRF protection.

### Problem
- Missing security headers
- No CSRF protection
- XSS vulnerability
- No rate limiting

### Recommended Solution
- Add security headers middleware
- Implement CSRF tokens
- Add rate limiting

### Implementation Priority
🔴 CRITICAL - Security

---

## ADR-013: Testing Architecture

### Decision
Implement testing pyramid: unit tests (70%), integration tests (20%), e2e tests (10%).

### Problem
- 0% test coverage
- No testing infrastructure
- No testing guidelines

### Recommended Solution
```typescript
// Unit tests with Vitest
// Integration tests with Supertest
// E2E tests with Playwright
```

### Implementation Priority
🟡 HIGH - Quality

---

## ADR-014: Deployment Strategy

### Decision
Implement blue-green deployment with feature flags and gradual rollouts.

### Problem
- No deployment strategy documented
- All-or-nothing deployments
- High risk of production issues

### Recommended Solution
- Blue-green deployment on Vercel
- Feature flags for gradual rollout
- Database migration strategy

### Implementation Priority
🟡 MEDIUM - Risk reduction

---

## Summary Table

| ADR | Decision | Priority | Risk | Status |
|-----|----------|----------|------|--------|
| 001 | Folder Structure | HIGH | Medium | Blocked |
| 002 | JWT Implementation | CRITICAL | High | Blocked |
| 003 | RBAC | CRITICAL | Medium | Blocked |
| 004 | State Management | HIGH | Low | Blocked |
| 005 | API Conventions | HIGH | High | Blocked |
| 006 | Database Organization | CRITICAL | High | Blocked |
| 007 | Component Architecture | HIGH | Low | Blocked |
| 008 | Server Components | MEDIUM | Low | Ready |
| 009 | Caching Strategy | HIGH | Medium | Ready |
| 010 | Error Handling | HIGH | Low | Ready |
| 011 | Logging | MEDIUM | Low | Ready |
| 012 | Security Headers | CRITICAL | High | Blocked |
| 013 | Testing | HIGH | Low | Ready |
| 014 | Deployment | MEDIUM | Medium | Ready |

**Implementation Sequence**: 002, 006, 012 → 001, 003, 005 → 007, 004 → Remaining

