# Tickly System Overview

**Version:** 1.0

**Status:** Approved

**Owner:** Engineering

**Last Updated:** July 2026

---

# 1. Purpose

This document provides a high-level technical overview of the Tickly platform.

It explains the overall system architecture, the major functional domains, how data flows through the platform, and how different services interact.

This document is intended for:

- Engineers
- Architects
- Product Managers
- Technical Leads
- New Contributors

It should be read before reviewing detailed architecture documentation.

---

# 2. What is Tickly?

Tickly is a cloud-native, multi-tenant Software-as-a-Service (SaaS) customer support platform.

It enables organizations to:

- Manage customer support tickets
- Communicate with customers
- Build knowledge bases
- Automate support workflows
- Analyze support performance
- Integrate with third-party systems
- Use AI to improve agent productivity

Tickly is designed as a modular platform where each capability is independently developed while sharing common infrastructure.

---

# 3. Product Ecosystem

The Tickly platform consists of several major products working together.

```

                    Tickly Platform

                ┌───────────────────────┐
                │      Web Portal       │
                └──────────┬────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼

 Organization Portal   Customer Portal    Admin Portal

        │                  │                  │

        └──────────────────┼──────────────────┘
                           │
                    Tickly Backend
                           │
      ┌────────────────────────────────────┐
      │ Business Services                  │
      └────────────────────────────────────┘
                           │
      ┌────────────────────────────────────┐
      │ Database + Storage + Authentication│
      └────────────────────────────────────┘
                           │
      ┌────────────────────────────────────┐
      │ External Services                  │
      └────────────────────────────────────┘

```

---

# 4. Primary Users

Tickly supports multiple user types.

## Platform Administrator

Manages the Tickly platform itself.

Responsibilities:

- Platform configuration
- System monitoring
- Global settings

---

## Organization Owner

Owns an organization.

Responsibilities:

- Subscription
- Workspace
- Billing
- Organization settings

---

## Organization Administrator

Manages day-to-day organization settings.

Responsibilities:

- Teams
- Users
- Roles
- Branding

---

## Support Agent

Handles customer conversations.

Responsibilities:

- Ticket management
- Customer communication
- Knowledge usage

---

## Customer

Creates and tracks support requests.

Responsibilities:

- Submit tickets
- View ticket status
- Browse knowledge base

---

# 5. Core Functional Domains

Tickly is organized into independent business domains.

---

## Authentication

Responsible for:

- Login
- Registration
- Sessions
- Password Reset
- MFA (future)

---

## Organizations

Responsible for:

- Organization lifecycle
- Branding
- Settings
- Subscription ownership

---

## Users & Teams

Responsible for:

- User management
- Roles
- Permissions
- Team membership

---

## Customers

Responsible for:

- Customer profiles
- Contact information
- Customer history

---

## Tickets

Responsible for:

- Ticket lifecycle
- Status management
- Assignment
- Priorities
- Categories

---

## Widget

Responsible for:

- Website widget
- Customer conversations
- Ticket creation
- Branding

---

## Knowledge Base

Responsible for:

- Articles
- Categories
- Search
- Publishing

---

## Automation

Responsible for:

- Workflow engine
- Rules
- Triggers
- Notifications

---

## Analytics

Responsible for:

- Reports
- Dashboards
- KPIs

---

## AI

Responsible for:

- Suggested replies
- Ticket summaries
- Classification
- Search

---

## Billing

Responsible for:

- Subscription plans
- Invoices
- Payments
- Usage limits

---

# 6. High-Level Architecture

Tickly follows a layered architecture.

```

Presentation Layer

↓

Application Layer

↓

Business Logic Layer

↓

Infrastructure Layer

↓

Database

↓

External Services

```

Each layer has a single responsibility.

---

# 7. Presentation Layer

Responsible for:

- Next.js application
- Dashboards
- Customer portal
- Admin portal
- Embedded widget

Technology:

