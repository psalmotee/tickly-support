import { supabase } from "@/lib/supabase-client";
import { getRequestSessionUser } from "@/lib/server-session";
import {
  calculateSLAMetrics,
  getSLASettings,
  updateSLASettings,
  getSLAStats,
} from "@/lib/supabase-helpers";

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
    const url = new URL(request.url);
    const action = url.searchParams.get("action");

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

    if (action === "metrics") {
      // Get SLA metrics for all tickets
      const metrics = await calculateSLAMetrics(organizationId);

      return Response.json({
        success: true,
        metrics,
      });
    }

    if (action === "stats") {
      // Get SLA statistics summary
      const stats = await getSLAStats(organizationId);

      return Response.json({
        success: true,
        stats,
      });
    }

    if (action === "settings") {
      // Get SLA settings
      const settings = await getSLASettings(organizationId);

      return Response.json({
        success: true,
        settings,
      });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching SLA data:", error);
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
    const { action, first_response_hours, resolution_hours } =
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

    if (action === "update_settings") {
      if (!first_response_hours || !resolution_hours) {
        return Response.json(
          { error: "Missing required fields" },
          { status: 400 },
        );
      }

      const success = await updateSLASettings(
        organizationId,
        first_response_hours,
        resolution_hours,
      );

      if (!success) {
        throw new Error("Failed to update settings");
      }

      return Response.json({
        success: true,
        message: "SLA settings updated successfully",
      });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating SLA:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
