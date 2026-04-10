import { NextRequest, NextResponse } from "next/server";
import {
  getUserByEmail,
  getOrganizationById,
  getOrganizationMembers,
  createTicket,
  saveTicketCustomFieldValues,
  type TicketRecord,
} from "@/lib/supabase-helpers";
import { supabaseAdmin } from "@/lib/supabase-client";

/**
 * Simple public ticket submission endpoint
 * Does NOT require authenticated session
 * Used for public widget on website
 *
 * POST /api/v1/public/tickets/submit
 * {
 *   "organizationId": "org_xxx",
 *   "name": "Customer Name",
 *   "email": "customer@email.com",
 *   "phone": "+1234567890",
 *   "company": "Company Name",
 *   "title": "Issue Title",
 *   "description": "Issue Description"
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { organizationId, name, email, phone, company, title, description } =
      body;

    // Validate required fields
    if (!organizationId || !name || !email || !title || !description) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: organizationId, name, email, title, description",
        },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email format",
        },
        { status: 400 },
      );
    }

    // Verify organization exists
    const org = await getOrganizationById(organizationId);
    if (!org) {
      return NextResponse.json(
        {
          success: false,
          error: `Organization not found: ${organizationId}. Please check your Organization ID in the admin dashboard (Settings → Organization). It should be a UUID like 'f47ac10b-58cc-4372-a567-0e02b2c3d479'`,
        },
        { status: 404 },
      );
    }

    // Get or create customer
    const { data: existingCustomer } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("email", email.toLowerCase())
      .single();

    let customerId: string;

    if (existingCustomer) {
      customerId = existingCustomer.id;

      // Update customer info if provided
      if (name || phone || company) {
        await supabaseAdmin
          .from("customers")
          .update({
            ...(name && { full_name: name }),
            ...(phone && { phone }),
            ...(company && { company }),
          })
          .eq("id", customerId);
      }
    } else {
      // Create new customer
      const { data: newCustomer, error: customerError } = await supabaseAdmin
        .from("customers")
        .insert({
          organization_id: organizationId,
          email: email.toLowerCase(),
          full_name: name,
          phone: phone || null,
          company: company || null,
        })
        .select("id")
        .single();

      if (customerError || !newCustomer) {
        console.error("Error creating customer:", customerError);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to create customer record",
          },
          { status: 500 },
        );
      }

      customerId = newCustomer.id;
    }

    // Create ticket
    const { data: newTicket, error: ticketError } = await supabaseAdmin
      .from("tickets")
      .insert({
        organization_id: organizationId,
        customer_id: customerId,
        title: title.trim(),
        description: description.trim(),
        status: "new",
        priority: "medium",
        source_channel: "public_widget",
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (ticketError || !newTicket) {
      console.error("Error creating ticket:", ticketError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create ticket",
        },
        { status: 500 },
      );
    }

    // Get ticket number
    const ticketNumber = newTicket.id.split("_").pop() || newTicket.id;

    // Send notifications (if email service is configured)
    try {
      // Send email to customer
      // await sendWidgetTicketConfirmation({...});
      // Send email to team
      // await sendAdminWidgetNotification({...});
    } catch (emailError) {
      console.error("Error sending emails:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      ticketNumber: newTicket.id,
      customerId,
      message: "Ticket created successfully",
    });
  } catch (error) {
    console.error("Widget submit error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while submitting the ticket",
      },
      { status: 500 },
    );
  }
}
