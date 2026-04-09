// used
import { NextRequest, NextResponse } from "next/server";
import {
  updateUserEmailPreferences,
  getUserEmailPreferences,
} from "@/lib/supabase-helpers";
import { getRequestSessionUser } from "@/lib/server-session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: organizationId } = await params;
    const session = await getRequestSessionUser();

    if (!session?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const preferences = await getUserEmailPreferences(
      organizationId,
      session.id,
    );

    return NextResponse.json({
      success: true,
      preferences: preferences || {
        notify_new_tickets: true,
        notify_assignment: true,
        notify_status_changes: true,
        notify_daily_digest: false,
        digest_time: "09:00",
      },
    });
  } catch (error) {
    console.error("Error fetching email preferences:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: organizationId } = await params;
    const session = await getRequestSessionUser();

    if (!session?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();

    const updated = await updateUserEmailPreferences(
      organizationId,
      session.id,
      body,
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Failed to update preferences" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      preferences: updated,
    });
  } catch (error) {
    console.error("Error updating email preferences:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
