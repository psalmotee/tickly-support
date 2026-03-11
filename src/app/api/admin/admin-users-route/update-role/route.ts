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

    const { userId, newRole } = await req.json();

    if (!userId || (newRole !== "admin" && newRole !== "user")) {
      return NextResponse.json(
        { success: false, error: "Invalid payload" },
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

    const updateResponse = await manta.updateRecords({
      table: "tickly-auth",
      where: { id: userId },
      data: { role: newRole },
    });

    if (!updateResponse.status) {
      return NextResponse.json(
        { success: false, error: "Failed to update role" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update role";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
