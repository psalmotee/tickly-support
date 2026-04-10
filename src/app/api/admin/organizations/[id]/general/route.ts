import { NextRequest, NextResponse } from "next/server";
import { getRequestSessionUser } from "@/lib/server-session";
import { supabaseAdmin } from "@/lib/supabase-client";

interface UpdateParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/admin/organizations/[id]
 * Update organization settings
 */
export async function PUT(request: NextRequest, context: UpdateParams) {
  try {
    const user = await getRequestSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: orgId } = await context.params;
    const body = await request.json();
    const { name, billing_email } = body;

    // Verify user has access to this organization
    const { data: member, error: memberError } = await supabaseAdmin
      .from("organization_members")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Only allow admins to update
    if (member.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can update organization settings" },
        { status: 403 },
      );
    }

    // Update organization
    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (billing_email) updateData.billing_email = billing_email;

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("organizations")
      .update(updateData)
      .eq("id", orgId)
      .select("*")
      .single();

    if (updateError || !updated) {
      console.error("Error updating organization:", updateError);
      return NextResponse.json(
        { error: "Failed to update organization" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      organization: updated,
    });
  } catch (error) {
    console.error("Error in PUT /api/admin/organizations/[id]:", error);
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 },
    );
  }
}
