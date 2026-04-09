// used
import { NextRequest, NextResponse } from "next/server";
import {
  getWebsiteByToken,
  createWidgetTicket,
  getOrganizationById,
  getOrganizationMembers,
} from "@/lib/supabase-helpers";
import {
  sendWidgetTicketConfirmation,
  sendAdminWidgetNotification,
} from "@/lib/email-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { websiteId, name, email, phone, subject, message, priority } = body;

    // Validate required fields
    if (!websiteId || !name || !email || !subject || !message) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
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
          message: "Invalid email format",
        },
        { status: 400 },
      );
    }

    // Validate website exists
    const website = await getWebsiteByToken(websiteId);
    if (!website) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid website",
        },
        { status: 404 },
      );
    }

    // Create widget ticket
    const ticket = await createWidgetTicket({
      websiteId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || "",
      subject: subject.trim(),
      message: message.trim(),
      priority: priority || "medium",
    });

    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to create ticket",
        },
        { status: 500 },
      );
    }

    // Send emails in background (don't wait for response)
    try {
      // Get organization info
      const org = await getOrganizationById(website.organization_id);
      if (org) {
        // Send confirmation email to customer
        await sendWidgetTicketConfirmation(
          { name: name.trim(), email: email.trim().toLowerCase() },
          {
            id: ticket.id,
            title: ticket.title,
            public_token: ticket.public_token || "",
          },
          { name: org.name },
        );

        // Send notification to admins
        const members = await getOrganizationMembers(website.organization_id);
        const adminMembers = members.filter(
          (m) => m.role === "admin" && m.user?.email,
        );
        for (const admin of adminMembers) {
          if (admin.user?.email) {
            await sendAdminWidgetNotification(admin.user.email, ticket, {
              name: org.name,
              id: org.id,
            });
          }
        }
      }
    } catch (emailError) {
      console.error("Error sending notification emails:", emailError);
      // Don't fail the request if emails fail - ticket was created successfully
    }

    return NextResponse.json(
      {
        success: true,
        message: "Ticket submitted successfully",
        ticket: {
          id: ticket.id,
          publicToken: ticket.public_token,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Widget submission error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
