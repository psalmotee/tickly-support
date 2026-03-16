import { NextResponse } from "next/server";
import { manta } from "@/lib/manta-client";
import { getRequestSessionUser } from "@/lib/server-session";

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
    const whereCandidates: Array<Record<string, string>> = [
      { id: trimmedUserId },
      { user_id: trimmedUserId },
      { _id: trimmedUserId },
    ];

    const dataCandidates: Array<Record<string, string>> = [
      { role: newRole },
      { user_role: newRole },
      { userRole: newRole },
    ];

    let updated = false;
    let lastError = "Failed to update role";

    for (const where of whereCandidates) {
      for (const data of dataCandidates) {
        try {
          const updateResponse = await manta.updateRecords({
            table: "tickly-auth",
            where,
            data,
          });

          if (updateResponse.status) {
            updated = true;
            break;
          }

          lastError =
            (updateResponse as { message?: string }).message || lastError;
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : "Failed to update role";
          lastError = message;

          if (!message.toLowerCase().includes("unknown field")) {
            continue;
          }
        }
      }

      if (updated) {
        break;
      }
    }

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          error:
            lastError ||
            "Failed to update role. Verify tickly-auth table ID and role column names.",
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
