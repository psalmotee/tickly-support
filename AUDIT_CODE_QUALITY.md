# Code Quality Audit - Detailed Analysis

## Overview

This document provides a deep dive into code quality issues, patterns, and specific recommendations for improvement.

---

## 1. Codebase Statistics

```
Total TypeScript/TSX Files:    97
Total Lines of Code:           ~15,000 (excluding node_modules)
Average File Size:             ~155 LOC
Largest File:                  supabase-helpers.ts (2,725 LOC) - 18% of total!
Second Largest:                widget-form.tsx (620 LOC)
Third Largest:                 team-management.tsx (469 LOC)

API Routes:                    39
Pages/Components:              35
Utility Modules:               18

Code Distribution:
├── Pages & Layouts:          ~3,500 LOC (23%)
├── Components:               ~4,409 LOC (29%)
├── API Routes:               ~2,000 LOC (13%)
├── Utilities & Lib:          ~4,060 LOC (27%)
└── Config:                   ~1,000 LOC (7%)
```

---

## 2. File-by-File Analysis

### Critical Files Requiring Refactoring

#### A. `src/lib/supabase-helpers.ts` (2,725 LOC) 🔴

**Current Structure:**
```typescript
// Everything in one file:
// - User CRUD (50 LOC)
// - Organization CRUD (100 LOC)
// - Organization Members (100 LOC)
// - Tickets CRUD (200 LOC)
// - Customers (150 LOC)
// - Custom Fields (200 LOC)
// - Email Preferences (100 LOC)
// - Websites (100 LOC)
// - Campaigns (150 LOC)
// - SLA (100 LOC)
// - And many more...
```

**Problems:**
1. IDE indexing extremely slow
2. 50+ named exports - hard to discover
3. Impossible to test single feature
4. Common merge conflicts
5. No clear data model separation

**Proposed Refactoring:**

```
src/lib/db/
├── index.ts                    (exports all modules)
├── types.ts                    (shared database types)
├── users.ts                    (User CRUD)
├── organizations.ts            (Organization CRUD)
├── organization-members.ts     (Member CRUD)
├── tickets.ts                  (Ticket CRUD)
├── customers.ts                (Customer CRUD)
├── custom-fields.ts            (Custom field CRUD)
├── email-preferences.ts        (Email settings)
├── websites.ts                 (Website CRUD)
├── campaigns.ts                (Campaign CRUD)
├── sla.ts                      (SLA CRUD)
├── support-tags.ts             (Tags CRUD)
└── queries.ts                  (Complex multi-table queries)
```

**Migration Steps:**
1. Create `src/lib/db/` directory
2. Extract each domain to separate file
3. Add proper exports in `index.ts`
4. Update all imports
5. Test thoroughly
6. Delete old file

**Estimated Time:** 2-3 days

---

#### B. `src/app/api/login/route.ts` (150 LOC) 🔴

**Current Issues:**
1. Custom JWT without signature verification
2. No proper session refresh mechanism
3. 7-day cookie expiry (too long)
4. Multiple session formats

**Security Concerns:**
```typescript
// ❌ NO SIGNATURE VERIFICATION
const token = Buffer.from(JSON.stringify(tokenPayload)).toString("base64url");
// Can be decoded and modified by attacker!
```

**Recommended Approach:**
```typescript
// ✅ USE PROPER JWT WITH SIGNATURE
import jwt from 'jsonwebtoken';

const token = jwt.sign(tokenPayload, process.env.JWT_SECRET!, {
  expiresIn: '1h',  // Short-lived
  algorithm: 'HS256'
});

// Verify on every request
const payload = jwt.verify(token, process.env.JWT_SECRET!);
```

**Alternative: Use next-auth**
```typescript
// Best option: use framework
import { auth } from "@/auth";
export const { POST } = auth.handlers;
```

---

#### C. `src/components/widget-form.tsx` (620 LOC) 🟡

**Current State:**
- Single file handling:
  - Form state management
  - Form validation
  - API calls
  - UI rendering
  - Error handling
  - Success messaging

**Problems:**
1. Hard to test individual features
2. Re-renders entire form unnecessarily
3. No component reusability
4. Complex state management

**Proposed Breakdown:**

```
src/components/widget/
├── index.ts                    (export main component)
├── WidgetForm.tsx              (Main form wrapper)
├── WidgetFormStep1.tsx         (Personal info section)
├── WidgetFormStep2.tsx         (Issue details section)
├── WidgetFormStep3.tsx         (Attachments section)
├── useWidgetFormState.ts       (State management hook)
├── useWidgetSubmit.ts          (API call hook)
└── useWidgetValidation.ts      (Validation logic)
```

