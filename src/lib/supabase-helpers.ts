// used
/**
 *
 * Supabase Helper Utilities
 *
 * This library provides common operations for working with Supabase
 * Replaces MantaHQ SDK usage throughout the app
 */

import { randomUUID } from "crypto";
import { supabase, supabaseAdmin } from "./supabase-client";

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
    // Fetch organization members
    const { data: members, error: membersError } = await supabaseAdmin
      .from("organization_members")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (membersError || !members) {
      console.error("Error fetching organization members:", membersError);
      return [];
    }

    // Get all user ids
    const userIds = members.map((m) => m.user_id);
    if (userIds.length === 0) {
      return [];
    }

    // Fetch user details
    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name")
      .in("id", userIds);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      // Return members without user data rather than failing completely
      return members as any[];
    }

    // Create a user map for easy lookup
    const userMap = new Map(users?.map((u) => [u.id, u]) || []);

    // Combine members with user data
    const result = members.map((m) => ({
      ...m,
      user: userMap.get(m.user_id) || null,
    }));

    console.log("[getOrganizationMembers] Fetched members with users:", {
      memberCount: members.length,
      userCount: users?.length || 0,
    });

    return result as any[];
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
    const { data, error } = await supabaseAdmin
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
    const { error } = await supabaseAdmin
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

    const { data, error } = await supabaseAdmin
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

    if (error) {
      console.error("Error creating organization invite:", {
        error,
        organizationId,
        email,
        role,
      });
      throw error;
    }
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
    const { data, error } = await supabaseAdmin
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
    const { data, error } = await supabaseAdmin
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

// ====== CUSTOMER MANAGEMENT (Phase 5) ======

export async function getOrganizationCustomers(
  organizationId: string,
  options?: {
    limit?: number;
    offset?: number;
    sortBy?: "created_at" | "name" | "email";
    order?: "asc" | "desc";
  },
): Promise<(CustomerRecord & { ticket_count: number })[]> {
  try {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    const sortBy = options?.sortBy || "created_at";
    const order = options?.order || "desc";

    const { data, error } = await supabase
      .from("customers")
      .select("*, support_tickets(count)")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .order(sortBy, { ascending: order === "asc" })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return (data || []).map((customer: any) => ({
      ...customer,
      ticket_count: customer.support_tickets?.[0]?.count || 0,
    }));
  } catch (error) {
    console.error("Error fetching organization customers:", error);
    return [];
  }
}

