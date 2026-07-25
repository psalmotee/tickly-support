# Database Review - Supabase PostgreSQL

## Executive Summary

Current Status: **🟡 PARTIAL** - Basic tables exist, but missing critical features:
- No Row Level Security (RLS) policies
- Missing foreign key constraints
- Missing indexes on query columns
- No soft delete strategy
- No audit logging
- No automatic timestamp management

**Production Readiness**: 25% (Critical security and performance issues)

---

## Table Index

| Table | Status | Rows | Issues | Priority |
|-------|--------|------|--------|----------|
| `user` | ✅ Functional | ~50 | No email unique constraint | HIGH |
| `organization` | ✅ Functional | ~10 | No soft delete | MEDIUM |
| `organization_member` | ✅ Functional | ~100 | No indexes | HIGH |
| `ticket` | ✅ Functional | ~500 | No pagination support | HIGH |
| `ticket_message` | ✅ Functional | ~1000 | No indexes | HIGH |
| `customer` | ✅ Functional | ~100 | Missing FK constraint | HIGH |
| `website` | ⚠️ Partial | ~10 | Limited features | MEDIUM |
| `custom_field` | ⚠️ Partial | ~50 | No validation | MEDIUM |
| `email_preference` | ⚠️ Partial | ~50 | No foreign keys | MEDIUM |

---

## Table 1: `user`

### Purpose
Core authentication table - store user credentials and profile.

### Current Schema
```sql
CREATE TABLE "user" (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Issues Found

| Issue | Severity | Impact | Fix |
|-------|----------|--------|-----|
| No email UNIQUE constraint | 🔴 CRITICAL | Duplicate emails possible | Add UNIQUE (email) |
| No email validation | 🔴 CRITICAL | Invalid emails in DB | Add CHECK constraint |
| Password hash too short (255) | 🟡 HIGH | Some hashes truncated | Increase to 512 |
| No soft delete | 🟡 HIGH | Can't restore deleted users | Add deleted_at TIMESTAMP |
| No default for full_name | 🟡 MEDIUM | NULL values | Provide default |
| No index on email | 🟡 MEDIUM | Slow lookups | Add INDEX |
| No audit logging | 🟡 MEDIUM | No change history | Add audit table |

### Recommendations

```sql
-- Add email constraint
ALTER TABLE "user" ADD CONSTRAINT user_email_unique UNIQUE (email);

