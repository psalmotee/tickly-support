/**
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

export async function getUserOrganizations(
  userId: string,
): Promise<OrganizationRecord[]> {
  try {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .or(`owner_id.eq.${userId},organization_members(user_id).eq.${userId}`);

    if (error) throw error;
    return data as OrganizationRecord[];
  } catch (error) {
    console.error("Error fetching user organizations:", error);
    return [];
  }
}

// ====== SUPPORT TICKETS ======

export interface TicketRecord {
  id: string;
  organization_id: string;
  project_id: string | null;
  user_id: string | null;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "closed";
  customer_email: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  company_name: string | null;
  category: string | null;
  public_token: string | null;
  internal_notes: string;
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
