// used
import { NextRequest, NextResponse } from "next/server";
import {
  getTicketById,
  getUserById,
  getOrganizationById,
} from "@/lib/supabase-helpers";
import { sendTicketAssignment } from "@/lib/email-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketId, userId } = body;

    if (!ticketId || !userId) {
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

    // Get assigned user
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    // Get organization
    const org = await getOrganizationById(ticket.organization_id);
    if (!org) {
      return NextResponse.json(
        { success: false, message: "Organization not found" },
        { status: 404 },
      );
    }

    // Send assignment email (don't fail if email fails)
    try {
      await sendTicketAssignment(ticket, user, org);
    } catch (emailError) {
      console.error("Error sending assignment email:", emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in ticket assignment notification:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
