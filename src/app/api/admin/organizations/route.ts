// used
import { NextRequest, NextResponse } from "next/server";
import { getOrganizationMembers } from "@/lib/supabase-helpers";
import { supabaseAdmin } from "@/lib/supabase-client";
import { getRequestSessionUser } from "@/lib/server-session";

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all organizations for this user
    const { data: memberships, error: memberError } = await supabaseAdmin
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id);

    if (memberError || !memberships) {
      return NextResponse.json(
        { error: "Failed to fetch organizations" },
        { status: 500 },
      );
    }

    // Get organization details for each membership
    const orgIds = memberships.map((m) => m.organization_id);
    if (orgIds.length === 0) {
      return NextResponse.json({
        success: true,
        organizations: [],
        count: 0,
      });
    }

    const { data: organizations, error: orgError } = await supabaseAdmin
      .from("organizations")
      .select("id, name, slug")
      .in("id", orgIds);

    if (orgError || !organizations) {
      return NextResponse.json(
        { error: "Failed to fetch organization details" },
        { status: 500 },
      );
    }

    // Merge organization details with membership roles
    const orgsWithRoles = organizations.map((org) => {
      const membership = memberships.find((m) => m.organization_id === org.id);
      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        memberRole: membership?.role || "viewer",
      };
    });

    return NextResponse.json({
      success: true,
      organizations: orgsWithRoles,
      count: orgsWithRoles.length,
    });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