- Next.js
- React
- TypeScript
- Tailwind CSS

---

# 8. Application Layer

Responsible for:

- API Routes
- Request validation
- Authorization
- Response formatting

This layer coordinates requests but contains minimal business logic.

---

# 9. Business Layer

Responsible for:

- Ticket workflows
- Organization rules
- Customer logic
- Automation
- AI orchestration

Business rules should only exist here.

---

# 10. Infrastructure Layer

Responsible for:

- Database access
- Authentication
- Email delivery
- Logging
- File storage
- Third-party integrations

Infrastructure never contains business rules.

---

# 11. Data Layer

Primary Database

Supabase PostgreSQL

Responsibilities:

- Relational data
- Transactions
- Row-Level Security

Storage

Supabase Storage

Responsibilities:

- Attachments
- Images
- Documents

---

# 12. External Services

Tickly integrates with external platforms.

| Service | Purpose |
|----------|----------|
| Supabase | Database, Authentication, Storage |
| Resend | Transactional Email |
| OpenAI | AI Features |
| Stripe | Billing |
| Vercel | Hosting |
| GitHub | Source Control |

Additional integrations may be introduced in future phases.

---

# 13. Typical Request Flow

Example:

Customer submits a ticket.

```

Customer

↓

Website Widget

↓

Next.js Route

↓

Validation

↓

Authentication

↓

Ticket Service

↓

Repository

↓

Supabase

↓

Database

↓

Response

↓

Customer

```

Every request follows the same high-level lifecycle.

---

# 14. Multi-Tenant Model

Tickly is designed as a multi-tenant platform.

Each organization has:

- Independent users
- Independent tickets
- Independent customers
- Independent branding
- Independent settings

Data belonging to one organization must never be accessible by another organization.

Tenant isolation is enforced at both the application and database layers.

---

# 15. Security Model

Security principles include:

- Authentication required
- Authorization for every action
- Least privilege
- Secure session management
- Input validation
- Output encoding
- Rate limiting
- Audit logging
- Encryption in transit
- Encryption at rest

Security architecture is documented separately.

---

# 16. Scalability Strategy

Tickly is designed to scale horizontally.

Key principles:

- Stateless application servers
- Cached reads
- Efficient database indexing
- Background job processing
- CDN for static assets
- API-first architecture

---

# 17. Availability Goals

Target availability:

99.9% uptime

Future enterprise target:

99.95%

Critical services should support graceful degradation where possible.

---

# 18. Deployment Overview

Development

↓

Testing

↓

Preview Deployment

↓

Staging

↓

Production

Production deployments should follow controlled release procedures.

---

# 19. Future Platform Expansion

The architecture is designed to support future additions including:

- Mobile applications
- Desktop applications
- Public REST API
- GraphQL API
- Marketplace
- Plugin system
- Third-party integrations
- AI agents
- Workflow designer

These capabilities should not require significant architectural redesign.

---

# 20. Design Principles

Every component of Tickly should follow these principles.

- Modular
- Secure
- Observable
- Maintainable
- Testable
- Scalable
- Performant
- Accessible
- API-first
- Cloud-native

---

# 21. System Boundaries

Tickly provides customer support capabilities.

Tickly is not intended to replace:

- CRM platforms
- ERP systems
- Accounting software
- Marketing automation
- Project management tools

Instead, Tickly integrates with these platforms through APIs.

---

# 22. Engineering Goals

The engineering organization aims to build a platform that is:

- Easy to understand
- Easy to extend
- Easy to test
- Easy to monitor
- Easy to deploy
- Secure by default
- Reliable under load

Every technical decision should contribute toward these goals.

---

# 23. Summary

Tickly is being built as a modern, enterprise-ready customer support platform with a modular architecture, strong engineering practices, and an API-first foundation.

This document provides the conceptual overview of the platform.

Detailed implementation guidance is provided in the architecture, engineering, security, and implementation documents.