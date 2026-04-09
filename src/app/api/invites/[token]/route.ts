// used
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getRequestSessionUser } from "@/lib/server-session";
import {
  getOrganizationInvite,
  acceptOrganizationInvite,
} from "@/lib/supabase-helpers";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const sessionUser = await getRequestSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { token } = await context.params;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid invite token" },
        { status: 400 },
      );
    }

    // Get the invite to verify it exists and check email
    const invite = await getOrganizationInvite(token);
    if (!invite) {
      return NextResponse.json(
        { success: false, error: "Invite not found or expired" },
        { status: 404 },
      );
    }

    // Check if email matches
    if (invite.email !== sessionUser.email.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: `Invite is for ${invite.email}, but you're logged in as ${sessionUser.email}`,
        },
        { status: 403 },
      );
    }

    // Accept the invite
    const success = await acceptOrganizationInvite(token, sessionUser.id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Failed to accept invite" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Invite accepted successfully. You now have access to this organization.",
    });
  } catch (error: unknown) {
    console.error("[invites][accept] Failed to accept invite", { error });
    return NextResponse.json(
      { success: false, error: "Failed to accept invite" },
      { status: 500 },
    );
  }
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid invite token" },
        { status: 400 },
      );
    }

    // Get the invite to verify it exists
    const invite = await getOrganizationInvite(token);
    if (!invite) {
      return NextResponse.json(
        { success: false, error: "Invite not found or expired" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      invite: {
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expires_at,
      },
    });
  } catch (error: unknown) {
    console.error("[invites][GET] Failed to fetch invite", { error });
    return NextResponse.json(
      { success: false, error: "Failed to fetch invite details" },
      { status: 500 },
    );
  }
}
