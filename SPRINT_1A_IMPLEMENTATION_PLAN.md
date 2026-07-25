SPRINT 1A – Engineering Foundation & Architecture Implementation

Project: Tickly v2

Milestone: Milestone 1 – Engineering Foundation & Refactoring

Sprint: Sprint 1A

Duration: 2 Weeks

Priority: Critical

Status: Ready for Implementation

Sprint Goal

Establish the engineering foundation of Tickly by implementing the approved architecture, development standards, shared infrastructure, and quality gates without changing business functionality.

This sprint is intentionally non-feature work.

No customer-facing functionality should change.

The outcome of Sprint 1A is a clean, standardized, maintainable engineering foundation that every future sprint will build upon.

Sprint Objectives

At the end of Sprint 1A the project should have:

Enterprise project structure
Standardized shared libraries
Infrastructure layer
Typed configuration
Centralized logging
Unified API response system
Unified error handling
Validation framework
CI quality gates
Dependency audit
Architecture validation
Auth feature migrated as proof of concept
Updated documentation

No other feature should be migrated.

Engineering Principles

The sprint must follow these principles.

Preserve Existing Behaviour

No business logic changes.

No UI redesign.

No workflow changes.

No database schema changes.

Only architecture improvements.

Small Safe Changes

Large refactors are prohibited.

Every commit should be reversible.

Every change should compile.

Every change should be tested.

Architecture First

Implementation follows the approved ADRs.

No shortcuts.

No temporary solutions.

No duplicate utilities.

Sprint Deliverables
Phase 0 — Engineering Baseline
Objective

Understand the current state before changing anything.

Tasks

Generate reports for:

TypeScript errors
ESLint issues
Build status
Bundle size
Dependency graph
Circular dependencies
Dead code
Duplicate packages
Deprecated packages
Security audit
Import graph
Deliverables
reports/

build-report.md

lint-report.md

dependency-audit.md

architecture-baseline.md

bundle-analysis.md
Acceptance Criteria

Baseline documented.

Nothing modified.

Phase 1 — Project Foundation
Objective

Create the approved enterprise folder structure.

Required Structure
src/

app/

features/

shared/

infrastructure/

tests/
Inside features
auth/

tickets/

customers/

organizations/

widget/

portal/

knowledge-base/

analytics/

billing/

settings/

teams/

workspaces/

Folders only.

No migration yet.

Shared

Create

shared/

api/

config/

constants/

hooks/

types/

ui/

utils/

schemas/
Infrastructure

Create

database/

auth/

cache/

email/

storage/

realtime/

monitoring/

logging/
Deliverables

Enterprise folder structure complete.

Phase 2 — Shared Infrastructure
Objective

Build reusable project infrastructure.

Implement
Configuration

Typed configuration

Environment validation

Startup validation

Central config object

Logger

Implement Pino.

Support

TRACE

DEBUG

INFO

WARN

ERROR

FATAL

Every log includes

Request ID

User ID

Organization ID

Timestamp

API Response Helper

Standard response builder.

Example

{
  "success": true,
  "data": {},
  "error": null,
  "traceId": "...",
  "timestamp": "..."
}
Error System

Create

ApplicationError

ValidationError

AuthenticationError

AuthorizationError

DatabaseError

NotFoundError

ConflictError

InternalServerError

Validation

Create shared Zod schemas.

Validation helpers.

Error formatter.

Utility Layer

Move only generic utilities.

No feature-specific code.

Deliverables

Shared infrastructure complete.

Phase 3 — Architecture Rules

Implement project-wide standards.

Barrel Exports

Every folder exports through

index.ts

Path Aliases
@/features

@/shared

@/infrastructure

@/app
Import Rules

Allowed

Feature

↓

Shared

↓

Infrastructure

Forbidden

Feature A

↓

Feature B internals

Only public APIs may be imported.

Circular Dependency Detection

Configure automated checking.

Zero circular imports allowed.

Deliverables

Architecture enforcement enabled.

Phase 4 — CI Foundation

Configure GitHub Actions.

Pipeline includes

TypeScript

ESLint

Build verification

Dependency checks

Security audit

Future test placeholder

Every Pull Request must pass.

Phase 5 — Pilot Migration

Only migrate

Auth Feature

Move

Authentication components

Authentication hooks

Authentication utilities

Authentication types

Authentication API

Authentication validation

No other feature moves.

Purpose

Validate architecture before migrating the remaining modules.

Phase 6 — Dependency Audit

Review

Unused packages

Duplicate packages

Deprecated packages

Heavy dependencies

Remove nothing yet.

Generate

dependency-review.md

Mark candidates.

Removal happens later.

Phase 7 — Documentation

Update

ENGINEERING.md

Architecture diagrams

Folder conventions

Import conventions

Configuration guide

Logger guide

Response standard

Validation guide

Developer onboarding

Migration guide

Validation Checklist

The sprint is complete only if:

Build
TypeScript passes
Build succeeds
ESLint passes
Architecture
Folder structure matches ADR
Shared layer contains no business logic
Infrastructure isolated
Zero circular dependencies
Public APIs only
Infrastructure
Logger operational
Config validated
Response helper operational
Error helper operational
Validation operational
Auth Pilot
Login works
Logout works
Session works
Protected routes work
Middleware works

No regressions.

Documentation

All engineering documentation updated.

Out of Scope

Sprint 1A must not:

Split supabase-helpers.ts
Refactor giant React components
Implement RBAC
Enable RLS
Add security headers
Add rate limiting
Introduce pagination
Optimize queries
Build the customer portal
Build the widget SDK
Build AI features
Build billing
Change database schema
Delete existing files

These belong to later sprints.

Success Metrics
Metric	Target
Build errors	0
ESLint errors	0
Circular dependencies	0
Typed configuration	100%
Shared API responses	Implemented
Shared error handling	Implemented
Structured logging	Implemented
Auth feature migrated	Complete
Documentation updated	100%
Existing functionality	No regressions
Definition of Done

Sprint 1A is complete when:

The project follows the approved architectural structure.
Shared infrastructure is in place and reusable.
CI validates every change.
The Auth feature successfully demonstrates the new architecture.
No business functionality has changed.
All quality gates pass.
Documentation reflects the new engineering standards.
Deliverables

By the end of Sprint 1A, Tickly should include:

Enterprise-grade folder structure.
Shared infrastructure (config, logger, responses, errors, validation).
Infrastructure layer (database, auth, email, storage, monitoring, cache, realtime).
CI pipeline for build and lint validation.
Architecture enforcement (path aliases, barrel exports, circular dependency checks).
Typed environment configuration with startup validation.
Auth feature migrated as the reference implementation.
Complete engineering documentation and migration guide.