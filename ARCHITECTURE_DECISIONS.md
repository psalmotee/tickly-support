I would keep most of your ADRs, but I would replace ADR-002, ADR-004, enhance ADR-001, ADR-003, ADR-005, ADR-006, ADR-009, ADR-010, ADR-011, ADR-013, ADR-014, and add ADR-015 and ADR-016. These changes better align with your long-term vision of Tickly as an enterprise SaaS platform while remaining practical for your current stack.

ADR-001: Folder Structure & Feature Organization (Replace Recommended Solution)
Recommended Solution

Adopt a Feature-Based Modular Monolith with a dedicated Infrastructure layer.

src/
├── app/                         # Next.js App Router only
│
├── features/
│   ├── auth/
│   ├── organizations/
│   ├── workspaces/
│   ├── teams/
│   ├── customers/
│   ├── tickets/
│   ├── widget/
│   ├── portal/
│   ├── knowledge-base/
│   ├── analytics/
│   ├── billing/
│   └── settings/
│
├── shared/
│   ├── ui/
│   ├── hooks/
│   ├── types/
│   ├── utils/
│   ├── constants/
│   └── config/
│
├── infrastructure/
│   ├── database/
│   ├── auth/
│   ├── email/
│   ├── storage/
│   ├── realtime/
│   ├── monitoring/
│   └── cache/
│
└── tests/
Engineering Rules
Features must never directly depend on other feature internals.
Shared contains reusable code only.
Infrastructure owns external integrations.
Pages only compose features.
Business logic must never exist inside page components.
ADR-002: Authentication & Identity (Replace Entire ADR)
Decision

Adopt Supabase Auth as the single Identity Provider.

Do not build a custom JWT authentication system.

Problem

Current implementation manually decodes JWTs without verifying signatures, creating a critical security vulnerability.

The issue is incorrect token validation, not the use of Supabase.

Recommended Solution
Use Supabase Auth for authentication.
Validate Supabase-issued JWTs using the official server libraries.
Never manually decode or trust JWT payloads.
Use Supabase session management.
Implement middleware for authentication.
Support future SSO and OAuth providers through Supabase.
Benefits
Eliminates custom authentication maintenance.
Supports OAuth, Magic Links, MFA, and SSO.
Reduces security risk.
Future-proof for enterprise customers.
Implementation Priority

🔴 CRITICAL

ADR-003: Authorization & RBAC (Replace Roles)
Recommended Role Hierarchy
Platform Roles

• Super Admin
• Support Engineer

--------------------------------

Organization Roles

• Owner
• Admin
• Manager
• Agent
• Viewer
• Billing Admin

--------------------------------

Customer Roles

• Customer
• Guest
Decision

Authentication identifies who the user is.

Authorization determines what they can do.

Permissions must always be evaluated at the organization level.

ADR-004: State Management (Replace Entire ADR)
Decision

Adopt Server Components first architecture.

Principles
Server Components for data loading.
Server Actions for mutations where appropriate.
React Context only for global UI state.
Supabase Realtime for live synchronization.
Client-side caching libraries should only be introduced when clear requirements justify them.
State Layers
Server Components
        │
Server Actions
        │
Supabase
        │
Realtime Events
        │
React Context (UI only)
        │
Local Component State
Benefits
Smaller client bundle.
Better SEO.
Reduced hydration.
Simpler architecture.
Better alignment with Next.js App Router.
ADR-005: API Design (Add Request Pipeline)

Every API request must follow the same lifecycle.

Incoming Request

↓

Middleware

↓

Authentication

↓

Authorization

↓

Input Validation

↓

Business Service

↓

Repository

↓

Response Formatter

↓

Structured Logging

↓

HTTP Response

No API route may bypass this pipeline.

ADR-006: Database Organization (Expand)

Every business table must include:

id

organization_id

created_at

updated_at

created_by

updated_by

deleted_at

version
Requirements
Row Level Security enabled.
Foreign Keys required.
Appropriate indexes.
Soft deletes where appropriate.
Audit logging.
Optimistic concurrency using version numbers.
ADR-007: Component Architecture (Add Standards)
Engineering Rules

Presentation Components

Maximum 150 LOC

Container Components

Maximum 250 LOC

Pages

Maximum 300 LOC

If exceeded, split the component.

Each component should have one responsibility.

ADR-009: Caching Strategy (Replace)

Caching hierarchy:

Next.js Cache

↓

revalidateTag()

↓

Browser Cache

↓

CDN Cache

↓

Supabase Realtime

↓

Optional Client Cache

Do not introduce SWR or React Query until there is a demonstrated need.

ADR-010: Error Handling (Expand)

Every API error must return:

{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "traceId": "req_xxxxx"
  }
}

Requirements:

Structured error codes.
Trace IDs.
User-friendly messages.
Internal stack traces logged only on the server.
ADR-011: Logging & Observability (Replace)
Decision

Adopt Pino as the application logger.

Integrate with:

Sentry
OpenTelemetry

Every log must include:

Request ID
User ID
Organization ID
Route
Timestamp

No console.log() in production.

ADR-013: Testing Architecture (Expand)

Testing targets:

Initial Phase

20% coverage

Beta

50% coverage

General Availability

70% coverage

Testing pyramid:

Unit Tests
Integration Tests
End-to-End Tests

Every bug fix must include a regression test.

ADR-014: Deployment Strategy (Replace)

Deployment progression:

GitHub

↓

GitHub Actions

↓

Preview Deployment

↓

Vercel Production

↓

Feature Flags

↓

Rollback

Blue-Green deployment should only be adopted once production traffic justifies the additional operational complexity.

NEW ADR-015: Multi-Tenant Architecture
Decision

Tickly will use a shared database with logical tenant isolation enforced through Row-Level Security (RLS).

Tenant Hierarchy
Platform

↓

Organization

↓

Workspace

↓

Department

↓

Team

↓

Agent

↓

Customer

↓

Ticket
Rules
Every business record belongs to exactly one organization.
All queries must be organization-scoped.
Cross-tenant access is prohibited by default.
Tenant context must be resolved before executing business logic.
RLS is mandatory for tenant-owned tables.
Benefits
Lower infrastructure cost.
Simpler operations.
Strong tenant isolation.
Easier onboarding of new organizations.

Implementation Priority: 🔴 CRITICAL

NEW ADR-016: Widget & Public SDK Architecture
Decision

The embeddable widget will be treated as an independent product with its own API and SDK.

Architecture
Customer Website

↓

Tickly Widget SDK

↓

Public Widget API

↓

Authentication

↓

Ticket Service

↓

Knowledge Base

↓

Supabase
Responsibilities

The Widget SDK will:

Render the embedded support interface.
Authenticate customers securely.
Create and update tickets.
Search the knowledge base.
Receive real-time updates.
Support theming and branding.

The Public Widget API will:

Validate requests.
Enforce rate limits.
Authenticate widget sessions.
Isolate organizations.
Return standardized API responses.
Benefits
Independent versioning.
Easier third-party integration.
Backward compatibility.
Enterprise-ready public API.

Implementation Priority: 🟡 HIGH