# Engineering Standards - Tickly v2

This document defines all engineering standards and conventions that future developers must follow.

## Table of Contents

1. [Project Principles](#project-principles)
2. [Folder Conventions](#folder-conventions)
3. [Naming Conventions](#naming-conventions)
4. [TypeScript Standards](#typescript-standards)
5. [React Standards](#react-standards)
6. [Next.js Standards](#nextjs-standards)
7. [API Standards](#api-standards)
8. [Database Standards](#database-standards)
9. [Security Requirements](#security-requirements)
10. [Testing Requirements](#testing-requirements)
11. [Accessibility Requirements](#accessibility-requirements)
12. [Documentation Standards](#documentation-standards)
13. [Performance Standards](#performance-standards)
14. [Definition of Done](#definition-of-done)
15. [Code Review Checklist](#code-review-checklist)
16. [Pull Request Checklist](#pull-request-checklist)
17. [Architecture Principles](#architecture-principles)

---

## Project Principles

### 1. Security First
- Security is not optional or negotiable
- Every feature must include security review
- Assume user input is malicious
- No secrets in code or repositories

### 2. User-Centric
- Every decision considers user experience
- Accessibility is required, not optional
- Performance matters - optimize for slowest users
- Clear error messages help users understand failures

### 3. Maintainability
- Code is read 10x more than written
- Future developers must understand your code
- Comments explain "why", not "what"
- No clever code, clarity over cleverness

### 4. Scalability
- Design for 10x growth
- Avoid hardcoded limits
- Plan for multi-tenancy from day one
- Database queries must scale

### 5. Quality
- No technical debt accumulation
- Tests are required for business logic
- Code reviews catch issues early
- Continuous improvement mindset

---

## Folder Conventions

### Feature-Based Structure
```
src/
├── features/                    # Feature modules
│   ├── auth/
│   │   ├── api/                # API routes
│   │   ├── components/         # React components
│   │   ├── hooks/              # Custom hooks
│   │   ├── lib/                # Utilities
│   │   ├── types/              # TypeScript types
│   │   └── constants.ts
│   ├── tickets/
│   ├── organizations/
│   ├── customers/
│   └── [feature-name]/
├── shared/                      # Shared code
│   ├── api/                    # Shared API utilities
│   ├── components/             # Shared components
│   ├── hooks/                  # Shared hooks
│   ├── lib/                    # Shared utilities
│   ├── types/                  # Shared types
│   └── constants.ts
├── app/                         # Next.js routing (minimal logic)
│   ├── layout.tsx
│   ├── page.tsx
│   ├── api/
│   └── [route]/
└── middleware.ts
```

### Rules
- ✅ Colocate related code (types, hooks, components in feature folder)
- ✅ Share only truly shared code in `/shared`
- ✅ Every feature is independently deployable
- ❌ Never import from different feature directly
- ❌ Use feature exports for cross-feature communication
- ❌ Keep `/app` directory only for routing

---

## Naming Conventions

### Files and Folders
```
# Components (PascalCase)
src/components/TicketList.tsx
src/features/tickets/components/TicketCard.tsx

# Utilities and helpers (camelCase)
src/lib/formatDate.ts
src/features/auth/lib/generateToken.ts

# Hooks (camelCase with 'use' prefix)
src/hooks/useTickets.ts
src/hooks/useAuth.ts

# API routes (kebab-case)
src/app/api/admin/tickets/route.ts
src/app/api/v1/public/tickets/route.ts

# Types (PascalCase)
src/types/User.ts
src/features/tickets/types/Ticket.ts

# Constants (UPPER_SNAKE_CASE)
src/constants/PERMISSIONS.ts
src/lib/ERROR_CODES.ts

# Tests
src/components/__tests__/TicketList.test.tsx
src/lib/__tests__/formatDate.test.ts
```

### Variables and Functions
```typescript
// Constants
const MAX_ITEMS_PER_PAGE = 50
const DEFAULT_TIMEOUT_MS = 5000

// Variables
const userData: User = {}
let isLoading = false

// Functions
function formatTicketDate(date: Date): string {}
async function fetchUserTickets(userId: string): Promise<Ticket[]> {}

// React components
function TicketList() {}
function useTickets() {}

// Callbacks with clear intent
const handleTicketSubmit = () => {}
const onTicketStatusChange = () => {}

// Booleans with clear predicates
const isLoading = false
const hasPermission = true
const canAccess = false
```

---

## TypeScript Standards

### 1. Strict Mode
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### 2. Type Definitions
```typescript
// ✅ GOOD: Explicit types everywhere
function getUser(id: string): Promise<User> {
  return fetchUser(id)
}

const users: User[] = []
const userData: Record<string, unknown> = {}

// ❌ BAD: Missing types
function getUser(id) {
  return fetchUser(id)
}

let users = []
let userData = {}
```

### 3. Avoid Any
```typescript
// ✅ GOOD: Use specific types
interface ApiResponse {
  data: unknown
  error?: Error
}

// ❌ BAD: Any is a type escape
function handleResponse(data: any) {}
let config: any = {}
```

### 4. Use Union Types for Variants
```typescript
// ✅ GOOD: Discriminated unions
type TicketStatus = 'open' | 'closed' | 'pending'

interface TicketApiState {
  status: 'idle' | 'loading' | 'success' | 'error'
  data?: Ticket
  error?: Error
}

// ❌ BAD: Multiple optional fields
interface TicketState {
  isLoading?: boolean
  ticket?: Ticket
  error?: string
}
```

### 5. Use Enums for Fixed Sets
```typescript
// ✅ GOOD: Enum for permissions
enum Permission {
  VIEW_TICKETS = 'view_tickets',
  CREATE_TICKET = 'create_ticket',
  MANAGE_USERS = 'manage_users'
}

// ❌ BAD: String literals scattered
const permission = 'view_tickets'
```

---

## React Standards

### 1. Component Structure
```typescript
// ✅ GOOD: Clear structure
interface TicketCardProps {
  ticket: Ticket
  onStatusChange: (status: TicketStatus) => void
}

export function TicketCard({ ticket, onStatusChange }: TicketCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  
  const handleSave = () => {
    // handler logic
    setIsEditing(false)
  }
  
  return (
    <div className="ticket-card">
      {/* JSX */}
    </div>
  )
}

// ❌ BAD: Unclear prop drilling, inline callbacks
export function TicketCard(props) {
  return <div onClick={() => props.onStatusChange('open')}>...</div>
}
```

### 2. Hook Rules
```typescript
// ✅ GOOD: Hooks at top level
function TicketList() {
  const { tickets, isLoading } = useTickets()
  const [selectedId, setSelectedId] = useState(null)
  
  if (isLoading) return <Loading />
  return <div>{/* render */}</div>
}

// ❌ BAD: Conditional hooks
function TicketList() {
  if (someCondition) {
    const { tickets } = useTickets()  // ❌ Conditional
  }
}
```

### 3. Extract Custom Hooks
```typescript
// ✅ GOOD: Extract business logic to hook
function useTickets(organizationId: string) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    // fetch logic
  }, [organizationId])
  
  return { tickets, isLoading, error }
}

// In component
function TicketList() {
  const { tickets, isLoading } = useTickets('org-123')
  // ...
}

// ❌ BAD: All logic in component
function TicketList() {
  const [tickets, setTickets] = useState([])
  useEffect(() => {
    // fetch logic
  }, [])
  // ...
}
```

### 4. Use Error Boundaries
```typescript
// ✅ GOOD: Error boundary for each feature
<ErrorBoundary fallback={<ErrorPage />}>
  <TicketList />
</ErrorBoundary>

// ❌ BAD: No error handling
<TicketList />
```

### 5. Memoization Guidelines
```typescript
// ✅ GOOD: Memoize when props expensive to compute
const TicketList = memo(function TicketList({
  tickets,
  onSelect
}: Props) {
  return <div>{/* render */}</div>
})

// ❌ BAD: Over-memoization
const value = useMemo(() => ({
  name: 'John'  // Simple value, no memoization needed
}), [])
```

---

## Next.js Standards

### 1. Use App Router
- ✅ Use `/app` directory
- ❌ Don't use Pages Router
- Route segments match folder structure
- Dynamic routes use `[param]` syntax

### 2. Server Components by Default
```typescript
// ✅ GOOD: Server component (default)
export default async function Page() {
  const tickets = await getTickets()
  return <TicketList tickets={tickets} />
}

// ✅ Add 'use client' only when needed
'use client'
export function TicketForm() {
  // Client-only logic
}

// ❌ BAD: Using 'use client' everywhere
'use client'
export default function Page() {
  const tickets = await getTickets()  // ❌ Can't use await
}
```

### 3. Layout Structure
```
app/
├── layout.tsx                    # Root layout
├── page.tsx                      # Root page
├── api/                         # API routes
├── (admin)/
│   ├── layout.tsx               # Admin layout
│   ├── dashboard/
│   └── tickets/
└── (customer)/
    ├── layout.tsx               # Customer layout
    └── support/
```

### 4. Metadata
```typescript
// ✅ GOOD: Add metadata for SEO
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tickly - Support Tickets',
  description: 'Manage your support tickets',
}

export default function Page() {
  return <div>page</div>
}
```

---

## API Standards

### 1. Response Format
```typescript
// Standard response wrapper
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
  meta?: {
    pagination?: {
      total: number
      page: number
      pageSize: number
    }
  }
}

// ✅ GOOD: Consistent responses
export async function GET(request: Request) {
  const tickets = await getTickets()
  return NextResponse.json({
    success: true,
    data: tickets
  })
}

// Error response
export async function POST(request: Request) {
  try {
    const data = await createTicket(request)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'CREATE_FAILED',
        message: error.message
      }
    }, { status: 500 })
  }
}
```

### 2. Input Validation
```typescript
// ✅ GOOD: Validate all inputs
import { z } from 'zod'

const CreateTicketSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(10),
  priority: z.enum(['low', 'medium', 'high'])
})

export async function POST(request: Request) {
  const body = await request.json()
  const validated = CreateTicketSchema.parse(body)
  // ...
}

// ❌ BAD: No validation
export async function POST(request: Request) {
  const { title, description } = await request.json()
  // Directly use without validation
}
```

### 3. Error Handling
```typescript
// ✅ GOOD: Consistent error handling
export async function POST(request: Request) {
  try {
    const data = await request.json()
    const result = await processTicket(data)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.message }
      }, { status: 400 })
    }
    logger.error('Ticket processing failed', { error })
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Processing failed' }
    }, { status: 500 })
  }
}
```

### 4. Authentication & Authorization
```typescript
// ✅ GOOD: Check auth on every endpoint
export async function GET(request: Request) {
  const user = await getRequestSessionUser()
  if (!user) {
    return NextResponse.json({
      success: false,
      error: { code: 'UNAUTHORIZED' }
    }, { status: 401 })
  }
  
  if (!hasPermission(user, 'view_tickets')) {
    return NextResponse.json({
      success: false,
      error: { code: 'FORBIDDEN' }
    }, { status: 403 })
  }
  
  // Process request
}
```

---

## Database Standards

### 1. Naming Convention
```sql
-- Tables (singular, snake_case)
CREATE TABLE user (...)
CREATE TABLE ticket (...)
CREATE TABLE organization (...)

-- Columns (snake_case)
user_id, created_at, updated_at

-- Foreign keys
table_name_id

-- Constraints (explicit)
CONSTRAINT fk_ticket_user FOREIGN KEY (user_id)

-- Indexes (show intent)
CREATE INDEX idx_ticket_organization_id ON ticket(organization_id)
CREATE INDEX idx_ticket_status_created_at ON ticket(status, created_at)
```

### 2. Timestamp Columns
```sql
-- Every table needs these
CREATE TABLE ticket (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP  -- For soft deletes
)

-- Use trigger for updated_at
CREATE TRIGGER update_ticket_updated_at
BEFORE UPDATE ON ticket
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### 3. Foreign Keys & Constraints
```sql
-- ✅ GOOD: Explicit constraints
CREATE TABLE ticket (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customer(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMP DEFAULT NOW()
)

-- ❌ BAD: Missing constraints
CREATE TABLE ticket (
  id UUID,
  organization_id UUID,
  status VARCHAR(255),
  created_at TIMESTAMP
)
```

### 4. Indexes for Performance
```sql
-- ✅ GOOD: Strategic indexes
CREATE INDEX idx_ticket_organization_id ON ticket(organization_id)
CREATE INDEX idx_ticket_customer_id ON ticket(customer_id)
CREATE INDEX idx_ticket_status_created_at ON ticket(status, created_at DESC)
CREATE INDEX idx_user_email ON user(email) UNIQUE

-- ❌ BAD: No indexes or all columns
-- Causes N+1 queries and full table scans
```

### 5. Row Level Security (RLS)
```sql
-- ✅ GOOD: RLS enabled
ALTER TABLE ticket ENABLE ROW LEVEL SECURITY;

CREATE POLICY ticket_access_policy ON ticket
  FOR SELECT
  USING (auth.uid() = user_id OR
         user_id IN (SELECT id FROM user WHERE organization_id = ticket.organization_id));

-- ❌ BAD: No RLS
-- Anyone can access any data if authenticated
```

---

## Security Requirements

### 1. Authentication
- ✅ Use RS256 JWT tokens with signature verification
- ✅ Tokens expire in 7 days maximum
- ✅ Refresh tokens stored in httpOnly cookies
- ✅ Sessions validated on every request
- ❌ Never store secrets in code
- ❌ Never use symmetric signing

### 2. Authorization
- ✅ Check permissions on every API endpoint
- ✅ Use role-based access control (RBAC)
- ✅ Validate organization membership
- ✅ Enforce resource-level permissions
- ❌ Never trust client-side permission checks

### 3. Input Validation
- ✅ Validate all user inputs with Zod/Joi
- ✅ Reject unexpected fields
- ✅ Sanitize string inputs
- ❌ Never trust user input

### 4. CSRF Protection
- ✅ Use SameSite cookies
- ✅ Add CSRF tokens to forms
- ✅ Validate token on state-changing requests
- ❌ Never disable CSRF protection

### 5. Headers
- ✅ Content-Security-Policy
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ Strict-Transport-Security
- ✅ X-XSS-Protection: 1; mode=block

### 6. Secrets Management
- ✅ Use environment variables
- ✅ Never commit secrets
- ✅ Rotate secrets regularly
- ✅ Use different secrets per environment
- ❌ Never log secrets
- ❌ Never send secrets to client

---

## Testing Requirements

### 1. Test Coverage
- ✅ Aim for 80% coverage for new code
- ✅ 100% coverage for critical paths (auth, payments)
- ✅ All API endpoints have tests
- ✅ All utilities have tests

### 2. Test Types
```typescript
// Unit tests: utilities, hooks, logic (70%)
describe('formatDate', () => {
  it('formats date correctly', () => {
    expect(formatDate(new Date('2024-01-01'))).toBe('Jan 1, 2024')
  })
})

// Integration tests: API routes (20%)
describe('POST /api/tickets', () => {
  it('creates ticket with valid input', async () => {
    const res = await fetch('/api/tickets', {
      method: 'POST',
      body: JSON.stringify({ title: 'Bug' })
    })
    expect(res.status).toBe(201)
  })
})

// E2E tests: critical user paths (10%)
describe('Submit ticket flow', () => {
  it('user can submit and view ticket', async () => {
    await page.goto('/submit-ticket')
    await page.fill('input[name="title"]', 'My Issue')
    await page.click('button[type="submit"]')
    await expect(page).toContainText('Ticket created')
  })
})
```

### 3. Test File Location
```
src/components/__tests__/TicketCard.test.tsx
src/lib/__tests__/formatDate.test.ts
src/features/tickets/lib/__tests__/ticketService.test.ts
```

---

## Accessibility Requirements

### 1. Semantic HTML
```typescript
// ✅ GOOD: Semantic elements
<main>
  <header>
    <nav>Navigation</nav>
  </header>
  <article>Content</article>
  <aside>Sidebar</aside>
  <footer>Footer</footer>
</main>

// ❌ BAD: Everything as divs
<div>
  <div>
    <div>Navigation</div>
  </div>
  <div>Content</div>
</div>
```

### 2. ARIA Attributes
```typescript
// ✅ GOOD: ARIA for complex widgets
<button aria-expanded={isOpen} aria-controls="menu">
  Menu
</button>
<div id="menu" role="menu" hidden={!isOpen}>
  {/* menu items */}
</div>

// ❌ BAD: Missing ARIA
<div onClick={handleClick}>Click me</div>
```

### 3. Keyboard Navigation
```typescript
// ✅ GOOD: All interactive elements are keyboard accessible
<button onClick={handleSubmit}>Submit</button>
<input type="text" onKeyDown={handleEnter} />

// ❌ BAD: Only mouse accessible
<div onClick={handleClick}>Not keyboard accessible</div>
```

### 4. Color Contrast
- ✅ Minimum 4.5:1 for text
- ✅ Minimum 3:1 for large text
- ✅ Test with accessibility tools

### 5. Focus Management
```typescript
// ✅ GOOD: Visible focus indicators
button {
  &:focus {
    outline: 2px solid blue;
  }
}
```

---

## Documentation Standards

### 1. Code Comments
```typescript
// ✅ GOOD: Comments explain WHY
// We use RS256 for token signing because it allows public key
// verification across multiple services without sharing secrets
export const JWT_ALGORITHM = 'RS256'

// ❌ BAD: Comments state the obvious
// Increment counter
counter++
```

### 2. JSDoc for Public APIs
```typescript
/**
 * Fetches tickets for the given organization.
 * 
 * @param organizationId - UUID of the organization
 * @param options - Fetch options
 * @param options.limit - Maximum tickets to return (default: 50)
 * @param options.offset - Pagination offset (default: 0)
 * @param options.status - Filter by status (default: all)
 * @returns Promise resolving to array of tickets
 * @throws {UnauthorizedError} If user lacks permissions
 * @throws {ValidationError} If organizationId is invalid
 */
export async function getTickets(
  organizationId: string,
  options?: FetchOptions
): Promise<Ticket[]> {
  // implementation
}
```

### 3. README Standards
- Top-level README explains project purpose
- Features documented with examples
- Setup instructions for new developers
- Architecture diagram
- Contributing guidelines

---

## Performance Standards

### 1. Database Queries
- ✅ All queries have accompanying indexes
- ✅ Pagination implemented (max 50 items per request)
- ✅ N+1 queries eliminated
- ✅ Unnecessary columns not fetched

### 2. Bundle Size
- ✅ Keep bundle under 250KB
- ✅ Lazy load features over 50KB
- ✅ Monitor dependencies with `npm audit`

### 3. Rendering
- ✅ Time to Interactive (TTI) < 3 seconds
- ✅ Largest Contentful Paint (LCP) < 2.5 seconds
- ✅ Cumulative Layout Shift (CLS) < 0.1

---

## Definition of Done

A feature is complete only when:

- [ ] Code written and committed
- [ ] All tests passing (80%+ coverage)
- [ ] Code reviewed and approved
- [ ] No console warnings or errors
- [ ] TypeScript strict mode passing
- [ ] Security review completed
- [ ] Accessibility tested
- [ ] Documentation updated
- [ ] Performance tested
- [ ] Works on mobile (responsive)
- [ ] Handles error states
- [ ] Database migrations included
- [ ] PR merged to main

---

## Code Review Checklist

Reviewers must verify:

- [ ] Follows naming conventions
- [ ] Follows folder structure
- [ ] TypeScript strict compliance
- [ ] No `any` types used
- [ ] No console logs left in code
- [ ] Error handling present
- [ ] No performance regressions
- [ ] Tests included and passing
- [ ] Security best practices followed
- [ ] Accessibility requirements met
- [ ] Documentation updated
- [ ] No hardcoded values
- [ ] No secrets committed

---

## Pull Request Checklist

Before submitting PR:

- [ ] Branch name descriptive (e.g. `feat/ticket-search`)
- [ ] Commits are atomic and well-messaged
- [ ] PR title clearly describes change
- [ ] PR description explains context
- [ ] Tests included and passing
- [ ] No console errors/warnings
- [ ] TypeScript strict mode passing
- [ ] No new `any` types
- [ ] No security issues
- [ ] Accessibility tested
- [ ] Ready for review

### Commit Message Format
```
type(scope): short description (max 50 chars)

Longer explanation if needed (wrap at 72 chars).
Explain the problem being solved.
Explain the solution approach.

Fixes #123
Closes #456
```

Examples:
- `feat(tickets): add ticket search filtering`
- `fix(auth): handle expired token refresh correctly`
- `refactor(api): standardize response format`
- `docs(readme): add setup instructions`
- `test(tickets): add E2E test for creation flow`

---

## Architecture Principles

### 1. Separation of Concerns
- UI code separate from business logic
- API routes minimal, delegate to services
- Components focused on single responsibility

### 2. DRY (Don't Repeat Yourself)
- Extract shared logic to utilities
- Extract shared components
- Extract shared types
- Reuse established patterns

### 3. KISS (Keep It Simple, Stupid)
- Simple is better than clever
- Straightforward code over short code
- Easy to understand over compact

### 4. YAGNI (You Aren't Gonna Need It)
- Don't add features "just in case"
- Implement only what's needed now
- Extract abstractions when pattern emerges

### 5. Fail Fast
- Validate early
- Throw errors explicitly
- Don't silently fail
- Make bugs obvious

---

## Summary

All future development must follow these standards without exception. Violations are caught in code review and must be addressed before merge.

When in doubt, ask. Better to clarify than to guess wrong.

