// used
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getRequestSessionUser } from "@/lib/server-session";
import { supabaseAdmin } from "@/lib/supabase-client";
import {
  getOrganizationMembers,
  updateOrganizationMember,
  removeOrganizationMember,
  createOrganizationInvite,
  getOrganizationInvitesForOrg,
} from "@/lib/supabase-helpers";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const sessionUser = await getRequestSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: organizationId } = await context.params;

    // Verify organization exists using supabaseAdmin to bypass RLS
    const { data: org, error: orgError } = await supabaseAdmin
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404 },
      );
    }

    // Check if user is admin of organization using supabaseAdmin to bypass RLS
    const { data: membership, error: memberError } = await supabaseAdmin
      .from("organization_members")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("user_id", sessionUser.id)
      .single();

    if (memberError || !membership || membership.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    // Fetch members
    const members = await getOrganizationMembers(organizationId);

    console.log("[org-members][GET] Fetched members:", {
      count: members.length,
      sample: members[0],
    });

    // Fetch pending invites
    const invites = await getOrganizationInvitesForOrg(organizationId);

    return NextResponse.json({
      success: true,
      members: members.map((m) => ({
        userId: m.user_id,
        email: m.user?.email || "Unknown",
        fullName: m.user?.full_name || "Unknown",
        role: m.role,
        createdAt: m.created_at,
      })),
      pendingInvites: invites.map((i) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        expiresAt: i.expires_at,
        createdAt: i.created_at,
      })),
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error
          ? String((error as any).message)
          : String(error);

    console.error("[org-members][GET] Failed to fetch members", {
      error: errorMessage,
      details: error,
    });
    return NextResponse.json(
      { success: false, error: "Failed to fetch members" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const sessionUser = await getRequestSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: organizationId } = await context.params;

    // Verify organization exists using supabaseAdmin to bypass RLS
    const { data: org, error: orgError } = await supabaseAdmin
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404 },
      );
    }

    // Check if user is admin of organization using supabaseAdmin to bypass RLS
    const { data: membership, error: memberError } = await supabaseAdmin
      .from("organization_members")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("user_id", sessionUser.id)
      .single();

    if (memberError || !membership || membership.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { email, role } = body as { email?: unknown; role?: unknown };

    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 },
      );
    }

    if (!["admin", "agent", "viewer"].includes(role as string)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid role. Must be admin, agent, or viewer",
        },
        { status: 400 },
      );
    }

    // Create invite
    const invite = await createOrganizationInvite(
      organizationId,
      email,
      role as "admin" | "agent" | "viewer",
      sessionUser.id,
    );

    if (!invite) {
      console.error(
        "[org-members][POST] createOrganizationInvite returned null for email:",
        email,
      );
      return NextResponse.json(
        { success: false, error: "Failed to create invite" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        invite: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          token: invite.token,
          expiresAt: invite.expires_at,
        },
        message: `Invite sent to ${email}. Share the token for them to join.`,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("[org-members][POST] Failed to create invite", { error });
    return NextResponse.json(
      { success: false, error: "Failed to create invite" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const sessionUser = await getRequestSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: organizationId } = await context.params;

    // Check if user is admin of organization using supabaseAdmin to bypass RLS
    const { data: membership, error: memberError } = await supabaseAdmin
      .from("organization_members")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("user_id", sessionUser.id)
      .single();

    if (memberError || !membership || membership.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { userId, role } = body as { userId?: unknown; role?: unknown };

    if (typeof userId !== "string" || !userId.trim()) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 },
      );
    }

    if (!["admin", "agent", "viewer"].includes(role as string)) {
      return NextResponse.json(
        { success: false, error: "Invalid role" },
        { status: 400 },
      );
    }

    // Prevent removing own admin role
    if (userId === sessionUser.id && role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Cannot remove your own admin role" },
        { status: 400 },
      );
    }

    const updated = await updateOrganizationMember(organizationId, userId, {
      role: role as "admin" | "agent" | "viewer",
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Failed to update member" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      member: {
        userId: updated.user_id,
        role: updated.role,
      },
    });
  } catch (error: unknown) {
    console.error("[org-members][PATCH] Failed to update member", { error });
    return NextResponse.json(
      { success: false, error: "Failed to update member" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const sessionUser = await getRequestSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: organizationId } = await context.params;

    // Check if user is admin of organization using supabaseAdmin to bypass RLS
    const { data: membership, error: memberError } = await supabaseAdmin
      .from("organization_members")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("user_id", sessionUser.id)
      .single();

    if (memberError || !membership || membership.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { userId } = body as { userId?: unknown };

    if (typeof userId !== "string" || !userId.trim()) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 },
      );
    }

    // Prevent removing yourself
    if (userId === sessionUser.id) {
      return NextResponse.json(
        { success: false, error: "Cannot remove yourself from organization" },
        { status: 400 },
      );
    }

    const success = await removeOrganizationMember(organizationId, userId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Failed to remove member" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error: unknown) {
    console.error("[org-members][DELETE] Failed to remove member", { error });
    return NextResponse.json(
      { success: false, error: "Failed to remove member" },
      { status: 500 },
    );
  }
}
