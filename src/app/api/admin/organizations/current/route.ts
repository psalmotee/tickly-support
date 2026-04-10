import { NextRequest, NextResponse } from "next/server";
import { getRequestSessionUser } from "@/lib/server-session";
import {
  getOrganizationMemberships,
  getOrganizationById,
} from "@/lib/supabase-helpers";
import { supabaseAdmin } from "@/lib/supabase-client";

/**
 * GET /api/admin/organizations/current
 * Get the current user's organization (assumes single org per user)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getRequestSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get organization memberships
    const { data: memberships, error: memberError } = await supabaseAdmin
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id);

    if (memberError || !memberships || memberships.length === 0) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

    // Use first organization
    const orgId = memberships[0].organization_id;

    const { data: org, error: orgError } = await supabaseAdmin
      .from("organizations")
      .select("*")
      .eq("id", orgId)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Get organization stats
    const { count: userCount } = await supabaseAdmin
      .from("organization_members")
      .select("*", { count: "exact" })
      .eq("organization_id", orgId);

    const { count: customerCount } = await supabaseAdmin
      .from("customers")
      .select("*", { count: "exact" })
      .eq("organization_id", orgId);

    const { count: ticketCount } = await supabaseAdmin
      .from("tickets")
      .select("*", { count: "exact" })
      .eq("organization_id", orgId);

    const { count: campaignCount } = await supabaseAdmin
      .from("email_campaigns")
      .select("*", { count: "exact" })
      .eq("organization_id", orgId)
      .eq("status", "active");

    return NextResponse.json({
      organization: org,
      stats: {
        total_users: userCount || 0,
        total_customers: customerCount || 0,
        total_tickets: ticketCount || 0,
        active_campaigns: campaignCount || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization" },
      { status: 500 },
    );
  }
}
