import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getTicketById,
  updateTicket,
  getCustomerById,
  getWebsiteById,
} from "@/lib/supabase-helpers";
import { getRequestSessionUser } from "@/lib/server-session";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || "",
);

const VALID_TICKET_PRIORITIES = ["low", "medium", "high", "critical"];

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
    const ticket = await getTicketById(id);

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "Ticket not found" },
        { status: 404 },
      );
    }

    // Check if user owns this ticket or is admin
    if (sessionUser.role !== "admin" && ticket.user_id !== sessionUser.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    // Enrich with customer data
    let customer = null;
    if (ticket.customer_id) {
      customer = await getCustomerById(ticket.customer_id);
    }

    // Enrich with website data
    let website = null;
    if (ticket.website_id) {
      website = await getWebsiteById(ticket.website_id);
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
        internalNotes: ticket.internal_notes,
        customer,
        website,
      },
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
    const ticket = await getTicketById(id);

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "Ticket not found" },
        { status: 404 },
      );
    }

    // Check if user owns this ticket or is admin
    if (sessionUser.role !== "admin" && ticket.user_id !== sessionUser.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    // Validate and extract fields
    const title =
      typeof body.title === "string" ? body.title.trim() : undefined;
    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : undefined;
    const priority =
      typeof body.priority === "string" &&
      VALID_TICKET_PRIORITIES.includes(body.priority)
        ? body.priority
        : undefined;

    if (body.priority !== undefined && !priority) {
      return NextResponse.json(
        { success: false, error: "Invalid priority value" },
        { status: 400 },
      );
    }

    if (
      title === undefined &&
      description === undefined &&
      priority === undefined
    ) {
      return NextResponse.json(
        { success: false, error: "No valid fields provided for update" },
        { status: 400 },
      );
    }

    // Prepare update payload
    const updatePayload: Record<string, any> = {};
    if (title !== undefined) updatePayload.title = title;
    if (description !== undefined) updatePayload.description = description;
    if (priority !== undefined) updatePayload.priority = priority;

    // Update ticket
    const updatedTicket = await updateTicket(id, updatePayload);

    if (!updatedTicket) {
      return NextResponse.json(
        { success: false, error: "Failed to update ticket" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, ticket: updatedTicket });
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
    const ticket = await getTicketById(id);

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "Ticket not found" },
        { status: 404 },
      );
    }

    // Check if user owns this ticket or is admin
    if (sessionUser.role !== "admin" && ticket.user_id !== sessionUser.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    // Soft delete by updating internal notes
    const currentNotes = ticket.internal_notes || "";
    const updatedTicket = await updateTicket(id, {
      internal_notes: currentNotes.includes("[DELETED BY USER]")
        ? currentNotes
        : `[DELETED BY USER] ${currentNotes}`,
      status: "closed",
    });

    if (!updatedTicket) {
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
