import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { manta } from "@/lib/manta-client";
import { resolveTicketTable } from "@/lib/ticket-table-resolver";
import { markTicketDeletedByAdmin } from "@/lib/ticket-soft-delete";
import { getRequestSessionUser } from "@/lib/server-session";
import {
  canTransitionStatus,
  normalizeIncomingStatus,
} from "@/lib/ticket-rules";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ ticketId: string }> },
) {
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

    const { ticketId } = await context.params;
    const ticketTable = await resolveTicketTable();

    let ticket: ({ userId?: string } & Record<string, unknown>) | null = null;
    const whereCandidates: Array<Record<string, string>> = [
      { id: ticketId },
      { ticket_id: ticketId },
    ];

    for (const where of whereCandidates) {
      const response = await manta.fetchAllRecords({
        table: ticketTable,
        where,
        list: 1,
      });

      if (response.status && response.data.length > 0) {
        ticket = response.data[0] as { userId?: string } & Record<
          string,
          unknown
        >;
        break;
      }
    }

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "Ticket not found" },
        { status: 404 },
      );
    }

    const ticketUserId =
      (ticket.userId as string) ||
      (ticket.user_id as string) ||
      (ticket.userid as string) ||
      undefined;

    ticket.userId = ticketUserId;
    ticket.ticketId =
      (ticket.ticket_id as string) ||
      (ticket.ticketId as string) ||
      (ticket.id as string) ||
      ticketId;
    ticket.createdAt =
      (ticket.createdAt as string) || (ticket.created_at as string) || "";
    ticket.updatedAt =
      (ticket.updatedAt as string) ||
      (ticket.updated_at as string) ||
      (ticket.createdAt as string);
    ticket.internalNotes =
      (ticket.internalNotes as string) ||
      (ticket.internal_notes as string) ||
      "";

    if (ticketUserId) {
      const userRes = await manta.fetchAllRecords({
        table: "tickly-auth",
        where: { id: ticketUserId },
        list: 1,
      });

      if (userRes.status && userRes.data.length > 0) {
        const user = userRes.data[0] as {
          fullname?: string;
          fullName?: string;
          email?: string;
          role?: string;
        };

        ticket.users = {
          fullName: user.fullName || user.fullname || "Unknown User",
          email: user.email || "",
          role: user.role || "user",
        };
      }
    }

    return NextResponse.json({ success: true, ticket });
  } catch (error: unknown) {
    console.error("[admin-tickets][GET] Failed to fetch ticket", { error });
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ ticketId: string }> },
) {
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

    const { note } = await req.json();
    if (typeof note !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid note payload" },
        { status: 400 },
      );
    }

    const { ticketId } = await context.params;
    const ticketTable = await resolveTicketTable();

    const updateCandidates: Array<Record<string, unknown>> = [
      { internal_notes: note, updated_at: new Date().toISOString() },
      { internal_notes: note, updatedAt: new Date().toISOString() },
      { internalNotes: note },
      { internal_notes: note },
    ];

    let updated = false;

    for (const candidate of updateCandidates) {
      try {
        const result = await manta.updateRecords({
          table: ticketTable,
          where: { id: ticketId },
          data: candidate,
        });

        if (result.status) {
          updated = true;
          break;
        }
      } catch {}
    }

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to save note" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[admin-tickets][POST] Failed to save note", { error });
    return NextResponse.json(
      { success: false, error: "Failed to save note" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ ticketId: string }> },
) {
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

    const { ticketId } = await context.params;
    const { status, softDelete } = (await req.json()) as {
      status?: "open" | "in-progress" | "closed";
      softDelete?: boolean;
    };

    const ticketTable = await resolveTicketTable();

    const whereCandidates: Array<Record<string, string>> = [
      { id: ticketId },
      { ticket_id: ticketId },
    ];

    let existingTicket: Record<string, unknown> | null = null;

    for (const where of whereCandidates) {
      const ticketRes = await manta.fetchAllRecords({
        table: ticketTable,
        where,
        list: 1,
      });

      if (ticketRes.status && ticketRes.data.length > 0) {
        existingTicket = ticketRes.data[0] as Record<string, unknown>;
        break;
      }
    }

    if (!existingTicket) {
      return NextResponse.json(
        { success: false, error: "Ticket not found" },
        { status: 404 },
      );
    }
    const existingNotes =
      (existingTicket.internal_notes as string) ||
      (existingTicket.internalNotes as string) ||
      "";

    const currentStatus =
      normalizeIncomingStatus(existingTicket.status) || "open";
    const normalizedRequestedStatus =
      status === undefined ? undefined : normalizeIncomingStatus(status);

    if (status !== undefined && !normalizedRequestedStatus) {
      return NextResponse.json(
        { success: false, error: "Invalid status value" },
        { status: 400 },
      );
    }

    if (
      normalizedRequestedStatus &&
      !canTransitionStatus(currentStatus, normalizedRequestedStatus)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status transition: ${currentStatus} -> ${normalizedRequestedStatus}`,
        },
        { status: 400 },
      );
    }

    const statusCandidates = status
      ? Array.from(
          new Set([
            normalizedRequestedStatus,
            normalizedRequestedStatus === "in-progress"
              ? "in_progress"
              : normalizedRequestedStatus,
            normalizedRequestedStatus === "closed"
              ? "resolved"
              : normalizedRequestedStatus,
          ]),
        )
      : [undefined];

    const notesValue = softDelete
      ? markTicketDeletedByAdmin(existingNotes)
      : undefined;

    const payloadCandidates: Record<string, unknown>[] = [];

    for (const statusValue of statusCandidates) {
      payloadCandidates.push({
        ...(statusValue ? { status: statusValue } : {}),
        ...(notesValue !== undefined ? { internal_notes: notesValue } : {}),
        updated_at: new Date().toISOString(),
      });
      payloadCandidates.push({
        ...(statusValue ? { status: statusValue } : {}),
        ...(notesValue !== undefined ? { internal_notes: notesValue } : {}),
        updatedAt: new Date().toISOString(),
      });
      payloadCandidates.push({
        ...(statusValue ? { status: statusValue } : {}),
        ...(notesValue !== undefined ? { internalNotes: notesValue } : {}),
      });
      payloadCandidates.push({
        ...(statusValue ? { status: statusValue } : {}),
        ...(notesValue !== undefined ? { internal_notes: notesValue } : {}),
      });
    }

    let updated = false;
    let lastError = "Failed to update ticket";

    for (const candidate of payloadCandidates) {
      if (Object.keys(candidate).length === 0) continue;

      try {
        const result = await manta.updateRecords({
          table: ticketTable,
          where:
            existingTicket.id && typeof existingTicket.id === "string"
              ? { id: existingTicket.id }
              : { ticket_id: ticketId },
          data: candidate,
        });

        if (result.status) {
          updated = true;
          break;
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Failed to update ticket";
        lastError = message;

        if (!message.includes("Unknown field")) {
          break;
        }
      }
    }

    if (!updated) {
      return NextResponse.json(
        { success: false, error: lastError },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update ticket";
    console.error("[admin-tickets][PATCH] Failed to update ticket", { error });
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
