import { NextResponse } from "next/server";
import {
  getUserTickets,
  createTicket,
  type TicketRecord,
} from "@/lib/supabase-helpers";
import { getRequestSessionUser } from "@/lib/server-session";
import { validateTicketCreateInput } from "@/lib/ticket-rules";
import { sortByCreatedAtDesc } from "@/lib/sort-utils";

function mapTicketRecord(record: TicketRecord) {
  return {
    id: record.id,
    ticketId: record.id.slice(0, 8).toUpperCase(),
    title: record.title,
    description: record.description,
    priority: record.priority,
    status: record.status,
    userId: record.user_id,
    customerEmail: record.customer_email,
    publicToken: record.public_token,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
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

    // Get user's tickets from Supabase
    const ticketRecords = await getUserTickets(userId);
    const tickets = ticketRecords.map(mapTicketRecord);

    return NextResponse.json({
      success: true,
      tickets: sortByCreatedAtDesc(tickets),
    });
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

    const { title, description, priority, customerEmail } = body as {
      title?: unknown;
      description?: unknown;
      priority?: unknown;
      customerEmail?: unknown;
    };

    const validationError = validateTicketCreateInput({
      title,
      description,
      priority,
      userId: sessionUser.id,
    });
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 },
      );
    }

    // Create ticket in Supabase
    const newTicket = await createTicket({
      title: (title as string).trim(),
      description: (description as string).trim(),
      priority: (priority as string) || "medium",
      status: "open",
      user_id: sessionUser.id,
      customer_email:
        typeof customerEmail === "string" ? customerEmail : sessionUser.email,
      org_id: "00000000-0000-0000-0000-000000000000", // Will be updated to support organizations
      project_id: "00000000-0000-0000-0000-000000000000", // Will be updated
      public_token: Math.random().toString(36).substring(2, 15),
    });

    if (!newTicket) {
      return NextResponse.json(
        { success: false, error: "Failed to create ticket" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      ticket: mapTicketRecord(newTicket),
    });
  } catch (error: unknown) {
    console.error("[tickets][POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create ticket" },
      { status: 500 },
    );
  }
}
