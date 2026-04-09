// used
import { NextRequest, NextResponse } from "next/server";
import { getUserOrganizations } from "@/lib/supabase-helpers";
import { supabase } from "@/lib/supabase-client";

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const cookieStore = await import("next/headers").then((mod) =>
      mod.cookies(),
    );
    const sessionCookie = (await cookieStore).get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse session to get user ID (in real app, validate the session)
    // For now, we'll get it from the auth check
    const response = await fetch(`${request.nextUrl.origin}/api/check-auth`, {
      headers: {
        cookie: `session=${sessionCookie}`,
      },
    });

    const authData = (await response.json()) as any;

    if (!authData.session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizations = await getUserOrganizations(authData.session.user.id);

    return NextResponse.json({
      success: true,
      organizations,
      count: organizations.length,
    });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
