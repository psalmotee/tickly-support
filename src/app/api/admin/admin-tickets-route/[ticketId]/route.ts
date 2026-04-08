import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getRequestSessionUser } from "@/lib/server-session";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || "",
);

const VALID_STATUSES = ["open", "in_progress", "resolved", "closed"];

function canTransitionStatus(
  currentStatus: string,
  newStatus: string,
): boolean {
  const transitions: Record<string, string[]> = {
    open: ["in_progress", "resolved", "closed"],
    in_progress: ["open", "resolved", "closed"],
    resolved: ["open", "in_progress"],
    closed: ["open"],
  };

  return transitions[currentStatus]?.includes(newStatus) ?? false;
}

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

    // Fetch ticket from Supabase
    const { data: ticket, error: ticketError } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("id", ticketId)
      .single();

    if (ticketError || !ticket) {
      console.error("[admin-tickets][GET] Error fetching ticket:", ticketError);
      return NextResponse.json(
        { success: false, error: "Ticket not found" },
        { status: 404 },
      );
    }

    // Fetch user data if ticket has a user_id
    let user = null;
    if (ticket.user_id) {
      const { data: userData } = await supabase
        .from("users")
        .select("id, full_name, email, role")
        .eq("id", ticket.user_id)
        .single();

      if (userData) {
        user = {
          fullName: userData.full_name,
          email: userData.email,
          role: userData.role,
        };
      }
    }

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        status: ticket.status,
        userId: ticket.user_id,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
        internalNotes: ticket.internal_notes || "",
        user,
      },
    });
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

    // Update ticket internal notes
    const { error } = await supabase
      .from("support_tickets")
      .update({
        internal_notes: note,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticketId);

    if (error) {
      console.error("[admin-tickets][POST] Failed to save note", error);
      return NextResponse.json(
        { success: false, error: "Failed to save note" },
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
    const body = await req.json().catch((parseError: unknown) => {
      console.error("[admin-tickets][PATCH] Invalid JSON body", {
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

    const { status, softDelete } = body as {
      status?: string;
      softDelete?: boolean;
    };

    // Fetch current ticket
    const { data: ticket, error: fetchError } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("id", ticketId)
      .single();

    if (fetchError || !ticket) {
      return NextResponse.json(
        { success: false, error: "Ticket not found" },
        { status: 404 },
      );
    }

    const currentStatus = ticket.status || "open";

    // Check status transition if provided
    if (status) {
      const normalizedStatus = status.toLowerCase();

      if (!VALID_STATUSES.includes(normalizedStatus)) {
        return NextResponse.json(
          { success: false, error: "Invalid status value" },
          { status: 400 },
        );
      }

      if (!canTransitionStatus(currentStatus, normalizedStatus)) {
        const transitions: Record<string, string[]> = {
          open: ["in_progress", "resolved", "closed"],
          in_progress: ["open", "resolved", "closed"],
          resolved: ["open", "in_progress"],
          closed: ["open"],
        };
        const allowed = transitions[currentStatus] || [];
        return NextResponse.json(
          {
            success: false,
            error: `Invalid status transition: ${currentStatus} -> ${normalizedStatus}. Allowed: ${allowed.join(", ") || "none"}`,
          },
          { status: 400 },
        );
      }
    }

    // Prepare update payload
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updatePayload.status = status.toLowerCase();
    }

    if (softDelete) {
      const currentNotes = ticket.internal_notes || "";
      updatePayload.internal_notes = currentNotes.includes("[DELETED BY ADMIN]")
        ? currentNotes
        : `[DELETED BY ADMIN] ${currentNotes}`;
    }

    // Update ticket
    const { error } = await supabase
      .from("support_tickets")
      .update(updatePayload)
      .eq("id", ticketId);

    if (error) {
      console.error("[admin-tickets][PATCH] Failed to update ticket", error);
      return NextResponse.json(
        { success: false, error: "Failed to update ticket" },
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
