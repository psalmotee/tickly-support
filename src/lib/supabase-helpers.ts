// used
/**
 *
 * Supabase Helper Utilities
 *
 * This library provides common operations for working with Supabase
 * Replaces MantaHQ SDK usage throughout the app
 */

import { supabase } from "./supabase-client";

// ====== USERS ======

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: "admin" | "user";
  created_at: string;
  updated_at: string;
}

export async function getUserByEmail(
  email: string,
): Promise<UserRecord | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data as UserRecord | null;
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data as UserRecord | null;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return null;
  }
}

export async function createUser(
  userData: Omit<UserRecord, "created_at" | "updated_at">,
): Promise<UserRecord | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .insert([userData])
      .select()
      .single();

    if (error) throw error;
    return data as UserRecord;
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  }
}

// ====== ORGANIZATIONS ======

export interface OrganizationRecord {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  metadata: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getOrganizationById(
  id: string,
): Promise<OrganizationRecord | null> {
  try {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data as OrganizationRecord | null;
  } catch (error) {
    console.error("Error fetching organization:", error);
    return null;
  }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function findUniqueSlug(baseName: string): Promise<string> {
  let slug = generateSlug(baseName);
  const originalSlug = slug;
  let counter = 1;

  while (true) {
    const { data, error } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .single();

    // PGRST116 means no rows found (slug is unique)
    if (error && error.code === "PGRST116") {
      return slug;
    }

    // Slug already exists, try next variant
    slug = `${originalSlug}-${counter}`;
    counter++;
  }
}

export async function createOrganization(
  userId: string,
  name: string,
  metadata?: Record<string, any>,
): Promise<OrganizationRecord | null> {
  try {
    const slug = await findUniqueSlug(name);

    const { data, error } = await supabase
      .from("organizations")
      .insert([
        {
          name: name.trim(),
          slug,
          owner_id: userId,
          metadata: metadata || {},
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data as OrganizationRecord;
  } catch (error) {
    console.error("Error creating organization:", error);
    return null;
  }
}

export interface OrganizationMemberRecord {
  id: string;
  organization_id: string;
  user_id: string;
  role: "admin" | "agent" | "viewer";
  created_at: string;
  updated_at: string;
}

export async function createOrganizationMember(
  organizationId: string,
  userId: string,
  role: "admin" | "agent" | "viewer" = "agent",
): Promise<OrganizationMemberRecord | null> {
  try {
    const { data, error } = await supabase
      .from("organization_members")
      .insert([
        {
          organization_id: organizationId,
          user_id: userId,
          role,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data as OrganizationMemberRecord;
  } catch (error) {
    console.error("Error creating organization member:", error);
    return null;
  }
}

export async function getOrganizationMember(
  organizationId: string,
  userId: string,
): Promise<OrganizationMemberRecord | null> {
  try {
    const { data, error } = await supabase
      .from("organization_members")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data as OrganizationMemberRecord | null;
  } catch (error) {
    console.error("Error fetching organization member:", error);
    return null;
  }
}

export async function getOrganizationMembers(
  organizationId: string,
): Promise<
  (OrganizationMemberRecord & { user?: { email: string; full_name: string } })[]
> {
  try {
    const { data, error } = await supabase
      .from("organization_members")
      .select("*, users(email, full_name)")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as any[];
  } catch (error) {
    console.error("Error fetching organization members:", error);
    return [];
  }
}

export async function updateOrganizationMember(
  organizationId: string,
  userId: string,
  updates: Partial<Pick<OrganizationMemberRecord, "role">>,
): Promise<OrganizationMemberRecord | null> {
  try {
    const { data, error } = await supabase
      .from("organization_members")
      .update(updates)
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data as OrganizationMemberRecord;
  } catch (error) {
    console.error("Error updating organization member:", error);
    return null;
  }
}

export async function removeOrganizationMember(
  organizationId: string,
  userId: string,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("organization_members")
      .delete()
      .eq("organization_id", organizationId)
      .eq("user_id", userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error removing organization member:", error);
    return false;
  }
}

export interface OrganizationInviteRecord {
  id: string;
  organization_id: string;
  email: string;
  token: string;
  role: "admin" | "agent" | "viewer";
  invited_by: string;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
}

export async function createOrganizationInvite(
  organizationId: string,
  email: string,
  role: "admin" | "agent" | "viewer",
  invitedBy: string,
  expiresIn: number = 7 * 24 * 60 * 60 * 1000, // 7 days in ms
): Promise<OrganizationInviteRecord | null> {
  try {
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + expiresIn).toISOString();

    const { data, error } = await supabase
      .from("organization_invites")
      .insert([
        {
          organization_id: organizationId,
          email: email.toLowerCase(),
          token,
          role,
          invited_by: invitedBy,
          expires_at: expiresAt,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data as OrganizationInviteRecord;
  } catch (error) {
    console.error("Error creating organization invite:", error);
    return null;
  }
}

export async function getOrganizationInvite(
  token: string,
): Promise<OrganizationInviteRecord | null> {
  try {
    const { data, error } = await supabase
      .from("organization_invites")
      .select("*")
      .eq("token", token)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    // Check if expired
    if (data && new Date(data.expires_at) < new Date()) {
      return null; // Invite expired
    }

    return data as OrganizationInviteRecord | null;
  } catch (error) {
    console.error("Error fetching organization invite:", error);
    return null;
  }
}

export async function acceptOrganizationInvite(
  token: string,
  userId: string,
): Promise<boolean> {
  try {
    // Get the invite
    const { data: invite, error: fetchError } = await supabase
      .from("organization_invites")
      .select("*")
      .eq("token", token)
      .single();

    if (fetchError || !invite) {
      console.error("Invite not found or expired");
      return false;
    }

    // Check expiration
    if (new Date(invite.expires_at) < new Date()) {
      console.error("Invite expired");
      return false;
    }

    // Check if already accepted
    if (invite.accepted_at) {
      console.error("Invite already accepted");
      return false;
    }

    // Create membership
    const { error: memberError } = await supabase
      .from("organization_members")
      .insert([
        {
          organization_id: invite.organization_id,
          user_id: userId,
          role: invite.role,
        },
      ]);

    if (memberError) {
      // Check if membership already exists
      if (!memberError.message.includes("duplicate key")) {
        throw memberError;
      }
    }

    // Mark invite as accepted
    const { error: updateError } = await supabase
      .from("organization_invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("token", token);

    if (updateError) throw updateError;
    return true;
  } catch (error) {
    console.error("Error accepting organization invite:", error);
    return false;
  }
}

export async function getOrganizationInvitesForOrg(
  organizationId: string,
): Promise<OrganizationInviteRecord[]> {
  try {
    const { data, error } = await supabase
      .from("organization_invites")
      .select("*")
      .eq("organization_id", organizationId)
      .is("accepted_at", null) // Only pending invites
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as OrganizationInviteRecord[];
  } catch (error) {
    console.error("Error fetching organization invites:", error);
    return [];
  }
}

// ====== SUPPORT TICKETS ======

export interface TicketRecord {
  id: string;
  organization_id: string;
  project_id: string | null;
  user_id: string | null;
  customer_id: string | null;
  website_id: string | null;
  category_id: string | null;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "closed";
  source_channel: "widget" | "api" | "email" | "manual";
  rating: number | null;
  customer_email: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  company_name: string | null;
  category: string | null;
  public_token: string | null;
  internal_notes: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getTicketById(id: string): Promise<TicketRecord | null> {
  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data as TicketRecord | null;
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return null;
  }
}

export async function getTicketByPublicToken(
  publicToken: string,
): Promise<TicketRecord | null> {
  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("public_token", publicToken)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data as TicketRecord | null;
  } catch (error) {
    console.error("Error fetching ticket by public token:", error);
    return null;
  }
}

export async function getUserTickets(userId: string): Promise<TicketRecord[]> {
  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as TicketRecord[];
  } catch (error) {
    console.error("Error fetching user tickets:", error);
    return [];
  }
}

export async function getOrganizationTickets(
  organizationId: string,
): Promise<TicketRecord[]> {
  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as TicketRecord[];
  } catch (error) {
    console.error("Error fetching organization tickets:", error);
    return [];
  }
}

export async function createTicket(
  ticketData: Omit<TicketRecord, "id" | "created_at" | "updated_at">,
): Promise<TicketRecord | null> {
  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .insert([ticketData])
      .select()
      .single();

    if (error) throw error;
    return data as TicketRecord;
  } catch (error) {
    console.error("Error creating ticket:", error);
    return null;
  }
}

export async function updateTicket(
  id: string,
  updates: Partial<TicketRecord>,
): Promise<TicketRecord | null> {
  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as TicketRecord;
  } catch (error) {
    console.error("Error updating ticket:", error);
    return null;
  }
}

// ====== API KEYS ======

export interface ApiKeyRecord {
  id: string;
  project_id: string;
  key_hash: string;
  key_preview: string;
  is_active: boolean;
  is_secret: boolean;
  permissions: string[];
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

export async function getApiKeyByHash(
  keyHash: string,
): Promise<ApiKeyRecord | null> {
  try {
    const { data, error } = await supabase
      .from("api_keys")
      .select("*")
      .eq("key_hash", keyHash)
      .eq("is_active", true)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data as ApiKeyRecord | null;
  } catch (error) {
    console.error("Error fetching API key:", error);
    return null;
  }
}

// ====== ORGANIZATIONS MEMBERS ======

export interface OrgMemberRecord {
  id: string;
  organization_id: string;
  user_id: string;
  role: "admin" | "agent" | "viewer";
  created_at: string;
}

export async function getOrgMembers(
  organizationId: string,
): Promise<OrgMemberRecord[]> {
  try {
    const { data, error } = await supabase
      .from("organization_members")
      .select("*")
      .eq("organization_id", organizationId);

    if (error) throw error;
    return data as OrgMemberRecord[];
  } catch (error) {
    console.error("Error fetching org members:", error);
    return [];
  }
}

// ====== CUSTOMERS ======

export interface CustomerRecord {
  id: string;
  organization_id: string;
  email: string;
  email_verified: boolean;
  full_name: string;
  phone: string | null;
  company_name: string | null;
  custom_fields: Record<string, any> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getCustomerByEmail(
  organizationId: string,
  email: string,
): Promise<CustomerRecord | null> {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("email", email.toLowerCase())
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data as CustomerRecord | null;
  } catch (error) {
    console.error("Error fetching customer by email:", error);
    return null;
  }
}

export async function getCustomerById(
  id: string,
): Promise<CustomerRecord | null> {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data as CustomerRecord | null;
  } catch (error) {
    console.error("Error fetching customer by ID:", error);
    return null;
  }
}

export async function createOrUpdateCustomer(
  organizationId: string,
  email: string,
  customerData: Partial<
    Omit<
      CustomerRecord,
      "id" | "organization_id" | "email" | "created_at" | "updated_at"
    >
  >,
): Promise<CustomerRecord | null> {
  try {
    // First try to get existing customer
    const existing = await getCustomerByEmail(organizationId, email);

    if (existing) {
      // Update existing customer
      const { data, error } = await supabase
        .from("customers")
        .update(customerData)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return data as CustomerRecord;
    } else {
      // Create new customer
      const { data, error } = await supabase
        .from("customers")
        .insert([
          {
            organization_id: organizationId,
            email: email.toLowerCase(),
            full_name: customerData.full_name || email.split("@")[0],
            phone: customerData.phone || null,
            company_name: customerData.company_name || null,
            custom_fields: customerData.custom_fields || {},
            is_active: true,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data as CustomerRecord;
    }
  } catch (error) {
    console.error("Error creating/updating customer:", error);
    return null;
  }
}

// ====== WEBSITES ======

export interface WebsiteRecord {
  id: string;
  organization_id: string;
  name: string;
  domain: string;
  description: string | null;
  logo_url: string | null;
  primary_color: string;
  widget_token: string;
  api_key: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getWebsiteByToken(
  widgetToken: string,
): Promise<WebsiteRecord | null> {
  try {
    const { data, error } = await supabase
      .from("websites")
      .select("*")
      .eq("widget_token", widgetToken)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data as WebsiteRecord | null;
  } catch (error) {
    console.error("Error fetching website by token:", error);
    return null;
  }
}

export async function getWebsiteById(
  id: string,
): Promise<WebsiteRecord | null> {
  try {
    const { data, error } = await supabase
      .from("websites")
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data as WebsiteRecord | null;
  } catch (error) {
    console.error("Error fetching website by ID:", error);
    return null;
  }
}

export async function createWebsite(
  websiteData: Omit<
    WebsiteRecord,
    "id" | "created_at" | "updated_at" | "widget_token"
  > & { widget_token?: string },
): Promise<WebsiteRecord | null> {
  try {
    // Generate widget token if not provided
    const widgetToken =
      websiteData.widget_token || `wt_${generateSecureToken()}`;

    const { data, error } = await supabase
      .from("websites")
      .insert([
        {
          ...websiteData,
          widget_token: widgetToken,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data as WebsiteRecord;
  } catch (error) {
    console.error("Error creating website:", error);
    return null;
  }
}

export async function updateWebsite(
  id: string,
  updates: Partial<Omit<WebsiteRecord, "id" | "created_at" | "updated_at">>,
): Promise<WebsiteRecord | null> {
  try {
    const { data, error } = await supabase
      .from("websites")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as WebsiteRecord;
  } catch (error) {
    console.error("Error updating website:", error);
    return null;
  }
}

export async function deleteWebsite(id: string): Promise<boolean> {
  try {
    // Soft delete by marking as inactive
    const { error } = await supabase
      .from("websites")
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting website:", error);
    return false;
  }
}

function generateSecureToken(): string {
  // Generate a random hex token
  const array = new Uint8Array(16);
  if (typeof window === "undefined") {
    // Server-side: use Node.js crypto
    const { randomBytes } = require("crypto");
    return randomBytes(16).toString("hex");
  } else {
    // Client-side: use Web Crypto API
    crypto.getRandomValues(array);
    return Array.from(array)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
}

// ====== ORGANIZATION SETTINGS ======

export interface OrganizationSettingsRecord {
  id: string;
  organization_id: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  auto_reply_enabled: boolean;
  auto_reply_message: string;
  support_timezone: string;
  support_hours_enabled: boolean;
  support_hours_start: string;
  support_hours_end: string;
  notification_email: string | null;
  webhook_url: string | null;
  custom_css: string | null;
  branding_logo_height: number;
  features: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export async function getOrganizationSettings(
  organizationId: string,
): Promise<OrganizationSettingsRecord | null> {
  try {
    const { data, error } = await supabase
      .from("organization_settings")
      .select("*")
      .eq("organization_id", organizationId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data as OrganizationSettingsRecord | null;
  } catch (error) {
    console.error("Error fetching organization settings:", error);
    return null;
  }
}

export async function updateOrganizationSettings(
  organizationId: string,
  updates: Partial<
    Omit<
      OrganizationSettingsRecord,
      "id" | "organization_id" | "created_at" | "updated_at"
    >
  >,
): Promise<OrganizationSettingsRecord | null> {
  try {
    const { data, error } = await supabase
      .from("organization_settings")
      .update(updates)
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (error) throw error;
    return data as OrganizationSettingsRecord;
  } catch (error) {
    console.error("Error updating organization settings:", error);
    return null;
  }
}

// ====== CUSTOMER INVITES ======

export interface CustomerInviteRecord {
  id: string;
  organization_id: string;
  email: string;
  token: string;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
}

export async function createCustomerInvite(
  organizationId: string,
  email: string,
): Promise<CustomerInviteRecord | null> {
  try {
    const token = generateSecureToken();
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString(); // 7 days

    const { data, error } = await supabase
      .from("customer_invites")
      .insert([
        {
          organization_id: organizationId,
          email: email.toLowerCase(),
          token,
          expires_at: expiresAt,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data as CustomerInviteRecord;
  } catch (error) {
    console.error("Error creating customer invite:", error);
    return null;
  }
}

export async function getCustomerInvite(token: string): Promise<
  | (CustomerInviteRecord & {
      organization: OrganizationRecord;
    } & { invitedBy?: string })
  | null
> {
  try {
    const { data, error } = await supabase
      .from("customer_invites")
      .select("*, organizations(*)")
      .eq("token", token)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    if (!data) return null;

    // Check if expired
    if (new Date(data.expires_at) < new Date()) {
      return null; // Expired
    }

    return data as CustomerInviteRecord & {
      organization: OrganizationRecord;
    } & { invitedBy?: string };
  } catch (error) {
    console.error("Error fetching customer invite:", error);
    return null;
  }
}

export async function acceptCustomerInvite(
  token: string,
  email: string,
): Promise<
  | (CustomerRecord & {
      organization: OrganizationRecord;
      sessionToken: string;
    })
  | null
> {
  try {
    // Get and validate invite
    const inviteData = await getCustomerInvite(token);
    if (!inviteData) {
      throw new Error("Invalid or expired invite");
    }

    // Verify email matches
    if (inviteData.email.toLowerCase() !== email.toLowerCase()) {
      throw new Error("Email does not match invite");
    }

    // Create or get customer
    let customer = await getCustomerByEmail(inviteData.organization_id, email);

    if (!customer) {
      customer = await createOrUpdateCustomer(
        inviteData.organization_id,
        email,
        {
          full_name: email.split("@")[0],
          email_verified: true,
        },
      );

      if (!customer) {
        throw new Error("Failed to create customer account");
      }
    } else {
      // Mark as verified if already exists
      await supabase
        .from("customers")
        .update({ email_verified: true })
        .eq("id", customer.id);
    }

    // Mark invite as accepted
    await supabase
      .from("customer_invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", inviteData.id);

    // Generate session token
    const sessionToken = generateSecureToken();

    return {
      ...customer,
      organization: inviteData.organization,
      sessionToken,
    } as CustomerRecord & {
      organization: OrganizationRecord;
      sessionToken: string;
    };
  } catch (error) {
    console.error("Error accepting customer invite:", error);
    return null;
  }
}

// ====== CUSTOMER TICKETS ======

export interface CustomerTicketRecord {
  id: string;
  customer_id: string;
  organization_id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export async function getCustomerTickets(
  customerId: string,
): Promise<CustomerTicketRecord[]> {
  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .select(
        "id, customer_id, organization_id, title, description, status, priority, created_at, updated_at, resolved_at",
      )
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as CustomerTicketRecord[];
  } catch (error) {
    console.error("Error fetching customer tickets:", error);
    return [];
  }
}

export async function getCustomerTicketById(
  ticketId: string,
  customerId: string,
): Promise<CustomerTicketRecord | null> {
  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .select(
        "id, customer_id, organization_id, title, description, status, priority, created_at, updated_at, resolved_at",
      )
      .eq("id", ticketId)
      .eq("customer_id", customerId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return (data || null) as CustomerTicketRecord | null;
  } catch (error) {
    console.error("Error fetching customer ticket:", error);
    return null;
  }
}

export async function createCustomerTicket(
  customerId: string,
  organizationId: string,
  ticketData: {
    title: string;
    description: string;
    priority?: "low" | "medium" | "high" | "urgent";
  },
): Promise<CustomerTicketRecord | null> {
  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .insert([
        {
          customer_id: customerId,
          organization_id: organizationId,
          title: ticketData.title,
          description: ticketData.description,
          priority: ticketData.priority || "medium",
          status: "open",
        },
      ])
      .select(
        "id, customer_id, organization_id, title, description, status, priority, created_at, updated_at, resolved_at",
      )
      .single();

    if (error) throw error;
    return data as CustomerTicketRecord;
  } catch (error) {
    console.error("Error creating customer ticket:", error);
    return null;
  }
}

// ====== DASHBOARD HELPERS ======

export interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  averageResolutionTime: number;
  recentTickets: CustomerTicketRecord[];
}

export async function getDashboardStats(
  organizationId: string,
  websiteId?: string,
): Promise<DashboardStats> {
  try {
    let query = supabase
      .from("support_tickets")
      .select("*")
      .eq("organization_id", organizationId);

    if (websiteId) {
      query = query.eq("website_id", websiteId);
    }

    const { data: allTickets, error } = await query;

    if (error) throw error;

    const tickets = (allTickets || []) as any[];
    const totalTickets = tickets.length;
    const openTickets = tickets.filter(
      (t) => t.status === "open" || t.status === "in_progress",
    ).length;
    const resolvedTickets = tickets.filter(
      (t) => t.status === "resolved",
    ).length;

    // Calculate average resolution time (in hours)
    const resolvedWithTime = tickets
      .filter((t) => t.resolved_at && t.created_at)
      .map((t) => {
        const created = new Date(t.created_at).getTime();
        const resolved = new Date(t.resolved_at).getTime();
        return (resolved - created) / (1000 * 60 * 60); // Convert to hours
      });

    const averageResolutionTime =
      resolvedWithTime.length > 0
        ? resolvedWithTime.reduce((a, b) => a + b, 0) / resolvedWithTime.length
        : 0;

    const recentTickets = tickets
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, 5) as CustomerTicketRecord[];

    return {
      totalTickets,
      openTickets,
      resolvedTickets,
      averageResolutionTime: Math.round(averageResolutionTime),
      recentTickets,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      totalTickets: 0,
      openTickets: 0,
      resolvedTickets: 0,
      averageResolutionTime: 0,
      recentTickets: [],
    };
  }
}

export async function getUserOrganizations(userId: string): Promise<
  (OrganizationRecord & {
    memberRole: "owner" | "admin" | "agent" | "viewer";
  })[]
> {
  try {
    const { data, error } = await supabase
      .from("organization_members")
      .select("organizations(*), role")
      .eq("user_id", userId);

    if (error) throw error;

    return (data || []).map((item: any) => ({
      ...item.organizations,
      memberRole: item.role,
    }));
  } catch (error) {
    console.error("Error fetching user organizations:", error);
    return [];
  }
}

export async function getOrganizationWebsites(
  organizationId: string,
): Promise<WebsiteRecord[]> {
  try {
    const { data, error } = await supabase
      .from("websites")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as WebsiteRecord[];
  } catch (error) {
    console.error("Error fetching websites:", error);
    return [];
  }
}

export async function getTicketsByStatus(
  organizationId: string,
  websiteId?: string,
): Promise<{
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}> {
  try {
    let query = supabase
      .from("support_tickets")
      .select("status")
      .eq("organization_id", organizationId);

    if (websiteId) {
      query = query.eq("website_id", websiteId);
    }

    const { data: tickets, error } = await query;

    if (error) throw error;

    const statusCounts = {
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
    };

    (tickets || []).forEach((ticket: any) => {
      switch (ticket.status) {
        case "open":
          statusCounts.open++;
          break;
        case "in_progress":
          statusCounts.inProgress++;
          break;
        case "resolved":
          statusCounts.resolved++;
          break;
        case "closed":
          statusCounts.closed++;
          break;
      }
    });

    return statusCounts;
  } catch (error) {
    console.error("Error fetching ticket status counts:", error);
    return {
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
    };
  }
}

// ====== WIDGET SUBMISSIONS ======

export interface WidgetTicketData {
  websiteId: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  priority: "low" | "medium" | "high" | "critical";
}

export async function createWidgetTicket(
  ticketData: WidgetTicketData,
): Promise<TicketRecord | null> {
  try {
    // Get website
    const website = await getWebsiteById(ticketData.websiteId);
    if (!website) {
      console.error("Website not found:", ticketData.websiteId);
      return null;
    }

    // Create or get customer
    const customer = await createOrUpdateCustomer(
      website.organization_id,
      ticketData.email,
      {
        full_name: ticketData.name,
        phone: ticketData.phone,
      },
    );

    if (!customer) {
      console.error("Failed to create/get customer");
      return null;
    }

    // Generate public token for customer access
    const publicToken = `pt_${generateSecureToken()}`;

    // Create ticket
    const { data, error } = await supabase
      .from("support_tickets")
      .insert([
        {
          organization_id: website.organization_id,
          website_id: ticketData.websiteId,
          customer_id: customer.id,
          title: ticketData.subject,
          description: ticketData.message,
          priority: ticketData.priority,
          status: "open",
          source_channel: "widget",
          customer_name: ticketData.name,
          customer_email: ticketData.email,
          customer_phone: ticketData.phone,
          public_token: publicToken,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data as TicketRecord;
  } catch (error) {
    console.error("Error creating widget ticket:", error);
    return null;
  }
}

// ====== EMAIL NOTIFICATION PREFERENCES ======

export interface EmailPreferencesRecord {
  id: string;
  organization_id: string;
  user_id: string;
  notify_new_tickets: boolean;
  notify_assignment: boolean;
  notify_status_changes: boolean;
  notify_daily_digest: boolean;
  digest_time: string; // "09:00" format
  created_at: string;
  updated_at: string;
}

export async function getUserEmailPreferences(
  organizationId: string,
  userId: string,
): Promise<EmailPreferencesRecord | null> {
  try {
    const { data, error } = await supabase
      .from("email_preferences")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data as EmailPreferencesRecord | null;
  } catch (error) {
    console.error("Error fetching email preferences:", error);
    return null;
  }
}

export async function updateUserEmailPreferences(
  organizationId: string,
  userId: string,
  preferences: Partial<
    Omit<
      EmailPreferencesRecord,
      "id" | "organization_id" | "user_id" | "created_at" | "updated_at"
    >
  >,
): Promise<EmailPreferencesRecord | null> {
  try {
    // Check if preferences exist
    const existing = await getUserEmailPreferences(organizationId, userId);

    if (existing) {
      // Update
      const { data, error } = await supabase
        .from("email_preferences")
        .update(preferences)
        .eq("organization_id", organizationId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      return data as EmailPreferencesRecord;
    } else {
      // Create with defaults
      const { data, error } = await supabase
        .from("email_preferences")
        .insert([
          {
            organization_id: organizationId,
            user_id: userId,
            notify_new_tickets: true,
            notify_assignment: true,
            notify_status_changes: true,
            notify_daily_digest: false,
            digest_time: "09:00",
            ...preferences,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data as EmailPreferencesRecord;
    }
  } catch (error) {
    console.error("Error updating email preferences:", error);
    return null;
  }
}
