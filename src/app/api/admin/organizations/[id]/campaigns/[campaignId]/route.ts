import { supabase } from "@/lib/supabase-client";
import { getRequestSessionUser } from "@/lib/server-session";

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string; campaignId: string }>;
  },
) {
  try {
    const sessionUser = await getRequestSessionUser();
    if (!sessionUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: organizationId, campaignId } = await params;
    const { action } = await request.json();

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

    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", campaignId)
      .eq("organization_id", organizationId)
      .single();

    if (campaignError || !campaign) {
      return Response.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (action === "send") {
      if (campaign.status === "sent") {
        return Response.json(
          { error: "Campaign already sent" },
          { status: 400 },
        );
      }

      // Get target recipients
      let recipients: any[] = [];

      if (campaign.target_type === "all") {
        const { data: customers } = await supabase
          .from("customers")
          .select("id, email")
          .eq("organization_id", organizationId);

        recipients = customers || [];
      } else if (campaign.target_type === "tag") {
        const { data: customers } = await supabase
          .from("customers")
          .select("id, email")
          .eq("organization_id", organizationId)
          .contains("tags", [campaign.target_tag]);

        recipients = customers || [];
      }

      // Create email send records
      const sendRecords = recipients.map((customer) => ({
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
          sent_count: recipients.length,
          sent_at: new Date().toISOString(),
        })
        .eq("id", campaignId);

      if (updateError) throw updateError;

      return Response.json({
        success: true,
        message: "Campaign sent successfully",
        sentCount: recipients.length,
      });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error sending campaign:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string; campaignId: string }>;
  },
) {
  try {
    const sessionUser = await getRequestSessionUser();
    if (!sessionUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: organizationId, campaignId } = await params;

    // Verify user has access
    const { data: membership, error: memberError } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", sessionUser.id)
      .single();

    if (memberError || !membership) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    // Get campaign stats
    const { data: campaign } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", campaignId)
      .eq("organization_id", organizationId)
      .single();

    const { data: sends } = await supabase
      .from("email_sends")
      .select("status")
      .eq("campaign_id", campaignId);

    const stats = {
      sent: (sends || []).filter((s) => s.status === "sent").length,
      failed: (sends || []).filter((s) => s.status === "failed").length,
      pending: (sends || []).filter((s) => s.status === "pending").length,
    };

    return Response.json({
      success: true,
      campaign,
      stats,
    });
  } catch (error) {
    console.error("Error fetching campaign stats:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
