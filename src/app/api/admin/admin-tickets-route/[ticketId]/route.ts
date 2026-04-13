import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-client";
import { getRequestSessionUser } from "@/lib/server-session";
import {
  getCustomerById,
  getWebsiteById,
  type TicketRecord,
} from "@/lib/supabase-helpers";

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

    // Fetch ticket using supabaseAdmin to bypass RLS
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from("support_tickets")
      .select("*")
      .eq("id", ticketId)
      .single();

    if (ticketError || !ticket) {
      console.error(
        "[admin-tickets][GET] Ticket not found:",
        ticketId,
        ticketError,
      );
      return NextResponse.json(
        { success: false, error: "Ticket not found" },
        { status: 404 },
      );
    }

    // Fetch user data if ticket has a user_id
    let user = null;
    if (ticket.user_id) {
      const { data: userData } = await supabaseAdmin
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

    // Fetch customer data
    let customer = null;
    if (ticket.customer_id) {
      customer = await getCustomerById(ticket.customer_id);
      if (customer) {
        customer = {
          email: customer.email,
          fullName: customer.full_name,
          phone: customer.phone,
          companyName: customer.company_name,
        };
      }
    }

    // Fetch website data
    let website = null;
    if (ticket.website_id) {
      website = await getWebsiteById(ticket.website_id);
      if (website) {
        website = {
          domain: website.domain,
          name: website.name,
          id: website.id,
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
        customerId: ticket.customer_id,
        websiteId: ticket.website_id,
        sourceChannel: ticket.source_channel,
        categoryId: ticket.category_id,
        rating: ticket.rating,
        publicToken: ticket.public_token,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
        resolvedAt: ticket.resolved_at,
        internalNotes: ticket.internal_notes || "",
        user,
        customer,
        website,
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

    // Update ticket internal notes (use supabaseAdmin to bypass RLS)
    const { error } = await supabaseAdmin
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

    const { status, softDelete, rating, internalNotes, categoryId } = body as {
      status?: string;
      softDelete?: boolean;
      rating?: number;
      internalNotes?: string;
      categoryId?: string | null;
    };

    // Fetch current ticket using supabaseAdmin to bypass RLS
    console.log("[admin-tickets][PATCH] Fetching ticket:", ticketId);
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from("support_tickets")
      .select("*")
      .eq("id", ticketId)
      .single();

    if (ticketError || !ticket) {
      console.error(
        "[admin-tickets][PATCH] Ticket not found:",
        ticketId,
        ticketError,
      );
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
      // Set resolved_at when marking as resolved
      if (status.toLowerCase() === "resolved") {
        updatePayload.resolved_at = new Date().toISOString();
      }
    }

    if (softDelete) {
      const currentNotes = ticket.internal_notes || "";
      updatePayload.internal_notes = currentNotes.includes("[DELETED BY ADMIN]")
        ? currentNotes
        : `[DELETED BY ADMIN] ${currentNotes}`;
    }

    if (typeof rating === "number" && rating >= 0 && rating <= 5) {
      updatePayload.rating = rating;
    }

    if (typeof internalNotes === "string") {
      updatePayload.internal_notes = internalNotes;
    }

    if (categoryId !== undefined) {
      updatePayload.category_id = categoryId;
    }

    // Update ticket using supabaseAdmin to bypass RLS
    console.log(
      "[admin-tickets][PATCH] Updating ticket with payload:",
      updatePayload,
    );
    const { data: updatedTicket, error: updateError } = await supabaseAdmin
      .from("support_tickets")
      .update(updatePayload)
      .eq("id", ticketId)
      .select()
      .single();

    if (updateError || !updatedTicket) {
      console.error(
        "[admin-tickets][PATCH] Failed to update ticket:",
        updateError,
      );
      return NextResponse.json(
        { success: false, error: "Failed to update ticket" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, ticket: updatedTicket });
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