export async function searchCustomers(
  organizationId: string,
  query: string,
): Promise<CustomerRecord[]> {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`);

    if (error) throw error;
    return (data || []) as CustomerRecord[];
  } catch (error) {
    console.error("Error searching customers:", error);
    return [];
  }
}

export async function getCustomerWithTickets(
  customerId: string,
): Promise<(CustomerRecord & { tickets: TicketRecord[] }) | null> {
  try {
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .single();

    if (customerError && customerError.code !== "PGRST116") throw customerError;
    if (!customer) return null;

    const { data: tickets, error: ticketsError } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (ticketsError) throw ticketsError;

    return {
      ...(customer as CustomerRecord),
      tickets: (tickets || []) as TicketRecord[],
    };
  } catch (error) {
    console.error("Error fetching customer with tickets:", error);
    return null;
  }
}

export async function updateCustomer(
  customerId: string,
  updates: Partial<
    Omit<CustomerRecord, "id" | "organization_id" | "created_at" | "updated_at">
  >,
): Promise<CustomerRecord | null> {
  try {
    const { data, error } = await supabase
      .from("customers")
      .update(updates)
      .eq("id", customerId)
      .select()
      .single();

    if (error) throw error;
    return data as CustomerRecord;
  } catch (error) {
    console.error("Error updating customer:", error);
    return null;
  }
}

export interface CustomerNoteRecord {
  id: string;
  customer_id: string;
  created_by_id: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export async function addCustomerNote(
  customerId: string,
  userId: string,
  note: string,
): Promise<CustomerNoteRecord | null> {
  try {
    const { data, error } = await supabase
      .from("customer_notes")
      .insert([
        {
          customer_id: customerId,
          created_by_id: userId,
          note: note.trim(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data as CustomerNoteRecord;
  } catch (error) {
    console.error("Error adding customer note:", error);
    return null;
  }
}

export async function getCustomerNotes(
  customerId: string,
): Promise<
  (CustomerNoteRecord & { created_by?: { full_name: string; email: string } })[]
> {
  try {
    const { data, error } = await supabase
      .from("customer_notes")
      .select("*, users(full_name, email)")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as any[];
  } catch (error) {
    console.error("Error fetching customer notes:", error);
    return [];
  }
}

// ====== CUSTOMER TAGGING (Phase 5.2) ======

export async function addTagToCustomer(
  customerId: string,
  tag: string,
): Promise<boolean> {
  try {
    // Get current tags
    const { data: customer, error: fetchError } = await supabase
      .from("customers")
      .select("tags")
      .eq("id", customerId)
      .single();

    if (fetchError) throw fetchError;
    if (!customer) return false;

    const currentTags = (customer.tags as string[]) || [];
    const normalizedTag = tag.toLowerCase().trim();

    // Avoid duplicates
    if (currentTags.includes(normalizedTag)) {
      return true;
    }

    const newTags = [...currentTags, normalizedTag];

    const { error: updateError } = await supabase
      .from("customers")
      .update({ tags: newTags })
      .eq("id", customerId);

    if (updateError) throw updateError;
    return true;
  } catch (error) {
    console.error("Error adding tag to customer:", error);
    return false;
  }
}

export async function removeTagFromCustomer(
  customerId: string,
  tag: string,
): Promise<boolean> {
  try {
    const { data: customer, error: fetchError } = await supabase
      .from("customers")
      .select("tags")
      .eq("id", customerId)
      .single();

    if (fetchError) throw fetchError;
    if (!customer) return false;

    const currentTags = (customer.tags as string[]) || [];
    const normalizedTag = tag.toLowerCase().trim();
    const newTags = currentTags.filter((t) => t !== normalizedTag);

    const { error: updateError } = await supabase
      .from("customers")
      .update({ tags: newTags })
      .eq("id", customerId);

    if (updateError) throw updateError;
    return true;
  } catch (error) {
    console.error("Error removing tag from customer:", error);
    return false;
  }
}

export async function getCustomerTags(customerId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("tags")
      .eq("id", customerId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return ((data?.tags as string[]) || []).sort();
  } catch (error) {
    console.error("Error fetching customer tags:", error);
    return [];
  }
}

export async function getCustomersWithTag(
  organizationId: string,
  tag: string,
): Promise<(CustomerRecord & { tag_count: number })[]> {
  try {
    const normalizedTag = tag.toLowerCase().trim();

    const { data, error } = await supabase
      .from("customers")
      .select("*, support_tickets(count)")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .contains("tags", [normalizedTag]);

    if (error) throw error;

    return (data || []).map((customer: any) => ({
      ...customer,
      tag_count: (customer.tags as string[])?.length || 0,
    }));
  } catch (error) {
    console.error("Error fetching customers with tag:", error);
    return [];
  }
}

export async function getOrganizationTags(
  organizationId: string,
): Promise<{ tag: string; count: number }[]> {
  try {
    // Get all customers and their tags
    const { data, error } = await supabase
      .from("customers")
      .select("tags")
      .eq("organization_id", organizationId)
      .eq("is_active", true);

    if (error) throw error;

    // Count occurrences of each tag
    const tagCounts: Record<string, number> = {};
    (data || []).forEach((customer: any) => {
      const tags = (customer.tags as string[]) || [];
      tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // Convert to array and sort by count
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error("Error fetching organization tags:", error);
    return [];
  }
}

export async function bulkAddTagToCustomers(
  customerIds: string[],
  tag: string,
): Promise<number> {
  try {
    let successCount = 0;
    const normalizedTag = tag.toLowerCase().trim();

    for (const customerId of customerIds) {
      const success = await addTagToCustomer(customerId, normalizedTag);
      if (success) successCount++;
    }

    return successCount;
  } catch (error) {
    console.error("Error bulk adding tag to customers:", error);
    return 0;
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
    const { data, error } = await supabaseAdmin
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
    console.log(
      "[createWidgetTicket] Starting ticket creation for website:",
      ticketData.websiteId,
    );

    // Get website (use supabaseAdmin to bypass RLS for public endpoint)
    console.log("[createWidgetTicket] Fetching website...");
    const { data: website, error: websiteError } = await supabaseAdmin
      .from("websites")
      .select("*")
      .eq("id", ticketData.websiteId)
      .single();

    if (websiteError || !website) {
      console.error(
        "[createWidgetTicket] Website not found:",
        ticketData.websiteId,
        websiteError,
      );
      return null;
    }
    console.log("[createWidgetTicket] Website found:", website.id);

    // Create or get customer (use supabaseAdmin to bypass RLS)
    console.log(
      "[createWidgetTicket] Looking up customer with email:",
      ticketData.email.toLowerCase(),
    );
    const { data: existingCustomer, error: existingError } = await supabaseAdmin
      .from("customers")
      .select("*")
      .eq("organization_id", website.organization_id)
      .eq("email", ticketData.email.toLowerCase())
      .single();

    if (existingError && existingError.code !== "PGRST116") {
      console.error(
        "[createWidgetTicket] Error looking up customer:",
        existingError,
      );
    }

    let customer = existingCustomer;

    if (!customer) {
      console.log(
        "[createWidgetTicket] Customer not found, creating new one...",
      );
      const { data: newCustomer, error: customerError } = await supabaseAdmin
        .from("customers")
        .insert([
          {
            organization_id: website.organization_id,
            email: ticketData.email.toLowerCase(),
            full_name: ticketData.name,
            phone: ticketData.phone || null,
          },
        ])
        .select()
        .single();

      if (customerError) {
        console.error(
          "[createWidgetTicket] Failed to create customer:",
          customerError,
        );
        return null;
      }
      customer = newCustomer;
      console.log("[createWidgetTicket] Customer created:", customer.id);
    } else {
      console.log("[createWidgetTicket] Using existing customer:", customer.id);
    }

    if (!customer) {
      console.error("[createWidgetTicket] Failed to create/get customer");
      return null;
    }

    // Generate public token for customer access (use plain UUID, not prefixed)
    const publicToken = randomUUID();
    console.log("[createWidgetTicket] Generated public token");

    // Create ticket (use supabaseAdmin to bypass RLS)
    console.log("[createWidgetTicket] Creating support ticket...");
    const { data, error } = await supabaseAdmin
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

    if (error) {
      console.error("[createWidgetTicket] Error inserting ticket:", {
        code: error.code,
        message: error.message,
        details: error.details,
      });
      throw error;
    }

    console.log("[createWidgetTicket] Ticket created successfully:", data.id);
    return data as TicketRecord;
  } catch (error) {
    console.error("[createWidgetTicket] Exception:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
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

// ====== CUSTOM FIELDS ======

export interface CustomFieldRecord {
  id: string;
  organization_id: string;
  name: string;
  field_type: "text" | "email" | "tel" | "number" | "select" | "textarea";
  label: string;
  placeholder: string | null;
  required: boolean;
  options: string[] | null; // For select fields
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TicketCustomFieldValue {
  id: string;
  ticket_id: string;
  field_id: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export async function getOrganizationCustomFields(
  organizationId: string,
): Promise<CustomFieldRecord[]> {
  try {
    const { data, error } = await supabase
      .from("custom_fields")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) throw error;
    return data as CustomFieldRecord[];
  } catch (error) {
    console.error("Error fetching custom fields:", error);
    return [];
  }
}

export async function createCustomField(
  organizationId: string,
  fieldData: Omit<
    CustomFieldRecord,
    "id" | "organization_id" | "created_at" | "updated_at"
  >,
): Promise<CustomFieldRecord | null> {
  try {
    const { data, error } = await supabase
      .from("custom_fields")
      .insert([
        {
          organization_id: organizationId,
          ...fieldData,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase error creating custom field:", error);
      throw new Error(`Supabase: ${error.message}`);
    }
    return data as CustomFieldRecord;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error creating custom field:", msg);
    throw error;
  }
}

export async function updateCustomField(
  organizationId: string,
  fieldId: string,
  updates: Partial<
    Omit<
      CustomFieldRecord,
      "id" | "organization_id" | "created_at" | "updated_at"
    >
  >,
): Promise<CustomFieldRecord | null> {
  try {
    const { data, error } = await supabase
      .from("custom_fields")
      .update(updates)
      .eq("id", fieldId)
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (error) throw error;
    return data as CustomFieldRecord;
  } catch (error) {
    console.error("Error updating custom field:", error);
    return null;
  }
}

export async function deleteCustomField(
  organizationId: string,
  fieldId: string,
): Promise<boolean> {
  try {
    // Soft delete
    const { error } = await supabase
      .from("custom_fields")
      .update({ is_active: false })
      .eq("id", fieldId)
      .eq("organization_id", organizationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting custom field:", error);
    return false;
  }
}

export async function getTicketCustomFieldValues(
  ticketId: string,
): Promise<(TicketCustomFieldValue & { field?: CustomFieldRecord })[]> {
  try {
    const { data, error } = await supabase
      .from("ticket_custom_field_values")
      .select("*, custom_fields(*)")
      .eq("ticket_id", ticketId);

    if (error) throw error;
    return data as (TicketCustomFieldValue & { field?: CustomFieldRecord })[];
  } catch (error) {
    console.error("Error fetching custom field values:", error);
    return [];
  }
}

export async function saveTicketCustomFieldValues(
  ticketId: string,
  values: Record<string, string>,
): Promise<boolean> {
  try {
    // Get existing values
    const { data: existing, error: fetchError } = await supabase
      .from("ticket_custom_field_values")
      .select("id, field_id")
      .eq("ticket_id", ticketId);

    if (fetchError) throw fetchError;

    // Delete old values
    if (existing && existing.length > 0) {
      const { error: deleteError } = await supabase
        .from("ticket_custom_field_values")
        .delete()
        .eq("ticket_id", ticketId);

      if (deleteError) throw deleteError;
    }

    // Insert new values
    const newValues = Object.entries(values).map(([fieldId, value]) => ({
      ticket_id: ticketId,
      field_id: fieldId,
      value,
    }));

    if (newValues.length > 0) {
      const { error: insertError } = await supabase
        .from("ticket_custom_field_values")
        .insert(newValues);

      if (insertError) throw insertError;
    }

    return true;
  } catch (error) {
    console.error("Error saving custom field values:", error);
    return false;
  }
}

// ====== EMAIL CAMPAIGNS ======

export interface EmailCampaign {
  id: string;
  organization_id: string;
  created_by: string;
  campaign_name: string;
  subject: string;
  body: string;
  target_type: "all" | "tag";
  target_tag?: string;
  status: "draft" | "scheduled" | "sent";
  recipient_count: number;
  sent_count: number;
  created_at: string;
  scheduled_at?: string;
  sent_at?: string;
}

export interface EmailSendRecord {
  id: string;
  campaign_id: string;
  customer_id: string;
  customer_email: string;
  status: "pending" | "sent" | "failed";
  error_message?: string;
  sent_at?: string;
  created_at: string;
}

export async function createEmailCampaign(
  organizationId: string,
  userId: string,
  campaignData: {
    campaign_name: string;
    subject: string;
    body: string;
    target_type: "all" | "tag";
    target_tag?: string;
  },
): Promise<EmailCampaign | null> {
  try {
    // Get target recipients
    let targetCustomers: CustomerRecord[] = [];

    if (campaignData.target_type === "all") {
      targetCustomers = await getOrganizationCustomers(organizationId, {
        limit: 10000,
      });
    } else if (campaignData.target_type === "tag" && campaignData.target_tag) {
      targetCustomers = await getCustomersWithTag(
        organizationId,
        campaignData.target_tag,
      );
    }

    const recipientCount = targetCustomers.length;

    const { data, error } = await supabase
      .from("email_campaigns")
      .insert({
        organization_id: organizationId,
        created_by: userId,
        campaign_name: campaignData.campaign_name,
        subject: campaignData.subject,
        body: campaignData.body,
        target_type: campaignData.target_type,
        target_tag: campaignData.target_tag || null,
        status: "draft",
        recipient_count: recipientCount,
        sent_count: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data as EmailCampaign;
  } catch (error) {
    console.error("Error creating email campaign:", error);
    return null;
  }
}

export async function getOrganizationCampaigns(
  organizationId: string,
): Promise<EmailCampaign[]> {
  try {
    const { data, error } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as EmailCampaign[];
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return [];
  }
}

export async function getEmailCampaign(
  campaignId: string,
): Promise<EmailCampaign | null> {
  try {
    const { data, error } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data as EmailCampaign | null;
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return null;
  }
}

export async function sendEmailCampaign(
  campaignId: string,
): Promise<{ success: boolean; sentCount: number; failedCount: number }> {
  try {
    const campaign = await getEmailCampaign(campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // Get target recipients
    let customers: CustomerRecord[] = [];

    if (campaign.target_type === "all") {
      customers = await getOrganizationCustomers(campaign.organization_id, {
        limit: 10000,
      });
    } else if (campaign.target_type === "tag" && campaign.target_tag) {
      customers = await getCustomersWithTag(
        campaign.organization_id,
        campaign.target_tag,
      );
    }

    // Create send records (in production, this would queue actual email sends)
    const sendRecords = customers.map((customer) => ({
      campaign_id: campaignId,
      customer_id: customer.id,
      customer_email: customer.email,
      status: "pending",
      created_at: new Date().toISOString(),
    }));

    if (sendRecords.length > 0) {
      const { error: insertError } = await supabase
        .from("email_sends")
        .insert(sendRecords);

      if (insertError) throw insertError;
    }

    // Update campaign status
    const { error: updateError } = await supabase
      .from("email_campaigns")
      .update({
        status: "sent",
        sent_count: customers.length,
        sent_at: new Date().toISOString(),
      })
      .eq("id", campaignId);

    if (updateError) throw updateError;

    return {
      success: true,
      sentCount: customers.length,
      failedCount: 0,
    };
  } catch (error) {
    console.error("Error sending campaign:", error);
    return {
      success: false,
      sentCount: 0,
      failedCount: 0,
    };
  }
}

export async function updateEmailCampaignStatus(
  campaignId: string,
  status: "draft" | "scheduled" | "sent",
  scheduledAt?: string,
): Promise<boolean> {
  try {
    const updateData: any = { status };
    if (scheduledAt) {
      updateData.scheduled_at = scheduledAt;
    }

    const { error } = await supabase
      .from("email_campaigns")
      .update(updateData)
      .eq("id", campaignId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating campaign status:", error);
    return false;
  }
}

export async function getCampaignEmailStats(
  campaignId: string,
): Promise<{ sent: number; failed: number; pending: number }> {
  try {
    const { data, error } = await supabase
      .from("email_sends")
      .select("status")
      .eq("campaign_id", campaignId);

    if (error) throw error;

    const stats = {
      sent: (data as EmailSendRecord[]).filter((s) => s.status === "sent")
        .length,
      failed: (data as EmailSendRecord[]).filter((s) => s.status === "failed")
        .length,
      pending: (data as EmailSendRecord[]).filter((s) => s.status === "pending")
        .length,
    };

    return stats;
  } catch (error) {
    console.error("Error fetching campaign stats:", error);
    return { sent: 0, failed: 0, pending: 0 };
  }
}

// ====== CUSTOMER PORTAL ======

export interface CustomerPortalTicket {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  assigned_to_name?: string;
}

export interface CustomerPortalView {
  customer_id: string;
  customer_name: string;
  customer_email: string;
  total_tickets: number;
  tickets: CustomerPortalTicket[];
}

export async function getCustomerTicketsPublic(
  customerId: string,
): Promise<CustomerPortalView | null> {
  try {
    // Get customer info
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id, full_name, email")
      .eq("id", customerId)
      .single();

    if (customerError || !customer) {
      console.error("Customer not found:", customerError);
      return null;
    }

    // Get customer's tickets
    const { data: tickets, error: ticketsError } = await supabase
      .from("tickets")
      .select(
        "id, ticket_number, title, description, status, priority, created_at, updated_at, users(full_name)",
      )
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (ticketsError) {
      console.error("Error fetching customer tickets:", ticketsError);
      return null;
    }

    // Transform to portal view
    const portalTickets: CustomerPortalTicket[] = (tickets || []).map(
      (ticket: any) => ({
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        assigned_to_name: ticket.users?.full_name,
      }),
    );

    return {
      customer_id: customer.id,
      customer_name: customer.full_name,
      customer_email: customer.email,
      total_tickets: tickets?.length || 0,
      tickets: portalTickets,
    };
  } catch (error) {
    console.error("Error loading customer portal data:", error);
    return null;
  }
}

export async function getTicketDetailPublic(
  ticketId: string,
): Promise<
  (TicketRecord & { customer?: any; assigned_to_name?: string }) | null
> {
  try {
    const { data, error } = await supabase
      .from("tickets")
      .select("*, customers(id, full_name, email), users(full_name)")
      .eq("id", ticketId)
      .single();

    if (error || !data) {
      console.error("Error fetching ticket:", error);
      return null;
    }

    return {
      ...(data as any),
      assigned_to_name: (data as any).users?.full_name,
    };
  } catch (error) {
    console.error("Error fetching ticket detail:", error);
    return null;
  }
}

// ====== SLA TRACKING ======

export interface SLAMetrics {
  ticketId: string;
  ticketNumber: string;
  title: string;
  customer_name: string;
  created_at: string;
  first_response_at?: string;
  resolved_at?: string;
  response_time_hours?: number;
  resolution_time_hours?: number;
  status: string;
  priority: string;
  breached: boolean;
  response_breached: boolean;
  resolution_breached: boolean;
}

export interface SLASettings {
  organization_id: string;
  first_response_hours: number;
  resolution_hours: number;
  updated_at: string;
}

export async function getSLASettings(
  organizationId: string,
): Promise<SLASettings | null> {
  try {
    const { data, error } = await supabase
      .from("sla_settings")
      .select("*")
      .eq("organization_id", organizationId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching SLA settings:", error);
    }

    // Return default SLA if not configured
    if (!data) {
      return {
        organization_id: organizationId,
        first_response_hours: 4,
        resolution_hours: 24,
        updated_at: new Date().toISOString(),
      };
    }

    return data as SLASettings;
  } catch (error) {
    console.error("Error fetching SLA settings:", error);
    return null;
  }
}

export async function updateSLASettings(
  organizationId: string,
  firstResponseHours: number,
  resolutionHours: number,
): Promise<boolean> {
  try {
    const { error } = await supabase.from("sla_settings").upsert(
      {
        organization_id: organizationId,
        first_response_hours: firstResponseHours,
        resolution_hours: resolutionHours,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id" },
    );

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating SLA settings:", error);
    return false;
  }
}

export async function calculateSLAMetrics(
  organizationId: string,
): Promise<SLAMetrics[]> {
  try {
    // Get SLA settings
    const slaSettings = await getSLASettings(organizationId);
    if (!slaSettings) {
      throw new Error("SLA settings not found");
    }

    // Get all tickets and calculate metrics
    const { data: tickets, error } = await supabase
      .from("tickets")
      .select(
        "id, ticket_number, title, status, priority, created_at, assigned_at, resolved_at, customers(full_name)",
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const metrics: SLAMetrics[] = (tickets || []).map((ticket: any) => {
      const createdTime = new Date(ticket.created_at).getTime();
      const currentTime = new Date().getTime();

      // Calculate response time (time until first assignment/response)
      let responseTimeHours = null;
      let responseBreached = false;

      if (ticket.assigned_at) {
        const assignedTime = new Date(ticket.assigned_at).getTime();
        responseTimeHours = (assignedTime - createdTime) / (1000 * 60 * 60);
        responseBreached = responseTimeHours > slaSettings.first_response_hours;
      } else {
        // Not yet assigned - check if breaching
        const elapsedHours = (currentTime - createdTime) / (1000 * 60 * 60);
        if (elapsedHours > slaSettings.first_response_hours) {
          responseBreached = true;
        }
      }

      // Calculate resolution time
      let resolutionTimeHours = null;
      let resolutionBreached = false;

      if (ticket.resolved_at) {
        const resolvedTime = new Date(ticket.resolved_at).getTime();
        resolutionTimeHours = (resolvedTime - createdTime) / (1000 * 60 * 60);
        resolutionBreached = resolutionTimeHours > slaSettings.resolution_hours;
      } else {
        // Not yet resolved - check if breaching
        const elapsedHours = (currentTime - createdTime) / (1000 * 60 * 60);
        if (elapsedHours > slaSettings.resolution_hours) {
          resolutionBreached = true;
        }
      }

      return {
        ticketId: ticket.id,
        ticketNumber: ticket.ticket_number,
        title: ticket.title,
        customer_name: ticket.customers?.full_name || "Unknown",
        created_at: ticket.created_at,
        first_response_at: ticket.assigned_at,
        resolved_at: ticket.resolved_at,
        response_time_hours: responseTimeHours
          ? Math.round(responseTimeHours * 10) / 10
          : undefined,
        resolution_time_hours: resolutionTimeHours
          ? Math.round(resolutionTimeHours * 10) / 10
          : undefined,
        status: ticket.status,
        priority: ticket.priority,
        breached: responseBreached || resolutionBreached,
        response_breached: responseBreached,
        resolution_breached: resolutionBreached,
      };
    });

    return metrics;
  } catch (error) {
    console.error("Error calculating SLA metrics:", error);
    return [];
  }
}

export async function getSLAStats(organizationId: string): Promise<{
  total_tickets: number;
  sla_breaches: number;
  compliance_rate: number;
  avg_response_time: number;
  avg_resolution_time: number;
}> {
  try {
    const metrics = await calculateSLAMetrics(organizationId);

    if (metrics.length === 0) {
      return {
        total_tickets: 0,
        sla_breaches: 0,
        compliance_rate: 100,
        avg_response_time: 0,
        avg_resolution_time: 0,
      };
    }

    const breaches = metrics.filter((m) => m.breached).length;
    const responseTimes = metrics
      .filter((m) => m.response_time_hours !== undefined)
      .map((m) => m.response_time_hours as number);
    const resolutionTimes = metrics
      .filter((m) => m.resolution_time_hours !== undefined)
      .map((m) => m.resolution_time_hours as number);

    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;
    const avgResolutionTime =
      resolutionTimes.length > 0
        ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
        : 0;

    return {
      total_tickets: metrics.length,
      sla_breaches: breaches,
      compliance_rate: Math.round(
        ((metrics.length - breaches) / metrics.length) * 100,
      ),
      avg_response_time: Math.round(avgResponseTime * 10) / 10,
      avg_resolution_time: Math.round(avgResolutionTime * 10) / 10,
    };
  } catch (error) {
    console.error("Error calculating SLA stats:", error);
    return {
      total_tickets: 0,
      sla_breaches: 0,
      compliance_rate: 0,
      avg_response_time: 0,
      avg_resolution_time: 0,
    };
  }
}
