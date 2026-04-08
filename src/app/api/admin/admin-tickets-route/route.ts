import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getRequestSessionUser } from "@/lib/server-session";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || "",
);

function mapTicketRecord(
  ticket: Record<string, any>,
  user: { full_name: string; email: string } | null,
) {
  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    priority: ticket.priority || "medium",
    status: ticket.status || "open",
    userId: ticket.user_id || "",
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
    internalNotes: ticket.internal_notes || "",
    user: user
      ? {
          fullName: user.full_name,
          email: user.email,
        }
      : null,
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

    // Fetch all tickets from Supabase
    const { data: tickets, error: ticketsError } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (ticketsError) {
      console.error(
        "[admin-tickets][GET] Error fetching tickets:",
        ticketsError,
      );
      return NextResponse.json(
        { success: false, error: ticketsError.message },
        { status: 500 },
      );
    }

    // Get unique user IDs from tickets
    const userIds = Array.from(
      new Set((tickets || []).map((t: any) => t.user_id).filter(Boolean)),
    );

    // Fetch user data
    const usersById = new Map<string, { full_name: string; email: string }>();

    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, full_name, email")
        .in("id", userIds);

      if (usersError) {
        console.error("[admin-tickets][GET] Error fetching users:", usersError);
        // Continue without user enrichment
      } else if (users) {
        users.forEach((user: any) => {
          usersById.set(user.id, {
            full_name: user.full_name || "Unknown User",
            email: user.email,
          });
        });
      }
    }

    const mappedTickets = (tickets || []).map((ticket: any) =>
      mapTicketRecord(ticket, usersById.get(ticket.user_id) || null),
    );

    return NextResponse.json({
      success: true,
      tickets: mappedTickets.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    });
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
