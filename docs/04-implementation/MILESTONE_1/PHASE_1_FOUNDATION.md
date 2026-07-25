# Sprint 1B — Phase 1: Foundation & Project Architecture

**Milestone:** 1  
**Sprint:** 1B  
**Phase:** 1 of 8  
**Estimated Duration:** 1–2 Days  
**Priority:** Critical

---

# Objective

Create the new enterprise project architecture that all future development will use.

This phase does **not** modify business logic.

This phase does **not** introduce new features.

This phase only prepares the codebase for the large refactoring work that follows.

The application must behave exactly the same before and after this phase.

---

# Success Criteria

At the completion of this phase:

- Application builds successfully
- No feature regression
- No API changes
- No business logic changes
- New architecture exists
- Existing code continues working

---

# Why This Phase Exists

Current architecture has grown organically.

Problems include:

- oversized utility files
- mixed responsibilities
- unclear ownership
- difficult navigation
- poor scalability

Instead of immediately moving code, we first create the architecture that code will move into.

This minimizes risk.

---

# Scope

Included

- Create folder structure
- Configure import aliases
- Create shared entry points
- Create infrastructure layer
- Create feature boundaries
- Create repository layer
- Create service layer
- Create configuration folders
- Create documentation placeholders

Not Included

- Moving business logic
- Splitting components
- Database changes
- Authentication changes
- Security changes
- Performance optimization

Those belong to later phases.

---

# Target Directory Structure

```
src/

app/

features/

shared/

infrastructure/

repositories/

services/

config/

types/
```

---

# Feature Modules

Create:

```
features/

auth/

tickets/

customers/

organizations/

users/

widget/

notifications/

analytics/

knowledge-base/
```

Each feature should contain:

```
components/

hooks/

services/

repositories/

types/

utils/

constants/

schemas/

index.ts
```

Even if initially empty.

---

# Shared Layer

Create:

```
shared/

components/

hooks/

utils/

validators/

constants/

types/

icons/

layouts/

providers/

styles/

api/
```

Purpose:

Anything reused by two or more features belongs here.

Examples:

- Button
- Modal
- Avatar
- Table
- Toast
- formatDate()
- classNames()
- validators

---

# Infrastructure Layer

Create:

```
infrastructure/

database/

auth/

email/

logging/

storage/

cache/

queue/

search/

monitoring/
```

Infrastructure contains external systems only.

Business logic never belongs here.

Examples:

Supabase

Redis

Resend

Cloud Storage

Sentry

OpenTelemetry

---

# Repository Layer

Create

```
repositories/
```

Initial files:

```
ticket.repository.ts

customer.repository.ts

organization.repository.ts

user.repository.ts

auth.repository.ts
```

Initially these may export placeholders.

Repositories become the only layer allowed to communicate with the database.

---

# Service Layer

Create

```
services/
```

Initial services:

```
ticket.service.ts

customer.service.ts

organization.service.ts

widget.service.ts

notification.service.ts

analytics.service.ts
```

Business rules will eventually move here.

---

# Configuration Layer

Create

```
config/

app.ts

auth.ts

database.ts

email.ts

storage.ts

features.ts

constants.ts
```

No environment variables should be accessed directly outside config after later phases.

---

# Global Types

Create

```
types/

api.ts

database.ts

common.ts

auth.ts

ticket.ts

customer.ts
```

These become the platform-wide contracts.

---

# Barrel Files

Each folder should expose a clean public API.

Example

```
features/tickets/index.ts
```

```ts
export * from "./components";
export * from "./hooks";
export * from "./services";
export * from "./repositories";
export * from "./types";
```

Avoid deep imports wherever possible.

---

# Import Convention

Preferred

```ts
import { TicketService } from "@/services";

import { Button } from "@/shared/components";

import { TicketCard } from "@/features/tickets";
```

Avoid

```ts
../../../components/Button

../../../../lib/utils
```

---

# Coding Rules

During Phase 1:

No business logic moves.

No function names change.

No API contracts change.

No database queries change.

Only create architecture.

---

# Verification Checklist

After completion verify:

- npm install succeeds
- npm run lint succeeds
- npm run build succeeds
- Application starts
- Login page loads
- Dashboard loads
- Widget loads
- API routes still work
- TypeScript has zero new errors

---

# Deliverables

- New folder structure
- Repository layer
- Service layer
- Shared layer
- Infrastructure layer
- Configuration layer
- Global types
- Barrel exports

---

# Risks

### Risk

Broken imports

Mitigation

No existing imports changed during this phase.

---

### Risk

Developers begin using new folders inconsistently.

Mitigation

Document architecture before migration.

---

### Risk

Future merge conflicts.

Mitigation

Complete this phase before Phase 2 begins.

---

# Definition of Done

Phase 1 is complete when:

✓ Folder structure exists

✓ Code compiles

✓ Existing functionality unchanged

✓ Architecture documented

✓ No business logic relocated

✓ No regressions introduced

---

# Exit Criteria

The project is now structurally prepared for Phase 2.

Phase 2 will begin moving reusable code into the Shared layer while preserving application behavior.