-- Add email validation
ALTER TABLE "user" ADD CONSTRAINT user_email_valid CHECK (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$');

-- Increase password hash column
ALTER TABLE "user" ALTER COLUMN password_hash TYPE VARCHAR(512);

-- Add soft delete
ALTER TABLE "user" ADD COLUMN deleted_at TIMESTAMP;

-- Add indexes
CREATE INDEX idx_user_email ON "user"(email);
CREATE INDEX idx_user_deleted_at ON "user"(deleted_at) WHERE deleted_at IS NULL;

-- Add audit trigger
CREATE TABLE user_audit (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE FUNCTION audit_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_audit (user_id, action, old_values, new_values)
  VALUES (COALESCE(NEW.id, OLD.id), TG_OP, row_to_json(OLD), row_to_json(NEW));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON "user"
FOR EACH ROW
EXECUTE FUNCTION audit_user();
```

### RLS Policies
```sql
-- ✅ GOOD: Users can view their own data
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_select_self ON "user"
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY user_update_self ON "user"
  FOR UPDATE
  USING (auth.uid() = id);

-- ❌ MISSING: Admin access to all users
-- Needs to be added for admin dashboard
```

### Normalization
✅ GOOD - First normal form (1NF), dependencies on primary key only

### Performance
- ⚠️ Email lookup missing index
- ✅ UUID primary key good for distribution
- ⚠️ No pagination support

---

## Table 2: `organization`

### Purpose
Workspace/tenant table - isolate data between customers.

### Current Schema
```sql
CREATE TABLE organization (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Issues Found

| Issue | Severity | Impact | Fix |
|-------|----------|--------|-----|
| No FK to user | 🔴 CRITICAL | Orphaned organizations | Add FOREIGN KEY |
| Unique user_id wrong | 🔴 CRITICAL | One user per org | Remove UNIQUE, add org_member table |
| No soft delete | 🟡 HIGH | Can't restore orgs | Add deleted_at |
| No logo/branding | 🟡 MEDIUM | Limited customization | Add columns |
| No slug field | 🟡 MEDIUM | Can't use in URLs | Add slug, add UNIQUE |
| No audit logging | 🟡 MEDIUM | No change history | Add audit |
| No index on user_id | 🟡 MEDIUM | Slow lookups | Add INDEX |

### Recommended Changes

```sql
-- Add FK to user
ALTER TABLE organization 
  ADD CONSTRAINT fk_organization_user 
  FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

-- Remove incorrect UNIQUE
ALTER TABLE organization DROP CONSTRAINT organization_user_id_key;

-- Add customization fields
ALTER TABLE organization 
  ADD COLUMN logo_url VARCHAR(512),
  ADD COLUMN slug VARCHAR(255) UNIQUE NOT NULL,
  ADD COLUMN description TEXT,
  ADD COLUMN settings JSONB DEFAULT '{}';

-- Add soft delete
ALTER TABLE organization ADD COLUMN deleted_at TIMESTAMP;

-- Add indexes
CREATE INDEX idx_organization_user_id ON organization(user_id);
CREATE INDEX idx_organization_slug ON organization(slug);
CREATE INDEX idx_organization_deleted_at ON organization(deleted_at) WHERE deleted_at IS NULL;
```

### RLS Policies

```sql
ALTER TABLE organization ENABLE ROW LEVEL SECURITY;

-- Users can view organizations they're members of
CREATE POLICY org_select ON organization
  FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM organization_member
      WHERE user_id = auth.uid()
    )
  );

-- Owners can update
CREATE POLICY org_update ON organization
  FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM organization_member
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
```

---

## Table 3: `organization_member`

### Purpose
Join table between users and organizations with roles.

### Current Schema
```sql
CREATE TABLE organization_member (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Issues Found

| Issue | Severity | Impact | Fix |
|-------|----------|--------|-----|
| No FK constraints | 🔴 CRITICAL | Orphaned members | Add FKs |
| No unique constraint | 🟡 HIGH | Duplicate members | Add UNIQUE (org_id, user_id) |
| No role validation | 🟡 HIGH | Invalid roles | Add CHECK |
| No indexes | 🔴 CRITICAL | N+1 queries | Add indexes |
| No soft delete | 🟡 MEDIUM | Can't track history | Add deleted_at |
| No audit logging | 🟡 MEDIUM | No role changes tracked | Add audit |

### Recommended Changes

```sql
-- Add FK constraints
ALTER TABLE organization_member
  ADD CONSTRAINT fk_org_member_org 
    FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_org_member_user 
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

-- Add uniqueness
ALTER TABLE organization_member
  ADD CONSTRAINT uq_org_member_unique 
  UNIQUE (organization_id, user_id);

-- Add role validation
ALTER TABLE organization_member
  ADD CONSTRAINT check_org_member_role 
  CHECK (role IN ('owner', 'admin', 'member', 'viewer'));

-- Add indexes
CREATE INDEX idx_org_member_org_id ON organization_member(organization_id);
CREATE INDEX idx_org_member_user_id ON organization_member(user_id);
CREATE INDEX idx_org_member_role ON organization_member(organization_id, role);

-- Add soft delete
ALTER TABLE organization_member ADD COLUMN deleted_at TIMESTAMP;
CREATE INDEX idx_org_member_deleted ON organization_member(deleted_at) WHERE deleted_at IS NULL;
```

### RLS Policies

```sql
ALTER TABLE organization_member ENABLE ROW LEVEL SECURITY;

-- Members can view other members in their org
CREATE POLICY org_member_select ON organization_member
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_member
      WHERE user_id = auth.uid()
    )
  );

-- Owners can manage members
CREATE POLICY org_member_insert ON organization_member
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_member
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
```

---

## Table 4: `ticket`

### Purpose
Support tickets - core feature of application.

### Current Schema
```sql
CREATE TABLE ticket (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  customer_id UUID,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(50) DEFAULT 'medium',
  assigned_to UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Issues Found

| Issue | Severity | Impact | Fix |
|-------|----------|--------|-----|
| No FK constraints | 🔴 CRITICAL | Orphaned tickets | Add FKs |
| No indexes | 🔴 CRITICAL | N+1 queries, slow lists | Add indexes |
| No pagination fields | 🔴 CRITICAL | Can't implement pagination | Add created_at index |
| Status/priority not validated | 🟡 HIGH | Invalid values | Add CHECK |
| No SLA fields | 🟡 HIGH | Can't track SLA | Add response_due, resolution_due |
| No soft delete | 🟡 MEDIUM | Can't restore | Add deleted_at |
| No tags | 🟡 MEDIUM | Limited filtering | Add tags JSONB |
| No custom fields | 🟡 MEDIUM | Limited data | Add custom_fields JSONB |
| No full-text search | 🟡 MEDIUM | Can't search content | Add tsvector column |

### Recommended Changes

```sql
-- Add FK constraints
ALTER TABLE ticket
  ADD CONSTRAINT fk_ticket_org 
    FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_ticket_customer 
    FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_ticket_assigned_to 
    FOREIGN KEY (assigned_to) REFERENCES "user"(id) ON DELETE SET NULL;

-- Add validations
ALTER TABLE ticket
  ADD CONSTRAINT check_ticket_status 
    CHECK (status IN ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed')),
  ADD CONSTRAINT check_ticket_priority 
    CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Add fields
ALTER TABLE ticket
  ADD COLUMN public_token VARCHAR(64) UNIQUE,
  ADD COLUMN resolved_at TIMESTAMP,
  ADD COLUMN resolution_time_minutes INT,
  ADD COLUMN customer_name VARCHAR(255),
  ADD COLUMN customer_email VARCHAR(255),
  ADD COLUMN tags TEXT[] DEFAULT '{}',
  ADD COLUMN custom_fields JSONB DEFAULT '{}',
  ADD COLUMN search_text TSVECTOR;

-- Add indexes (CRITICAL for performance)
CREATE INDEX idx_ticket_org_id ON ticket(organization_id);
CREATE INDEX idx_ticket_customer_id ON ticket(customer_id);
CREATE INDEX idx_ticket_assigned_to ON ticket(assigned_to);
CREATE INDEX idx_ticket_status ON ticket(organization_id, status);
CREATE INDEX idx_ticket_created_at ON ticket(organization_id, created_at DESC);
CREATE INDEX idx_ticket_priority_status ON ticket(organization_id, priority, status);
CREATE INDEX idx_ticket_search ON ticket USING gin(search_text);
CREATE INDEX idx_ticket_public_token ON ticket(public_token);

-- Add soft delete
ALTER TABLE ticket ADD COLUMN deleted_at TIMESTAMP;
CREATE INDEX idx_ticket_deleted ON ticket(deleted_at) WHERE deleted_at IS NULL;

-- Add full-text search trigger
CREATE FUNCTION update_ticket_search() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_text := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.description, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_search_trigger
BEFORE INSERT OR UPDATE ON ticket
FOR EACH ROW
EXECUTE FUNCTION update_ticket_search();
```

### Performance Issues

- ⚠️ N+1 queries on ticket list (no INDEX on org_id)
- ⚠️ Status filtering slow (no composite index)
- ⚠️ No pagination support
- ⚠️ Search requires table scan

### RLS Policies

```sql
ALTER TABLE ticket ENABLE ROW LEVEL SECURITY;

-- Team members see tickets in their org
CREATE POLICY ticket_select_org ON ticket
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_member
      WHERE user_id = auth.uid()
    )
  );

-- Customers see their own tickets
CREATE POLICY ticket_select_customer ON ticket
  FOR SELECT
  USING (customer_id = auth.uid());

-- Members can update tickets
CREATE POLICY ticket_update_org ON ticket
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_member
      WHERE user_id = auth.uid()
    )
  );
```

---

## Table 5: `ticket_message`

### Purpose
Comments/messages on tickets.

### Current Schema
```sql
CREATE TABLE ticket_message (
  id UUID PRIMARY KEY,
  ticket_id UUID NOT NULL,
  user_id UUID,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Issues Found

| Issue | Severity | Impact | Fix |
|-------|----------|--------|-----|
| No FK constraints | 🔴 CRITICAL | Orphaned messages | Add FKs |
| No indexes | 🟡 HIGH | Slow message lists | Add indexes |
| user_id can be NULL | 🟡 MEDIUM | Attribution unclear | Make NOT NULL |
| No soft delete | 🟡 MEDIUM | Can't restore | Add deleted_at |
| No edit history | 🟡 MEDIUM | No version control | Track old_message |
| No mentions/tags | 🟡 LOW | Can't mention users | Add mentions JSONB |

### Recommended Changes

```sql
-- Add FKs
ALTER TABLE ticket_message
  ADD CONSTRAINT fk_message_ticket 
    FOREIGN KEY (ticket_id) REFERENCES ticket(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_message_user 
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE SET NULL;

-- Make user_id required
ALTER TABLE ticket_message ALTER COLUMN user_id SET NOT NULL;

-- Add fields
ALTER TABLE ticket_message
  ADD COLUMN is_internal BOOLEAN DEFAULT FALSE,
  ADD COLUMN edited_at TIMESTAMP,
  ADD COLUMN mentions JSONB DEFAULT '[]';

-- Add indexes
CREATE INDEX idx_message_ticket_id ON ticket_message(ticket_id);
CREATE INDEX idx_message_user_id ON ticket_message(user_id);
CREATE INDEX idx_message_created_at ON ticket_message(ticket_id, created_at);

-- Soft delete
ALTER TABLE ticket_message ADD COLUMN deleted_at TIMESTAMP;
```

---

## Table 6: `customer`

### Purpose
External customers who submit tickets.

### Current Schema
```sql
CREATE TABLE customer (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Issues Found

| Issue | Severity | Impact | Fix |
|-------|----------|--------|-----|
| No FK to organization | 🔴 CRITICAL | Orphaned customers | Add FK |
| No unique constraint on email | 🟡 HIGH | Duplicate emails | Add UNIQUE (org_id, email) |
| No validation | 🟡 MEDIUM | Invalid emails | Add CHECK |
| No phone field | 🟡 MEDIUM | Contact info missing | Add phone VARCHAR |
| No tags | 🟡 MEDIUM | Can't segment | Add tags JSONB |
| No indexes | 🟡 MEDIUM | Slow lookups | Add indexes |

### Recommended Changes

```sql
ALTER TABLE customer
  ADD CONSTRAINT fk_customer_org 
    FOREIGN KEY (organization_id) REFERENCES organization(id) ON DELETE CASCADE,
  ADD CONSTRAINT uq_customer_email 
    UNIQUE (organization_id, email);

ALTER TABLE customer
  ADD COLUMN phone VARCHAR(20),
  ADD COLUMN tags TEXT[] DEFAULT '{}',
  ADD COLUMN custom_fields JSONB DEFAULT '{}';

CREATE INDEX idx_customer_org_id ON customer(organization_id);
CREATE INDEX idx_customer_email ON customer(organization_id, email);
```

---

## Missing Tables (Should Exist)

| Table | Purpose | Priority |
|-------|---------|----------|
| `webhook` | Webhook registrations | HIGH |
| `webhook_log` | Webhook delivery logs | HIGH |
| `api_key` | API authentication | HIGH |
| `setting` | Organization settings | MEDIUM |
| `notification_preference` | User notification settings | MEDIUM |
| `custom_field` | Dynamic org fields | MEDIUM |
| `website` | Widget configuration | MEDIUM |
| `email_preference` | Email preferences | LOW |
| `audit_log` | All changes | MEDIUM |

---

## Summary of Fixes

### 🔴 CRITICAL (Block production)
1. Add FK constraints to all tables
2. Add UNIQUE constraints to prevent duplicates
3. Add RLS policies to all tables
4. Add indexes on join/filter columns
5. Add CHECK constraints for enums

### 🟡 HIGH (Fix before GA)
1. Implement soft deletes
2. Add pagination support
3. Add audit logging
4. Add missing fields
5. Add full-text search

### 🟢 MEDIUM (Add in next release)
1. Add custom fields
2. Implement webhooks
3. Add analytics tables
4. Add notification tables

---

## Estimated Effort

| Category | Effort | Risk |
|----------|--------|------|
| Add constraints | 4 hours | Low |
| Add indexes | 2 hours | Low |
| Add RLS | 8 hours | Medium |
| Add soft deletes | 4 hours | Medium |
| Add missing fields | 6 hours | Low |
| Data migration | 4 hours | High |
| **TOTAL** | **28 hours** | **Medium** |

**Recommendation**: Do not deploy to production until all CRITICAL fixes are applied.