**Benefits:**
- Each file ~100-150 LOC
- Easier to test
- Reusable sections
- Cleaner state management

**Estimated Time:** 1-2 days

---

#### D. `src/components/team-management.tsx` (469 LOC) 🟡

**Current Issues:**
1. Manages users, roles, invites in single file
2. Mixed business logic with UI
3. No separation of concerns

**Proposed Breakdown:**

```
src/components/team/
├── TeamManagement.tsx          (Main container)
├── TeamMembersList.tsx         (Display members)
├── TeamMemberRow.tsx           (Individual member)
├── InviteMemberForm.tsx        (Invite form)
├── PromoteDemoteDialog.tsx     (Role change)
├── RemoveMemberDialog.tsx      (Remove member)
└── useTeamManagement.ts        (API hook)
```

**Estimated Time:** 1-2 days

---

### High Priority Files

| File | LOC | Issues | Priority |
|------|-----|--------|----------|
| admin-ticket-list.tsx | 347 | N+1 queries, no pagination, large | HIGH |
| signup-form.tsx | 287 | Duplicate logic, weak validation | HIGH |
| customer-signup-content.tsx | 287 | Duplicate of signup-form | HIGH |
| dashboard-stats.tsx | 179 | Re-renders unnecessarily | HIGH |
| admin-users-list.tsx | 275 | Large, complex filtering | HIGH |

---

## 3. Pattern Issues

### Issue 1: Inconsistent API Response Formats

**Current Code:**

```typescript
// route 1: login/route.ts
return NextResponse.json({
  success: true,
  session: { ... }
});

// route 2: signup/route.ts
return NextResponse.json({
  data: { ... },
  error: null
});

// route 3: admin/admin-tickets-route/route.ts
return NextResponse.json({
  success: false,
  error: "Message"
});

// route 4: api/check-auth/route.ts
return NextResponse.json({
  success: true,
  session: { ... }
});
```

**Problem:** Inconsistent structure makes client code fragile.

**Solution:**

Create `src/lib/api-response.ts`:

```typescript
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export function successResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function errorResponse(code: string, message: string, details?: any): ApiResponse {
  return { success: false, error: { code, message, details } };
}

// Usage:
return NextResponse.json(successResponse(session));
return NextResponse.json(errorResponse("AUTH_INVALID", "Invalid credentials"));
```

---

### Issue 2: Inconsistent Error Handling

**Current Code:**

```typescript
// Pattern 1: Swallowed errors
const data = await res.json().catch(() => null);

// Pattern 2: Generic messages
return { success: false, error: "Login failed" };

// Pattern 3: No error context
throw new Error("Something went wrong");

// Pattern 4: Silent failures
if (error) {
  console.error("Error:", error);
  // Continue anyway
}
```

**Solution:**

Create `src/lib/errors.ts`:

```typescript
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
  }
}

export function handleError(error: unknown): ApiResponse {
  if (error instanceof AppError) {
    return errorResponse(error.code, error.message, error.details);
  }
  
  if (error instanceof Error) {
    console.error("[Error]", error);
    return errorResponse("UNKNOWN_ERROR", "An unexpected error occurred");
  }
  
  return errorResponse("UNKNOWN_ERROR", "An unexpected error occurred");
}
```

---

### Issue 3: Type Safety Issues

**Current Code:**

```typescript
// Many places use `any`
const ticket: any = await supabase
  .from("support_tickets")
  .select("*")
  .single();

// API responses not typed
const data = await res.json();  // type: any

// Function parameters loosely typed
export function mapTicketRecord(ticket: Record<string, any>, ...): EnrichedTicket { }
```

**Solution:**

Create `src/types/database.ts`:

```typescript
// Supabase table types
export interface User {
  id: string;
  email: string;
  full_name: string;
  password_hash: string;
  role: "admin" | "user";
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "closed";
  user_id: string;
  customer_id: string;
  organization_id: string;
  website_id?: string;
  created_at: string;
  updated_at: string;
}

// Enforce types throughout
const ticket: Ticket = await supabase
  .from("support_tickets")
  .select("*")
  .single();
```

---

## 4. Performance Hotspots

### Query Pattern Issues

**Problem 1: N+1 Queries**

```typescript
// ❌ BAD: 1 + N queries
const tickets = await supabase.from("support_tickets").select("*");
for (const ticket of tickets) {
  const user = await supabase.from("users")
    .select("*")
    .eq("id", ticket.user_id);
}

// ✅ GOOD: Single query with JOIN
const tickets = await supabase.from("support_tickets")
  .select(`*, user:user_id(*)`);
```

**Problem 2: Missing Pagination**

