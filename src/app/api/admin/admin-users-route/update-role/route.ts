import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getRequestSessionUser } from "@/lib/server-session";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || "",
);

export async function PATCH(req: Request) {
  try {
    const sessionUser = await getRequestSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (sessionUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await req.json().catch((parseError: unknown) => {
      console.error("[admin-users][update-role] Invalid JSON body", {
        parseError,
      });
      return null;
    });

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body. Expected JSON." },
        { status: 400 },
      );
    }

    const { userId, newRole } = body as {
      userId?: unknown;
      newRole?: unknown;
    };

    if (
      typeof userId !== "string" ||
      !userId.trim() ||
      (newRole !== "admin" && newRole !== "user")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid payload. 'userId' and 'newRole' are required.",
        },
        { status: 400 },
      );
    }

    if (sessionUser.id === userId && newRole !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "You cannot remove your own admin role",
        },
        { status: 400 },
      );
    }

    const trimmedUserId = userId.trim();

    // Update user role in Supabase
    const { error } = await supabase
      .from("users")
      .update({ role: newRole })
      .eq("id", trimmedUserId);

    if (error) {
      console.error("[admin-users][update-role] Failed to update role", error);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to update role: ${error.message}`,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update role";
    console.error("[admin-users][update-role] Failed to update role", {
      error,
    });
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
