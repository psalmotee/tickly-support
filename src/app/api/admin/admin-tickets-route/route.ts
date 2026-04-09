import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getRequestSessionUser } from "@/lib/server-session";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || "",
);

interface EnrichedTicket {
  id: string;
  title: string;
  description: string;
  priority?: string;
  status?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  internalNotes?: string;
  user?: { fullName: string; email: string } | null;
  customer?: { email: string; fullName: string } | null;
  website?: { domain: string; name: string } | null;
}

function mapTicketRecord(
  ticket: Record<string, any>,
  user: { full_name: string; email: string } | null,
  customer: { email: string; fullName: string } | null,
  website: { domain: string; name: string } | null,
): EnrichedTicket {
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
    customer: customer,
    website: website,
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
    // Note: For now, fetching all. Later can filter by organization using sessionUser's org
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

    // Get unique user IDs and customer IDs from tickets
    const userIds = Array.from(
      new Set((tickets || []).map((t: any) => t.user_id).filter(Boolean)),
    );
    const customerIds = Array.from(
      new Set((tickets || []).map((t: any) => t.customer_id).filter(Boolean)),
    );
    const websiteIds = Array.from(
      new Set((tickets || []).map((t: any) => t.website_id).filter(Boolean)),
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

    // Fetch customer data
    const customersById = new Map<
      string,
      { email: string; fullName: string }
    >();

    if (customerIds.length > 0) {
      const { data: customers, error: customersError } = await supabase
        .from("customers")
        .select("id, email, full_name")
        .in("id", customerIds);

      if (customersError) {
        console.error(
          "[admin-tickets][GET] Error fetching customers:",
          customersError,
        );
        // Continue without customer enrichment
      } else if (customers) {
        customers.forEach((customer: any) => {
          customersById.set(customer.id, {
            email: customer.email,
            fullName: customer.full_name,
          });
        });
      }
    }

    // Fetch website data
    const websitesById = new Map<string, { domain: string; name: string }>();

    if (websiteIds.length > 0) {
      const { data: websites, error: websitesError } = await supabase
        .from("websites")
        .select("id, domain, name")
        .in("id", websiteIds);

      if (websitesError) {
        console.error(
          "[admin-tickets][GET] Error fetching websites:",
          websitesError,
        );
        // Continue without website enrichment
      } else if (websites) {
        websites.forEach((website: any) => {
          websitesById.set(website.id, {
            domain: website.domain,
            name: website.name,
          });
        });
      }
    }

    const mappedTickets = (tickets || []).map((ticket: any) =>
      mapTicketRecord(
        ticket,
        usersById.get(ticket.user_id) || null,
        ticket.customer_id
          ? customersById.get(ticket.customer_id) || null
          : null,
        ticket.website_id ? websitesById.get(ticket.website_id) || null : null,
      ),
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
