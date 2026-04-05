import { NextResponse } from "next/server";
import { manta } from "@/lib/manta-client";
import { resolveTicketTable } from "@/lib/ticket-table-resolver";
import { isTicketDeletedByAdmin } from "@/lib/ticket-soft-delete";
import { getRequestSessionUser } from "@/lib/server-session";
import { resolvePublicTicketNumber } from "@/lib/ticket-number";
import { sortByCreatedAtDesc } from "@/lib/sort-utils";

function mapTicketRecord(record: Record<string, unknown>) {
  const internalNotes =
    (record.internalNotes as string) ||
    (record.internal_notes as string) ||
    "";

  return {
    id: (record.id as string) || (record._id as string) || "",
    ticketId: resolvePublicTicketNumber(record),
    title: (record.title as string) || "",
    description: (record.description as string) || "",
    priority: (record.priority as string) || "medium",
    status: (record.status as string) || "open",
    userId:
      (record.userId as string) ||
      (record.user_id as string) ||
      "",
    createdAt:
      (record.createdAt as string) ||
      (record.created_at as string) ||
      "",
    updatedAt:
      (record.updatedAt as string) ||
      (record.updated_at as string) ||
      "",
    internalNotes,
    deletedByAdmin: isTicketDeletedByAdmin(internalNotes),
    user: (record.user as Record<string, unknown> | undefined) || null,
  };
}

export async function GET() {
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

    let ticketTable: string;
    try {
      ticketTable = await resolveTicketTable();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Ticket table not accessible";
      console.error("[admin-tickets][GET] resolveTicketTable failed:", message);
      return NextResponse.json(
        { success: false, error: message },
        { status: 500 },
      );
    }

    let response: { data?: unknown[] };
    try {
      response = await manta.fetchAllRecords({
        table: ticketTable,
        orderBy: "createdAt",
        order: "desc",
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch from Manta";
      console.error("[admin-tickets][GET] fetchAllRecords failed:", message);
      return NextResponse.json(
        { success: false, error: `Failed to fetch tickets: ${message}` },
        { status: 500 },
      );
    }

    const mappedTickets = Array.isArray(response.data)
      ? response.data.map((record) =>
          mapTicketRecord(record as Record<string, unknown>),
        )
      : [];

    // Enrich with user display names
    const userIds = Array.from(
      new Set(mappedTickets.map((t) => t.userId).filter(Boolean)),
    );

    const usersById = new Map<string, { fullName: string; email: string }>();

    await Promise.all(
      userIds.map(async (userId) => {
        try {
          let userRes = await manta.fetchAllRecords({
            table: "tickly-auth",
            where: { id: userId },
            list: 1,
          });

          if (!userRes.status || userRes.data.length === 0) {
            userRes = await manta.fetchAllRecords({
              table: "tickly-auth",
              where: { user_id: userId },
              list: 1,
            });
          }

          if (userRes.status && userRes.data.length > 0) {
            const user = userRes.data[0] as {
              fullName?: string;
              fullname?: string;
              email?: string;
            };
            usersById.set(userId, {
              fullName: user.fullName || user.fullname || "Unknown User",
              email: user.email || "",
            });
          }
        } catch {
          // non-fatal
        }
      }),
    );

    const tickets = sortByCreatedAtDesc(
      mappedTickets.map((ticket) => ({
        ...ticket,
        user: usersById.get(ticket.userId) || null,
      })),
    );

    return NextResponse.json({ success: true, tickets });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch tickets";
    console.error("[admin-tickets][GET] Unhandled error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}