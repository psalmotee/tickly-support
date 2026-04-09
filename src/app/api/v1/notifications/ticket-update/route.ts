// used
import { NextRequest, NextResponse } from "next/server";
import {
  getTicketById,
  getCustomerById,
  getOrganizationById,
} from "@/lib/supabase-helpers";
import { sendTicketStatusUpdate } from "@/lib/email-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketId, newStatus } = body;

    if (!ticketId || !newStatus) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get ticket
    const ticket = await getTicketById(ticketId);
    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Ticket not found" },
        { status: 404 },
      );
    }

    // Get customer if exists
    if (ticket.customer_id) {
      const customer = await getCustomerById(ticket.customer_id);
      if (customer) {
        const org = await getOrganizationById(ticket.organization_id);
        if (org) {
          await sendTicketStatusUpdate(
            ticket,
            { name: customer.full_name, email: customer.email },
            newStatus,
            { name: org.name },
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending ticket update email:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send email" },
      { status: 500 },
    );
  }
}
