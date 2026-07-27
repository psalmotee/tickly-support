# Phase 1.1 Architecture Alignment (Final Approved Architecture)

## Architecture Status

**Status:** ✅ APPROVED

Following the Phase 1 implementation review, several architectural refinements were applied to fully align Tickly with the approved engineering documentation.

The objective of these refinements is to ensure the project remains scalable, maintainable, and suitable for long-term SaaS growth without requiring future structural rewrites.

No application functionality was changed during this phase.

---

# Core Architectural Principles

Tickly follows a layered architecture with clear separation between:

- Business Domains
- Shared Libraries
- Infrastructure
- Services
- Repositories
- Application Routing

Each layer has a single responsibility and strict dependency boundaries.

```
Application (Next.js App Router)

↓

Feature Modules

↓

Service Layer

↓

Repository Layer

↓

Infrastructure Layer

↓

External Services / Database
```

Business logic always flows downward through these layers.

---

# Approved Project Structure

```
src/

├── app/                        # Next.js App Router only
│
├── features/                   # Business domains
│   ├── auth/
│   ├── tickets/
│   ├── customers/
│   ├── organizations/
│   ├── users/
│   ├── widget/
│   ├── analytics/
│   └── notifications/
│
├── shared/                     # Reusable application assets
│   ├── components/
│   ├── hooks/
│   ├── providers/
│   ├── layouts/
│   ├── icons/
│   ├── utils/
│   ├── validation/
│   ├── schemas/
│   ├── constants/
│   └── types/
│
├── services/                   # Business logic layer
│   ├── ticket.service.ts
│   ├── customer.service.ts
│   ├── organization.service.ts
│   ├── notification.service.ts
│   ├── analytics.service.ts
│   └── widget.service.ts
│
├── repositories/               # Data access layer
│   ├── ticket.repository.ts
│   ├── customer.repository.ts
│   ├── organization.repository.ts
│   ├── user.repository.ts
│   └── auth.repository.ts
│
├── infrastructure/             # External systems
│   ├── auth/
│   ├── database/
│   ├── email/
│   ├── storage/
│   ├── logging/
│   ├── cache/
│   ├── queue/
│   ├── monitoring/
│   └── search/
│
├── config/                     # Centralized configuration
│
├── types/                      # Global application types
│
└── middleware/                 # Request middleware
```

---

# Layer Responsibilities

## App Layer

The App Router is responsible only for:

- routing
- layouts
- page rendering
- API endpoints
- middleware integration

Business logic must never be implemented directly inside App Router pages or API routes.

---

## Feature Layer

Features represent business capabilities.

Approved business domains are:

- Authentication
- Tickets
- Customers
- Organizations
- Users
- Widget
- Notifications
- Analytics

A feature owns:

- UI
- hooks
- local utilities
- feature-specific types
- feature-specific components

A feature never communicates directly with the database.

---

## Shared Layer

The Shared layer contains reusable assets that can be used by multiple features.

Examples include:

- reusable UI components
- custom hooks
- utility functions
- constants
- validation helpers
- schemas
- shared types
- layouts
- providers
- icons

The Shared layer contains **no business logic**.

---

## Service Layer

The Service layer contains all business rules.

Examples include:

- ticket assignment
- SLA calculations
- customer onboarding
- organization creation
- notification workflows
- widget configuration

Services coordinate repositories and infrastructure.

Services never perform SQL queries directly.

---

## Repository Layer

Repositories are responsible for all data access.

Responsibilities include:

- Supabase queries
- database transactions
- persistence
- mapping database records

Repositories contain no business decisions.

Services consume repositories.

---

## Infrastructure Layer

Infrastructure contains integrations with external systems.

Examples:

- Supabase
- Resend
- Redis
- Object Storage
- Search providers
- Monitoring
- Logging
- Authentication providers

Infrastructure contains adapters only.

It never contains business logic.

---

# Dependency Rules

The project follows one-way dependencies.

```
App

↓

Features

↓

Services

↓

Repositories

↓

Infrastructure
```

Lower layers never import higher layers.

Examples:

Repository → Service ❌

Infrastructure → Feature ❌

Shared → Feature ❌

Service → Repository ✅

Feature → Service ✅

App → Feature ✅

---

# Architectural Decisions

The following architectural decisions are now mandatory throughout the project:

- Features represent business domains.
- Shared contains only reusable application assets.
- Services contain business logic.
- Repositories contain data access.
- Infrastructure contains external integrations.
- App Router remains thin.
- API routes delegate work to services.
- Components remain focused on presentation and interaction.
- Database access never occurs inside UI components.

---

# Architecture Improvements

The following refinements were applied during Phase 1.1:

## Feature Naming

Business domains now follow plural naming conventions.

Examples:

- tickets
- customers
- organizations
- notifications

instead of transport-oriented names.

---

## Shared Components

Shared UI components have been moved into the Shared layer.

This prevents duplication across features.

---

## Removal of Transport Features

Modules representing transport or application routing have been removed from the Feature layer.

Examples:

- website
- public-api

These remain responsibilities of the Next.js App Router.

---

## Infrastructure Simplification

Infrastructure has been limited to technical integrations only.

Business services have been removed from Infrastructure.

---

## Service Separation

Business services now belong to the dedicated Service layer.

Infrastructure no longer owns business behavior.

---

## Repository Separation

Database operations are isolated within repositories.

This prepares the project for future support of multiple database providers if required.

---

# Expected Benefits

This architecture provides:

- Clear ownership of business domains
- Easier onboarding of engineers
- Better testability
- Reduced coupling
- Improved scalability
- Easier future migrations
- Consistent engineering practices
- Cleaner dependency management

---

# Phase 1.1 Exit Criteria

The architecture is considered complete when:

- Folder structure matches approved documentation.
- Layer responsibilities are clearly defined.
- Dependency boundaries are documented.
- No business logic exists in infrastructure.
- No database access exists outside repositories.
- Shared contains only reusable assets.
- Existing functionality remains unchanged.
- TypeScript compilation succeeds.
- No regressions are introduced.

---

# Phase 2 Readiness

The architecture foundation is now complete.

Phase 2 will focus exclusively on migrating existing code into the approved architecture without changing application behavior.

The migration sequence will be:

1. Shared Layer Extraction
2. Infrastructure Extraction
3. Repository Migration
4. Service Layer Migration
5. Feature Module Migration
6. API Route Simplification
7. Component Refactoring
8. Final Cleanup & Validation

No new features will be introduced until the architectural migration is complete.