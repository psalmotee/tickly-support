import { supabase } from "@/lib/supabase-client";
import { getRequestSessionUser } from "@/lib/server-session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionUser = await getRequestSessionUser();
    if (!sessionUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: organizationId } = await params;

    // Verify user has access to this organization
    const { data: membership, error: memberError } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", sessionUser.id)
      .single();

    if (memberError || !membership) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    // Get all campaigns for this organization
    const { data: campaigns, error } = await supabase
      .from("email_campaigns")
      .select(
        "id, campaign_name, subject, status, target_type, target_tag, recipient_count, sent_count, created_at, created_by, users(full_name)",
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return Response.json({
      success: true,
      campaigns: campaigns || [],
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionUser = await getRequestSessionUser();
    if (!sessionUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: organizationId } = await params;
    const { action, campaign_name, subject, body, target_type, target_tag } =
      await request.json();

    // Verify user has admin access
    const { data: membership, error: memberError } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", sessionUser.id)
      .single();

    if (memberError || !membership || membership.role !== "admin") {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    // Create campaign
    if (action === "create") {
      // Get target recipients count
      let recipientCount = 0;

      if (target_type === "all") {
        const { count: countResult } = await supabase
          .from("customers")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", organizationId);

        recipientCount = countResult || 0;
      } else if (target_type === "tag" && target_tag) {
        const { data: customers } = await supabase
          .from("customers")
          .select("id")
          .eq("organization_id", organizationId)
          .contains("tags", [target_tag.toLowerCase()]);

        recipientCount = customers?.length || 0;
      }

      const { data: campaign, error: createError } = await supabase
        .from("email_campaigns")
        .insert({
          organization_id: organizationId,
          created_by: sessionUser.id,
          campaign_name,
          subject,
          body,
          target_type,
          target_tag: target_tag ? target_tag.toLowerCase() : null,
          status: "draft",
          recipient_count: recipientCount,
          sent_count: 0,
        })
        .select()
        .single();

      if (createError) throw createError;

      return Response.json({
        success: true,
        message: "Campaign created successfully",
        campaign,
      });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
