import { NextResponse } from "next/server";
import { manta } from "@/lib/manta-client";
import { resolveTicketTable } from "@/lib/ticket-table-resolver";
import { isTicketDeletedByAdmin } from "@/lib/ticket-soft-delete";
import { getRequestSessionUser } from "@/lib/server-session";
import { resolvePublicTicketNumber } from "@/lib/ticket-number";
import { validateTicketCreateInput } from "@/lib/ticket-rules";
import { sortByCreatedAtDesc } from "@/lib/sort-utils";
import {
  buildTicket,
  buildInsertCorrelationToken,
  extractCorrelationToken,
  stripCorrelationToken,
} from "@/lib/ticket-builder";

function mapTicketRecord(record: Record<string, unknown>) {
  const internalNotes =
    (record.internalNotes as string) || (record.internal_notes as string) || "";

  return {
    id: (record.id as string) || (record._id as string) || "",
    ticketId: resolvePublicTicketNumber(record),
    title: (record.title as string) || "",
    description: (record.description as string) || "",
    priority: (record.priority as string) || "medium",
    status: (record.status as string) || "open",
    userId: (record.userId as string) || (record.user_id as string) || "",
   
    createdAt:
      (record.createdAt as string) || (record.created_at as string) || "",
    updatedAt:
      (record.updatedAt as string) || (record.updated_at as string) || "",
    internalNotes,
    deletedByAdmin: isTicketDeletedByAdmin(internalNotes),
  };
}

async function resolveExistingUserId(sessionUser: {
  id: string;
  email: string;
}): Promise<string | null> {
  const candidates: Array<Record<string, string>> = [
    { id: sessionUser.id },
    { user_id: sessionUser.id },
    { email: sessionUser.email },
  ];

  for (const where of candidates) {
    try {
      const res = await manta.fetchAllRecords({
        table: "tickly-auth",
        where,
        list: 1,
      });
      if (res.status && res.data.length > 0) {
        const user = res.data[0] as Record<string, unknown>;
        return (
          (user.id as string) || (user.user_id as string) || sessionUser.id
        );
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

async function findRecordByCorrelationToken(
  ticketTable: string,
  correlationToken: string,
  userId: string,
): Promise<Record<string, unknown> | null> {

  for (const field of ["user_id", "userId"]) {
    try {
      const response = await manta.fetchAllRecords({
        table: ticketTable,
        where: { [field]: userId },
        orderBy: "createdAt",
        order: "desc",
        list: 20,
      });

      if (!Array.isArray(response.data)) continue;

      const match = response.data.find((raw) => {
        const record = raw as Record<string, unknown>;
        const notes =
          (record.internal_notes as string) ||
          (record.internalNotes as string) ||
          "";
        return extractCorrelationToken(notes) === correlationToken;
      });

      if (match) return match as Record<string, unknown>;
    } catch {
      // try next field
    }
  }
  return null;
}

export async function GET(req: Request) {
  try {
    const sessionUser = await getRequestSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 },
      );
    }

    if (sessionUser.role !== "admin" && sessionUser.id !== userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const ticketTable = await resolveTicketTable();
    const mergedTickets = new Map<string, ReturnType<typeof mapTicketRecord>>();

    // Try both field name variants — Manta reads with user_id but
    // some SDK versions may index differently
    for (const field of ["user_id", "userId"]) {
      try {
        const response = await manta.fetchAllRecords({
          table: ticketTable,
          where: { [field]: userId },
          orderBy: "createdAt",
          order: "desc",
        });

        if (Array.isArray(response.data)) {
          for (const record of response.data) {
            const mapped = mapTicketRecord(record as Record<string, unknown>);
            mergedTickets.set(mapped.id || JSON.stringify(record), mapped);
          }
        }
      } catch {
        // try next field
      }
    }

    const tickets = sortByCreatedAtDesc(Array.from(mergedTickets.values()));
    return NextResponse.json({ success: true, tickets });
  } catch (error: unknown) {
    console.error("[tickets][GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tickets" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const sessionUser = await getRequestSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body." },
        { status: 400 },
      );
    }

    const { title, description, priority } = body as {
      title?: unknown;
      description?: unknown;
      priority?: unknown;
    };

    const resolvedUserId = await resolveExistingUserId(sessionUser);
    if (!resolvedUserId) {
      return NextResponse.json(
        { success: false, error: "Authenticated user profile was not found." },
        { status: 400 },
      );
    }

    const validationError = validateTicketCreateInput({
      title,
      description,
      priority,
      userId: resolvedUserId,
    });
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 },
      );
    }

    const ticketTable = await resolveTicketTable();

    const payload = buildTicket({
      title: (title as string).trim(),
      description: (description as string).trim(),
      priority: priority as "low" | "medium" | "high",
      userId: resolvedUserId,
    });

    const correlationToken = buildInsertCorrelationToken();
    const payloadWithToken: Record<string, unknown> = {
      ...payload,
      internalNotes: correlationToken,
    };

    type CreateResult = {
      success?: boolean;
      status?: boolean;
      message?: string;
    };

    let createResult: CreateResult | null = null;

    try {
      createResult = (await manta.createRecords({
        table: ticketTable,
        data: [payloadWithToken],
      })) as CreateResult;
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create ticket";
      console.error("[tickets][POST] createRecords threw:", msg);
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }

    const succeeded =
      Boolean(createResult?.success) ||
      Boolean(createResult?.status) ||
      (typeof createResult?.message === "string" &&
        createResult.message.toLowerCase().includes("successfully processed"));

    if (!succeeded) {
      const msg = createResult?.message ?? "Failed to create ticket";
      console.error("[tickets][POST] createRecords did not succeed:", msg);
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }

    const createdRecord = await findRecordByCorrelationToken(
      ticketTable,
      correlationToken,
      resolvedUserId,
    );

    if (!createdRecord) {
      console.warn(
        "[tickets][POST] Record created but not found via correlation token",
      );
      return NextResponse.json({
        success: true,
        ticket: mapTicketRecord(
          payloadWithToken as unknown as Record<string, unknown>,
        ),
      });
    }

    const recordId =
      (createdRecord.id as string) || (createdRecord._id as string) || "";

    const cleanNotes = stripCorrelationToken(
      (createdRecord.internal_notes as string) ||
        (createdRecord.internalNotes as string) ||
        "",
    );

    const now = new Date().toISOString();

    if (recordId) {
      try {
        await manta.updateRecords({
          table: ticketTable,
          where: { id: recordId },
          data: {
            internalNotes: cleanNotes,
            createdAt: now,
            updatedAt: now,
          },
        });
      } catch (updateErr) {
        
        console.warn(
          "[tickets][POST] Follow-up update failed:",
          updateErr instanceof Error ? updateErr.message : updateErr,
        );
      }
    }

    return NextResponse.json({
      success: true,
      ticket: mapTicketRecord({
        ...createdRecord,
        
        ticket_id: payload.ticketId,
        internal_notes: cleanNotes,
        createdAt: now,
        updatedAt: now,
      }),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create ticket";
    console.error("[tickets][POST] Unhandled error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
