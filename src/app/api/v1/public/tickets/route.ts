// used
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  createTicket,
  createOrUpdateCustomer,
  getWebsiteByToken,
} from "@/lib/supabase-helpers";

interface PublicTicketRequest {
  widget_token?: string;
  email: string;
  name: string;
  message: string;
  phone?: string;
  company_name?: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { widget_token, email, name, message, phone, company_name } =
      body as PublicTicketRequest;

    // Validate required fields
    if (!email || !name || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: email, name, message",
        },
        { status: 400 },
      );
    }

    // Get website from widget token
    if (!widget_token) {
      return NextResponse.json(
        { success: false, error: "widget_token is required" },
        { status: 400 },
      );
    }

    const website = await getWebsiteByToken(widget_token);
    if (!website) {
      return NextResponse.json(
        { success: false, error: "Invalid widget token" },
        { status: 401 },
      );
    }

    const organizationId = website.organization_id;

    // Create or update customer
    const customer = await createOrUpdateCustomer(organizationId, email, {
      full_name: name,
      phone: phone || null,
      company_name: company_name || null,
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Failed to create/update customer" },
        { status: 500 },
      );
    }

    // Create ticket
    const publicToken = randomUUID();
    const newTicket = await createTicket({
      title: message.split("\n")[0].substring(0, 100),
      description: message,
      priority: "medium",
      status: "open",
      organization_id: organizationId,
      website_id: website.id,
      customer_id: customer.id,
      customer_email: customer.email,
      source_channel: "widget",
      user_id: null, // No user for public submissions
      project_id: null,
      category_id: null,
      rating: null,
      public_token: publicToken,
      customer_name: customer.full_name,
      customer_phone: customer.phone,
      company_name: customer.company_name,
      category: null,
      internal_notes: "",
      resolved_at: null,
    });

    if (!newTicket) {
      return NextResponse.json(
        { success: false, error: "Failed to create ticket" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      ticket: {
        id: newTicket.id,
        publicToken: publicToken,
        email: customer.email,
        name: customer.full_name,
      },
    });
  } catch (error: unknown) {
    console.error("[v1/public/tickets][POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create ticket" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/v1/public/tickets?token={public_token}
 * Public endpoint to view ticket details
 * No authentication required
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const publicToken = searchParams.get("token");

    if (!publicToken) {
      return NextResponse.json(
        { success: false, error: "Public token is required" },
        { status: 400 },
      );
    }

    // For now, just return a placeholder
    // The actual implementation would fetch from DB using public_token
    // and validate it's publicly accessible

    return NextResponse.json({
      success: true,
      message: "Use POST endpoint to create tickets",
    });
  } catch (error: unknown) {
    console.error("[v1/public/tickets][GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch ticket" },
      { status: 500 },
    );
  }
}
