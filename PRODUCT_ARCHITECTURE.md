# Product Architecture - Business Domain Analysis

## Executive Summary

Tickly is a multi-tenant support ticket management system with the following domains:

| Domain | Status | Tables | Status |
|--------|--------|--------|--------|
| Authentication | Partial | 1 | 🟡 Needs hardening |
| Organizations | Active | 4 | ✅ Functional |
| Users & Roles | Partial | 1 | 🔴 Limited RBAC |
| Tickets | Active | 2 | ✅ Functional |
| Customers | Active | 1 | ✅ Functional |
| Knowledge Base | Planned | 0 | 🟢 Future |
| Analytics | Not started | 0 | 🟢 Future |
| Notifications | Partial | 0 | 🟡 Email only |
| Webhooks | Planned | 0 | 🟢 Future |
| API | Partial | 0 | 🟡 Public v1 incomplete |
| Billing | Not started | 0 | 🟢 Future |
| Settings | Partial | 0 | 🟡 Limited options |

---

## Domain 1: Authentication

### Purpose
Secure user identity verification and session management.

### Responsibilities
- User registration
- User login/logout
- Password reset
- Session management
- JWT token generation and validation

### Dependencies
- `user` table
- JWT secret in environment
- Resend (for password reset emails)

### Database Ownership
- `user` table (email, password_hash, role, created_at)

### API Ownership
- `POST /api/signup` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `POST /api/password-reset` - Password reset
- `GET /api/check-auth` - Session validation

### Events Produced
- `user.created`
- `user.signed_in`
- `user.password_changed`

### Events Consumed
- None

### Current Implementation Status
🟡 **PARTIAL** - Custom JWT without signature verification

### Missing Functionality
- Email verification on signup
- Multi-factor authentication (2FA)
- Token refresh mechanism
- Password strength requirements
- Account lockout after failed attempts
- Single sign-on (SSO)
- OAuth providers

### Future Scalability Considerations
- Support multi-tenancy: users can belong to multiple organizations
- Support team members with different roles per organization
- Social login (Google, GitHub, Microsoft)
- SAML/SSO for enterprise
- API token authentication

### Issues
- 🔴 **CRITICAL**: JWT has no signature verification
- 🔴 **CRITICAL**: Password hashing uses PBKDF2 (should use bcrypt)
- 🟡 **HIGH**: No token refresh flow
- 🟡 **HIGH**: Sessions don't expire
- 🟡 **MEDIUM**: No email verification

---

## Domain 2: Organizations

### Purpose
Multi-tenancy foundation - each organization is an isolated workspace.

### Responsibilities
- Organization creation and management
- Organization settings (name, logo, branding)
- Organization member management
- Organization billing and subscription
- Custom fields configuration
- Website configuration (for widget)
- Email preferences

### Dependencies
- `user` table (for members)
- `organization` table
- `organization_member` table
- `website` table
- `custom_field` table

### Database Ownership
- `organization` table
- `organization_member` table
- `website` table
- `custom_field` table
- `email_preferences` table (org-level)

### API Ownership
- `GET /api/admin/organizations` - List organizations
- `POST /api/admin/organizations` - Create organization
- `GET /api/admin/organizations/[id]` - Get organization
- `PUT /api/admin/organizations/[id]/general` - Update settings
- `GET /api/admin/organizations/current` - Get current organization

### Events Produced
- `organization.created`
- `organization.updated`
- `member.invited`
- `member.added`
- `member.removed`

### Events Consumed
- `user.created` → auto-create organization

### Current Implementation Status
✅ **FUNCTIONAL** - Basic CRUD operations work

### Missing Functionality
- Organization settings audit log
- Custom branding per organization
- Organization analytics dashboard
- Organization API tokens
- Workspace switching
- Organization-level feature flags

### Future Scalability Considerations
- Multi-workspace support for users
- Organization hierarchy (parent/child)
- Organization-level webhooks
- Organization usage quotas
- Organization-level SSO configuration

### Issues
- 🟡 **HIGH**: No organization-level analytics
- 🟡 **MEDIUM**: Limited customization options
- 🟡 **MEDIUM**: No audit logging

---

## Domain 3: Users & Roles

### Purpose
User identity and permission management.

### Responsibilities
- User profile management
- Role assignment (admin, user, customer)
- Permission checking
- Organization membership
- Team assignment

### Dependencies
- `user` table
- `organization_member` table

### Database Ownership
- `user` table
- `organization_member` table (join with roles)