```typescript
// ❌ BAD: Returns all records
const { data: tickets } = await supabase
  .from("support_tickets")
  .select("*");

// ✅ GOOD: Limited results
const { data: tickets } = await supabase
  .from("support_tickets")
  .select("*")
  .range(0, 19)
  .order("created_at", { ascending: false });
```

**Problem 3: Over-fetching Data**

```typescript
// ❌ BAD: Fetches all columns
.select("*")

// ✅ GOOD: Only needed columns
.select("id, title, status, created_at, user_id")
```

---

### Component Re-render Issues

**Problem: Auth Provider**

```typescript
// ❌ Fetches session on every route change
useEffect(() => {
  const checkAuth = async () => {
    const res = await fetch("/api/check-auth");
    const data = await res.json();
    setSession(data.session);
  };
  checkAuth();
}, []);  // Runs on every mount
```

**Solution:**

```typescript
// ✅ Use React Query with proper caching
const { data: session } = useQuery({
  queryKey: ["auth", "session"],
  queryFn: async () => {
    const res = await fetch("/api/check-auth");
    return res.json();
  },
  staleTime: 5 * 60 * 1000, // 5 minutes
  retry: false,
});
```

---

## 5. Testing Gaps

### Current State: ❌ NO TESTS

**Missing Test Coverage:**

| Area | Coverage | Priority |
|------|----------|----------|
| Authentication | 0% | CRITICAL |
| API Routes | 0% | CRITICAL |
| Validation | 0% | HIGH |
| Components | 0% | HIGH |
| Utilities | 0% | MEDIUM |

**Recommended Test Setup:**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

// Example test: src/lib/__tests__/form-validation.test.ts
import { describe, it, expect } from 'vitest'
import { validateEmail, validatePassword } from '../form-validation'

describe('Form Validation', () => {
  it('should validate email addresses', () => {
    expect(validateEmail('user@example.com')).toBeNull()
    expect(validateEmail('invalid')).not.toBeNull()
  })

  it('should validate passwords', () => {
    expect(validatePassword('abc')).not.toBeNull() // Too short
    expect(validatePassword('validPassword123')).toBeNull()
  })
})
```

**Estimated Effort:** 3-5 days for critical path coverage

---

## 6. Code Smell Checklist

| Smell | Location | Severity | Action |
|-------|----------|----------|--------|
| Long parameter lists | Multiple API routes | MEDIUM | Extract objects |
| Magic numbers | Throughout | MEDIUM | Extract constants |
| Duplicate code | signup-form, customer-signup-content | HIGH | Extract shared logic |
| Deep nesting | Complex components | MEDIUM | Extract helpers |
| Global state | `useAuth()` everywhere | LOW | Already using context |
| Dead code | manta-client.ts | HIGH | Delete |
| Catch-all types | `Record<string, any>` | HIGH | Add proper types |
| Console.logs in production | Everywhere | MEDIUM | Use logger |

---

## 7. Recommended Tools Setup

### Linting & Formatting

```json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx}\"",
    "typecheck": "tsc --noEmit",
    "validate": "npm run typecheck && npm run lint"
  },
  "devDependencies": {
    "eslint": "^9.0.0",
    "eslint-config-next": "^16.0.0",
    "prettier": "^3.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0"
  }
}
```

### Pre-commit Hooks

```bash
# .husky/pre-commit
#!/bin/sh
npm run validate
npm run test
```

### IDE Configuration

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "eslint.validate": ["typescript", "typescriptreact"],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

---

## 8. Complexity Analysis

### Cyclomatic Complexity

| File | CC | Risk | Action |
|------|----|----|--------|
| widget-form.tsx | 12+ | HIGH | Refactor |
| team-management.tsx | 10+ | HIGH | Refactor |
| supabase-helpers.ts | 15+ | CRITICAL | Split |
| admin-ticket-list.tsx | 8 | MEDIUM | Simplify |

---

## 9. Quick Wins This Week

1. **Fix TypeScript Issues** (2 hours)
   - Search for `any` types
   - Replace with proper types

2. **Add Error Boundaries** (2 hours)
   - Catch React errors
   - Better error messages

3. **Extract Constants** (2 hours)
   - Magic numbers to constants
   - Magic strings to enums

4. **Add .env.example** (30 minutes)
   - Document required env vars
   - Help onboarding

5. **Add JSDoc Comments** (2 hours)
   - Document public functions
   - Improve IDE suggestions

---

## 10. Long-term Improvements

- **Week 1-2:** Split supabase-helpers, add types, fix auth
- **Week 3-4:** Refactor large components, add tests
- **Week 5-6:** Performance optimizations, accessibility fixes
- **Week 7-8:** Documentation, monitoring, deployment

---

**Report Generated:** July 25, 2026
**Next Review:** After Phase 1 completion
