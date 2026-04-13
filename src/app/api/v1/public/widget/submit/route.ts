// used
import { NextRequest, NextResponse } from "next/server";
import {
  getWebsiteByToken,
  createWidgetTicket,
  getOrganizationById,
  getOrganizationMembers,
  saveTicketCustomFieldValues,
  type TicketRecord,
} from "@/lib/supabase-helpers";
import {
  sendWidgetTicketConfirmation,
  sendAdminWidgetNotification,
} from "@/lib/email-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      websiteId,
      name,
      email,
      phone,
      subject,
      message,
      priority,
      customFieldValues,
    } = body;

    console.log("[widget/submit] Received request:", {
      websiteId,
      name,
      email,
      phone,
      subject,
    });

    // Validate required fields
    if (!websiteId || !name || !email || !subject || !message) {
      console.log("[widget/submit] Missing required fields");
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
      console.log("[widget/submit] Invalid email format:", email);
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email format",
        },
        { status: 400 },
      );
    }

    // Validate website exists
    console.log("[widget/submit] Looking up website by token:", websiteId);
    const website = await getWebsiteByToken(websiteId);
    console.log(
      "[widget/submit] Website lookup result:",
      website ? "found" : "not found",
    );
    if (!website) {
      console.log("[widget/submit] Website not found for token:", websiteId);
      return NextResponse.json(
        {
          success: false,
          message: "Invalid website",
        },
        { status: 404 },
      );
    }

    // Create widget ticket (pass actual website ID, not token)
    console.log("[widget/submit] Creating ticket for website:", website.id);
    const ticket = await createWidgetTicket({
      websiteId: website.id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || "",
      subject: subject.trim(),
      message: message.trim(),
      priority: priority || "medium",
    });

    console.log(
      "[widget/submit] Ticket creation result:",
      ticket ? "success" : "failed",
    );
    if (!ticket) {
      console.log("[widget/submit] Failed to create ticket");
      return NextResponse.json(
        {
          success: false,
          message: "Failed to create ticket",
        },
        { status: 500 },
      );
    }

    // Save custom field values if provided
    if (customFieldValues && Object.keys(customFieldValues).length > 0) {
      try {
        console.log("[widget/submit] Saving custom field values");
        // Filter out empty values
        const filteredValues: Record<string, string> = {};
        for (const [fieldId, value] of Object.entries(customFieldValues)) {
          if (value) {
            filteredValues[fieldId] = String(value);
          }
        }

        if (Object.keys(filteredValues).length > 0) {
          await saveTicketCustomFieldValues(ticket.id, filteredValues);
          console.log("[widget/submit] Custom field values saved");
        }
      } catch (fieldError) {
        console.error(
          "[widget/submit] Error saving custom field values:",
          fieldError,
        );
        // Don't fail the request if field save fails - ticket was created
      }
    }

    // Send emails in background (don't wait for response)
    try {
      console.log("[widget/submit] Fetching organization for emails");
      // Get organization info
      const org = await getOrganizationById(website.organization_id);
      if (org) {
        console.log("[widget/submit] Sending confirmation email to:", email);
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

        console.log("[widget/submit] Sending admin notifications");
        // Send notification to admins
        const members = await getOrganizationMembers(website.organization_id);
        const adminMembers = members.filter(
          (m) => m.role === "admin" && m.user?.email,
        );
        for (const admin of adminMembers) {
          if (admin.user?.email) {
            await sendAdminWidgetNotification(
              admin.user.email,
              ticket as TicketRecord,
              {
                name: org.name,
                id: org.id,
              },
            );
          }
        }
        console.log("[widget/submit] Emails sent successfully");
      }
    } catch (emailError) {
      console.error(
        "[widget/submit] Error sending notification emails:",
        emailError,
      );
      // Don't fail the request if emails fail - ticket was created successfully
    }

    console.log("[widget/submit] Request completed successfully");
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("[widget/submit] Widget submission error:", {
      message: errorMessage,
      stack: errorStack,
    });
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
