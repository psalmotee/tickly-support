// used
import { NextRequest, NextResponse } from "next/server";
import { getOrganizationWebsites } from "@/lib/supabase-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
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
      websites,
      count: websites.length,
    });
  } catch (error) {
    console.error("Error fetching websites:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
