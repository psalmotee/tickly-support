// used
import { NextRequest, NextResponse } from "next/server";
import { getCustomerInvite } from "@/lib/supabase-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const inviteData = await getCustomerInvite(token);

    if (!inviteData) {
      return NextResponse.json(
        { error: "Invalid or expired invite" },
        { status: 404 },
      );
    }

    // Return invite details (but not the token itself for security)
    return NextResponse.json({
      email: inviteData.email,
      expiresAt: inviteData.expires_at,
      organization: {
        id: inviteData.organization.id,
        name: inviteData.organization.name,
      },
    });
  } catch (error) {
    console.error("Error fetching customer invite:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
