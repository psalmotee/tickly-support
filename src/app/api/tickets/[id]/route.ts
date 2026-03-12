import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { manta } from "@/lib/manta-client";
import { resolveTicketTable } from "@/lib/ticket-table-resolver";
import { getRequestSessionUser } from "@/lib/server-session";
import { resolvePublicTicketNumber } from "@/lib/ticket-number";
import {
  normalizeIncomingStatus,
  VALID_TICKET_PRIORITIES,
} from "@/lib/ticket-rules";

function mapTicketRecord(record: Record<string, unknown>) {
  const ticketId = resolvePublicTicketNumber(record);

  return {
    id: (record.id as string) || (record._id as string) || ticketId,
    ticketId,
    title: (record.title as string) || "",
    description: (record.description as string) || "",
    priority: (record.priority as string) || "medium",
    status: (record.status as string) || "open",
    userId:
      (record.userId as string) ||
      (record.user_id as string) ||
      (record.userid as string) ||
      "",
    createdAt:
      (record.createdAt as string) || (record.created_at as string) || "",
    updatedAt:
      (record.updatedAt as string) ||
      (record.updated_at as string) ||
      (record.createdAt as string) ||
      (record.created_at as string) ||
      "",
  };
}

async function findTicketById(ticketTable: string, id: string) {
  const whereCandidates: Array<Record<string, string>> = [
    { id },
    { ticket_id: id },
  ];

  for (const where of whereCandidates) {
    const response = await manta.fetchAllRecords({
      table: ticketTable,
      where,
      list: 1,
    });

    if (response.status && response.data.length > 0) {
      return response.data[0] as Record<string, unknown>;
    }
  }

  return null;
}

function isOwnerOrAdmin(
  sessionUserId: string,
  sessionRole: string,
  ticket: Record<string, unknown>,
) {
  const ticketOwnerId =
    (ticket.user_id as string) ||
    (ticket.userId as string) ||
    (ticket.userid as string) ||
    "";

  return sessionRole === "admin" || ticketOwnerId === sessionUserId;
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const sessionUser = await getRequestSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const ticketTable = await resolveTicketTable();
    const ticket = await findTicketById(ticketTable, id);

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "Ticket not found" },
        { status: 404 },
      );
    }

    if (!isOwnerOrAdmin(sessionUser.id, sessionUser.role, ticket)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      ticket: mapTicketRecord(ticket),
    });
  } catch (error: unknown) {
    console.error("[tickets][id][GET] Failed to fetch ticket", { error });
    return NextResponse.json(
      { success: false, error: "Failed to fetch ticket" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const sessionUser = await getRequestSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json().catch((parseError: unknown) => {
      console.error("[tickets][id][PATCH] Invalid JSON body", { parseError });
      return null;
    });

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body. Expected JSON." },
        { status: 400 },
      );
    }

    const { id } = await context.params;
    const ticketTable = await resolveTicketTable();
    const ticket = await findTicketById(ticketTable, id);

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "Ticket not found" },
        { status: 404 },
      );
    }

    if (!isOwnerOrAdmin(sessionUser.id, sessionUser.role, ticket)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const title =
      typeof body.title === "string" ? body.title.trim() : undefined;
    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : undefined;
    const status = normalizeIncomingStatus(body.status);
    const priority =
      typeof body.priority === "string" &&
      (VALID_TICKET_PRIORITIES as readonly string[]).includes(body.priority)
        ? body.priority
        : undefined;

    if (body.status !== undefined && !status) {
      return NextResponse.json(
        { success: false, error: "Invalid status value" },
        { status: 400 },
      );
    }

    if (body.priority !== undefined && !priority) {
      return NextResponse.json(
        { success: false, error: "Invalid priority value" },
        { status: 400 },
      );
    }

    if (
      title === undefined &&
      description === undefined &&
      status === undefined &&
      priority === undefined
    ) {
      return NextResponse.json(
        { success: false, error: "No valid fields provided for update" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const updateCandidates: Array<Record<string, unknown>> = [
      {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(priority !== undefined ? { priority } : {}),
        updated_at: now,
      },
      {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(priority !== undefined ? { priority } : {}),
        updatedAt: now,
      },
    ];

    const where =
      typeof ticket.id === "string" && ticket.id
        ? { id: ticket.id }
        : { ticket_id: id };

    let updated = false;
    let lastError = "Failed to update ticket";

    for (const data of updateCandidates) {
      try {
        const response = await manta.updateRecords({
          table: ticketTable,
          where,
          data,
        });

        if (response.status) {
          updated = true;
          break;
        }
      } catch (error: unknown) {
        lastError = error instanceof Error ? error.message : lastError;

        if (!lastError.includes("Unknown field")) {
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
    console.error("[tickets][id][PATCH] Failed to update ticket", { error });
    return NextResponse.json(
      { success: false, error: "Failed to update ticket" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const sessionUser = await getRequestSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const ticketTable = await resolveTicketTable();
    const ticket = await findTicketById(ticketTable, id);

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "Ticket not found" },
        { status: 404 },
      );
    }

    if (!isOwnerOrAdmin(sessionUser.id, sessionUser.role, ticket)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const where =
      typeof ticket.id === "string" && ticket.id
        ? { id: ticket.id }
        : { ticket_id: id };

    const deleted = await manta.deleteRecords({
      table: ticketTable,
      where,
    });

    if (!deleted.status) {
      return NextResponse.json(
        { success: false, error: "Failed to delete ticket" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[tickets][id][DELETE] Failed to delete ticket", { error });
    return NextResponse.json(
      { success: false, error: "Failed to delete ticket" },
      { status: 500 },
    );
  }
}