### API Ownership
- `GET /api/admin/admin-users-route` - List users
- `POST /api/admin/admin-users-route/update-role` - Update user role
- `GET /api/admin/organizations/[id]/members` - List org members
- `POST /api/admin/organizations/[id]/members` - Add member

### Events Produced
- `user.created`
- `user.role_changed`
- `member.role_changed`

### Events Consumed
- `organization.created` → create initial member

### Current Implementation Status
🟡 **PARTIAL** - Basic role system, limited RBAC

### Missing Functionality
- Granular permission matrix
- Role-based permissions separate from role name
- Permission inheritance
- Conditional permissions (based on resources)
- Audit logging of role changes
- Delegation of admin tasks

### Future Scalability Considerations
- Team-based permissions
- Attribute-based access control (ABAC)
- Organization-level role customization
- Permission inheritance from org groups
- Temporary elevated permissions

### Issues
- 🔴 **CRITICAL**: Only two roles (admin/user), no RBAC matrix
- 🟡 **HIGH**: No permission-level granularity
- 🟡 **MEDIUM**: No audit trail for permission changes

---

## Domain 4: Tickets

### Purpose
Core feature - support ticket creation, management, and lifecycle.

### Responsibilities
- Ticket creation (from widget, customer portal, email)
- Ticket updates (status, priority, assignments)
- Ticket routing and assignment
- Ticket history and comments
- Ticket search and filtering

### Dependencies
- `ticket` table
- `ticket_message` table
- `user` table
- `customer` table
- `organization` table

### Database Ownership
- `ticket` table
- `ticket_message` table

### API Ownership
- `GET /api/admin/admin-tickets-route` - List tickets
- `GET /api/admin/admin-tickets-route/[id]` - Get ticket
- `POST /api/admin/admin-tickets-route` - Create ticket
- `PUT /api/admin/admin-tickets-route/[id]` - Update ticket
- `DELETE /api/admin/admin-tickets-route/[id]` - Delete ticket
- `GET /api/customers/tickets` - Customer list
- `GET /api/v1/public/tickets` - Public API

### Events Produced
- `ticket.created`
- `ticket.updated`
- `ticket.status_changed`
- `ticket.assigned_to`
- `ticket.commented`
- `ticket.closed`

### Events Consumed
- `customer.created` → can create tickets
- `widget.installed` → tickets can be created via widget

### Current Implementation Status
✅ **FUNCTIONAL** - Core operations work

### Missing Functionality
- Ticket templates
- Ticket automation (auto-assign, auto-response)
- SLA management
- Ticket merging
- Ticket tags
- Ticket custom fields per organization
- Ticket search (full-text)
- Ticket filters and saved views

### Future Scalability Considerations
- Ticket escalation workflow
- Ticket assignment rules (round-robin, skill-based)
- Multi-channel support (email, chat, social)
- Ticket threading
- Ticket branching (sub-tickets)

### Issues
- 🟡 **HIGH**: N+1 queries on list endpoint
- 🟡 **HIGH**: No pagination implemented
- 🟡 **MEDIUM**: No ticket search capability
- 🟡 **MEDIUM**: Limited filtering options
- 🟡 **MEDIUM**: No tags feature

---

## Domain 5: Customers

### Purpose
External user management - people submitting tickets.

### Responsibilities
- Customer profile management
- Customer authentication (public tokens)
- Customer ticket access
- Customer invitation

### Dependencies
- `customer` table
- `organization` table
- `ticket` table

### Database Ownership
- `customer` table

### API Ownership
- `POST /api/customers/signup` - Customer signup
- `GET /api/customers/tickets/[id]` - Get customer ticket
- `GET /api/customers/tickets` - List customer tickets
- `POST /api/customers/submit-ticket` - Submit ticket
- `GET /api/v1/public/customers/[id]` - Public API

### Events Produced
- `customer.created`
- `customer.invited`
- `customer.submitted_ticket`

### Events Consumed
- None

### Current Implementation Status
✅ **FUNCTIONAL** - Basic operations work

### Missing Functionality
- Customer portal
- Customer profiles
- Customer satisfaction (CSAT) surveys
- Customer communication preferences
- Customer tags/segments
- Customer analytics

### Future Scalability Considerations
- Customer self-service portal
- Customer knowledge base access
- Proactive customer outreach
- Customer journey tracking

