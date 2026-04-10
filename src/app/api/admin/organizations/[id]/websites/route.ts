// used
import { NextRequest, NextResponse } from "next/server";
import { getOrganizationWebsites } from "@/lib/supabase-helpers";
import { getRequestSessionUser } from "@/lib/server-session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getRequestSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: organizationId } = await params;

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 },
      );
    }

    const websites = await getOrganizationWebsites(organizationId);

    return NextResponse.json({
      success: true,
      websites: websites || [],
      count: (websites || []).length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error fetching websites:", errorMessage);
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 },
    );
  }
}
