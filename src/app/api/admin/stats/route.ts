
import { NextRequest, NextResponse } from "next/server";
import { getDashboardStats, getTicketsByStatus } from "@/lib/supabase-helpers";

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get("orgId");
    const websiteId = request.nextUrl.searchParams.get("websiteId");

    if (!orgId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 },
      );
    }

    // Get dashboard stats
    const stats = await getDashboardStats(orgId, websiteId || undefined);
    const statusCounts = await getTicketsByStatus(
      orgId,
      websiteId || undefined,
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalTickets: stats.totalTickets,
        openTickets: stats.openTickets,
        resolvedTickets: stats.resolvedTickets,
        averageResolutionTime: stats.averageResolutionTime,
      },
      statusCounts,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