### Issues
- 🟡 **MEDIUM**: Limited customer profile data
- 🟡 **MEDIUM**: No customer analytics
- 🟢 **LOW**: Portal UI basic

---

## Domain 6: Knowledge Base

### Purpose
Self-service support - reduce ticket volume with searchable articles.

### Responsibilities
- Article creation and management
- Article organization (categories, tags)
- Article search and recommendations
- Article analytics (views, helpful votes)

### Dependencies
- `article` table
- `article_category` table
- `organization` table

### Database Ownership
- `article` table
- `article_category` table
- `article_analytics` table

### API Ownership
- `GET /api/knowledge-base/articles` - Search articles
- `GET /api/knowledge-base/articles/[id]` - Get article
- `POST /api/admin/knowledge-base/articles` - Create article

### Events Produced
- `article.created`
- `article.viewed`

### Events Consumed
- None

### Current Implementation Status
🟢 **NOT STARTED** - Planned for v2.0

### Missing Functionality
- Entire domain not implemented

---

## Domain 7: Notifications

### Purpose
Keep users informed of ticket updates and important events.

### Responsibilities
- Email notifications for ticket events
- In-app notifications (future)
- Notification preferences
- Notification templates

### Dependencies
- Resend (email service)
- `ticket` table
- `notification_preference` table

### Database Ownership
- `notification_preference` table
- `notification_log` table (audit)

### API Ownership
- `POST /api/v1/notifications/ticket-assignment` - Notify on assignment
- `POST /api/v1/notifications/ticket-update` - Notify on update

### Events Produced
- `notification.sent`

### Events Consumed
- `ticket.created`
- `ticket.updated`
- `ticket.assigned_to`
- `member.invited`

### Current Implementation Status
🟡 **PARTIAL** - Email only, hardcoded templates

### Missing Functionality
- In-app notification system
- Notification preferences per user
- Notification queuing
- Notification templates management
- SMS notifications
- Push notifications
- Slack notifications
- Webhook notifications

### Future Scalability Considerations
- Multi-channel notifications
- Notification personalization
- Notification scheduling
- Notification batching

### Issues
- 🟡 **HIGH**: Hardcoded email templates in code
- 🟡 **MEDIUM**: No notification preferences stored
- 🟡 **MEDIUM**: Email failures not logged

---

## Domain 8: Webhooks

### Purpose
Enable third-party integrations and automations.

### Responsibilities
- Webhook registration and management
- Webhook delivery and retry logic
- Webhook signing and verification
- Webhook logs and debugging

### Dependencies
- `webhook` table
- `webhook_log` table
- Event system

### Database Ownership
- `webhook` table
- `webhook_log` table

### API Ownership
- `POST /api/admin/organizations/[id]/webhooks` - Register webhook
- `DELETE /api/admin/organizations/[id]/webhooks/[id]` - Delete webhook

### Events Produced
- `webhook.registered`
- `webhook.failed`

### Events Consumed
- All domain events

### Current Implementation Status
🟢 **PLANNED** - Not implemented

### Issues
- 🟢 **NOT STARTED**: Need to design webhook system

---

## Domain 9: Analytics

### Purpose
Business intelligence and operational metrics.

### Responsibilities
- Ticket metrics (volume, resolution time, CSAT)
- Team performance metrics
- Customer satisfaction tracking
- Revenue and usage analytics

### Dependencies
- `analytics_event` table
- All domain tables

### Database Ownership
- `analytics_event` table
- `dashboard_metric` table

### API Ownership
- `GET /api/admin/stats` - Get statistics

### Events Produced
- `metric.calculated`

### Events Consumed
- All domain events

### Current Implementation Status
🟡 **PARTIAL** - Basic stats, no dashboard

### Missing Functionality
- Advanced analytics dashboard
- Custom reports
- Data export
- Predictive analytics
- Trend analysis

### Future Scalability Considerations
- Real-time analytics
- Custom KPIs
- Analytics API
- Data warehouse integration

### Issues
- 🟡 **MEDIUM**: Limited metrics available
- 🟡 **MEDIUM**: No historical data retention

---

## Domain 10: Public API

### Purpose
Enable third-party developers to build integrations.

### Responsibilities
- Public API endpoints
- API authentication (API keys)
- Rate limiting
- API versioning

### Dependencies
- All other domains
- `api_key` table

### Database Ownership
- `api_key` table
- `api_log` table

### API Ownership
- `/api/v1/public/*` - All public endpoints

### Events Produced
- `api_request.made`

