import { NextResponse } from "next/server";
import { getRequestSessionUser } from "@/lib/server-session";

export async function GET() {
  try {
    const sessionUser = await getRequestSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, authenticated: false, error: "Unauthorized" },
        {
          status: 401,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        authenticated: true,
        session: {
          user: {
            id: sessionUser.id,
            email: sessionUser.email,
            fullName: sessionUser.fullName,
            role: sessionUser.role,
          },
        },
      },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error: unknown) {
    console.error("[check-auth] Failed to validate session", { error });
    return NextResponse.json(
      { success: false, error: "Failed to validate session" },
      { status: 500 },
    );
  }
}