### Events Consumed
- None (reads from all domains)

### Current Implementation Status
🟡 **PARTIAL** - V1 API incomplete

### Missing Functionality
- Complete endpoint coverage
- API documentation (OpenAPI/Swagger)
- API client libraries
- API versioning strategy
- Deprecation policy

### Future Scalability Considerations
- GraphQL API
- Webhook-based events
- Subscription-based pricing
- API gateway

### Issues
- 🟡 **MEDIUM**: Incomplete endpoint coverage
- 🟡 **MEDIUM**: No API documentation
- 🟡 **MEDIUM**: No rate limiting

---

## Domain 11: Billing

### Purpose
Manage subscriptions and payments.

### Responsibilities
- Subscription management
- Payment processing
- Invoicing
- Usage tracking and metering
- Plan management

### Dependencies
- Stripe
- `subscription` table
- `plan` table
- `usage_metric` table

### Database Ownership
- `subscription` table
- `plan` table
- `usage_metric` table
- `invoice` table

### API Ownership
- `POST /api/admin/organizations/[id]/subscribe` - Subscribe to plan
- `POST /api/admin/organizations/[id]/cancel-subscription` - Cancel

### Events Produced
- `subscription.created`
- `subscription.upgraded`
- `subscription.downgraded`
- `subscription.cancelled`
- `payment.succeeded`
- `payment.failed`

### Events Consumed
- `ticket.created` → track usage
- `customer.created` → track usage

### Current Implementation Status
🟢 **NOT STARTED** - Not implemented

### Missing Functionality
- Entire domain not implemented

---

## Domain 12: Settings

### Purpose
Configurable options for organizations and users.

### Responsibilities
- Organization-level settings
- User-level preferences
- Feature flags
- Email templates
- Custom branding

### Dependencies
- `setting` table
- `user_preference` table
- `feature_flag` table

### Database Ownership
- `setting` table
- `user_preference` table
- `feature_flag` table

### API Ownership
- `PUT /api/admin/organizations/[id]/general` - Update org settings
- `GET /api/user/preferences` - Get user preferences

### Events Produced
- `setting.updated`

### Events Consumed
- None

### Current Implementation Status
🟡 **PARTIAL** - Limited settings available

### Missing Functionality
- User preference storage
- Feature flag system
- Email template management
- Custom branding engine
- Settings audit log

### Future Scalability Considerations
- Organization-level feature flags
- User-level feature access
- Gradual feature rollout

### Issues
- 🟡 **MEDIUM**: Limited customization options
- 🟡 **MEDIUM**: Settings UI basic

---

## Cross-Domain Dependencies

```
Authentication
    ↓
Users & Roles ← Organization
    ↓
Tickets ← Customers
    ↓
Notifications ← Analytics
    ↓
Public API
    ↓
Webhooks ← Billing ← Settings
    ↓
Knowledge Base
```

---

## Business Value Summary

| Domain | Complexity | Value | Status | Priority |
|--------|-----------|-------|--------|----------|
| Authentication | HIGH | CRITICAL | 🟡 | IMMEDIATE |
| Organizations | MEDIUM | HIGH | ✅ | DONE |
| Users & Roles | MEDIUM | HIGH | 🟡 | NEXT |
| Tickets | HIGH | CRITICAL | ✅ | DONE |
| Customers | MEDIUM | HIGH | ✅ | DONE |
| Knowledge Base | MEDIUM | MEDIUM | 🟢 | Q3 2024 |
| Analytics | HIGH | MEDIUM | 🟡 | Q2 2024 |
| Notifications | MEDIUM | HIGH | 🟡 | NEXT |
| Webhooks | HIGH | MEDIUM | 🟢 | Q3 2024 |
| Public API | HIGH | MEDIUM | 🟡 | Q2 2024 |
| Billing | HIGH | CRITICAL | 🟢 | Q2 2024 |
| Settings | MEDIUM | LOW | 🟡 | Q3 2024 |

---

## Recommendations

1. **IMMEDIATE**: Fix Authentication domain (JWT, password hashing)
2. **NEXT**: Complete Users & Roles with RBAC
3. **NEXT**: Complete Notifications system
4. **Q2 2024**: Implement Billing domain
5. **Q2 2024**: Complete Public API
6. **Q2 2024**: Build Analytics dashboard
7. **Q3 2024**: Implement Knowledge Base
8. **Q3 2024**: Add Webhooks
9. **Q4 2024**: Expand Settings

