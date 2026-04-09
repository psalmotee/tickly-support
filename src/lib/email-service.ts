// used
import { Resend } from "resend";
import type {
  TicketRecord,
  CustomerRecord,
  OrganizationRecord,
} from "./supabase-helpers";

// Initialize Resend only when needed
function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@tickly.app";
const APP_NAME = "Tickly";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.tickly.com";

// ====== EMAIL TEMPLATES ======

function emailTemplate(
  content: string,
  footerLink?: { text: string; url: string },
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #374151;
            background-color: #f9fafb;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
          }
          .header {
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            color: #111827;
          }
          .content {
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
          }
          .button:hover {
            background-color: #2563eb;
          }
          .footer {
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
            margin-top: 30px;
            font-size: 12px;
            color: #6b7280;
          }
          .ticket-id {
            background: #f3f4f6;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${content}
          <div class="footer">
            <p>${APP_NAME} Support System</p>
            ${footerLink ? `<p><a href="${footerLink.url}" style="color: #3b82f6; text-decoration: none;">${footerLink.text}</a></p>` : ""}
            <p>© 2026 ${APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function widgetTicketConfirmationTemplate(
  customer: { name: string; email: string },
  ticket: { id: string; title: string; public_token: string },
  organization: { name: string },
): string {
  const viewTicketUrl = `${APP_URL}/customer/tickets/${ticket.id}?token=${ticket.public_token}`;
  return emailTemplate(
    `
    <div class="header">
      <h1>Support Ticket Received</h1>
    </div>
    <div class="content">
      <p>Hi ${customer.name},</p>
      <p>Thank you for reaching out to ${organization.name}. We've received your support request and our team will get back to you shortly.</p>
      <p><strong>Ticket ID:</strong> <span class="ticket-id">${ticket.id}</span></p>
      <p><strong>Subject:</strong> ${ticket.title}</p>
      <p>You can view the status of your ticket at any time using the button below:</p>
      <p style="text-align: center; margin-top: 30px;">
        <a href="${viewTicketUrl}" class="button">View Ticket</a>
      </p>
      <p>We appreciate your patience and will keep you updated as we work on your request.</p>
    </div>
  `,
    { text: "View Ticket Status", url: viewTicketUrl },
  );
}

export function adminWidgetNotificationTemplate(
  ticket: TicketRecord,
  organization: { name: string; id: string },
): string {
  const adminUrl = `${APP_URL}/admin-dashboard/tickets-list/${ticket.id}`;
  return emailTemplate(
    `
    <div class="header">
      <h1>New Support Ticket</h1>
    </div>
    <div class="content">
      <p>A new support ticket has been submitted via your website's widget.</p>
      <p><strong>From:</strong> ${ticket.customer_name || "N/A"} (${ticket.customer_email || "N/A"})</p>
      <p><strong>Subject:</strong> ${ticket.title}</p>
      <p><strong>Priority:</strong> ${ticket.priority?.toUpperCase() || "MEDIUM"}</p>
      <p><strong>Message:</strong></p>
      <p style="background: #f3f4f6; padding: 12px; border-radius: 4px; white-space: pre-wrap;">${ticket.description}</p>
      <p style="text-align: center; margin-top: 30px;">
        <a href="${adminUrl}" class="button">View In Dashboard</a>
      </p>
    </div>
  `,
    { text: "View In Dashboard", url: adminUrl },
  );
}

export function ticketAssignmentTemplate(
  ticket: TicketRecord,
  assignedTo: { email: string; full_name: string },
  organization: { name: string },
): string {
  const ticketUrl = `${APP_URL}/admin-dashboard/tickets-list/${ticket.id}`;
  return emailTemplate(
    `
    <div class="header">
      <h1>Ticket Assigned to You</h1>
    </div>
    <div class="content">
      <p>Hi ${assignedTo.full_name},</p>
      <p>You've been assigned a new support ticket for ${organization.name}.</p>
      <p><strong>Subject:</strong> ${ticket.title}</p>
      <p><strong>Priority:</strong> ${ticket.priority?.toUpperCase() || "MEDIUM"}</p>
      <p><strong>Customer:</strong> ${ticket.customer_name || "N/A"}</p>
      <p style="text-align: center; margin-top: 30px;">
        <a href="${ticketUrl}" class="button">View Ticket</a>
      </p>
    </div>
  `,
    { text: "View Ticket", url: ticketUrl },
  );
}

export function ticketStatusUpdateTemplate(
  ticket: TicketRecord,
  customer: { name: string; email: string },
  newStatus: string,
  organization: { name: string },
): string {
  const viewUrl = `${APP_URL}/customer/tickets/${ticket.id}?token=${ticket.public_token}`;
  const statusMessage =
    {
      in_progress: "We're working on your request.",
      resolved: "Your issue has been resolved!",
      closed: "Your ticket has been closed.",
    }[newStatus] || `Status updated to ${newStatus}.`;

  return emailTemplate(
    `
    <div class="header">
      <h1>Ticket Status Updated</h1>
    </div>
    <div class="content">
      <p>Hi ${customer.name},</p>
      <p>Your support ticket has been updated.</p>
      <p><strong>Ticket ID:</strong> <span class="ticket-id">${ticket.id}</span></p>
      <p><strong>Subject:</strong> ${ticket.title}</p>
      <p><strong>New Status:</strong> ${newStatus.replace("_", " ").toUpperCase()}</p>
      <p>${statusMessage}</p>
      <p style="text-align: center; margin-top: 30px;">
        <a href="${viewUrl}" class="button">View Ticket</a>
      </p>
    </div>
  `,
    { text: "View Ticket", url: viewUrl },
  );
}

export function dailyDigestTemplate(
  recipientName: string,
  stats: {
    newTickets: number;
    resolvedTickets: number;
    openTickets: number;
    pendingTickets: number;
  },
  organization: { name: string },
): string {
  const dashboardUrl = `${APP_URL}/admin-dashboard`;
  return emailTemplate(
    `
    <div class="header">
      <h1>Daily Support Summary</h1>
    </div>
    <div class="content">
      <p>Hi ${recipientName},</p>
      <p>Here's your daily support summary for ${organization.name}:</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>New Tickets:</strong> ${stats.newTickets}</p>
        <p><strong>Resolved Today:</strong> ${stats.resolvedTickets}</p>
        <p><strong>Open Tickets:</strong> ${stats.openTickets}</p>
        <p><strong>Pending Your Action:</strong> ${stats.pendingTickets}</p>
      </div>
      <p style="text-align: center; margin-top: 30px;">
        <a href="${dashboardUrl}" class="button">View Dashboard</a>
      </p>
    </div>
  `,
    { text: "View Dashboard", url: dashboardUrl },
  );
}

// ====== EMAIL SENDING FUNCTIONS ======

export async function sendWidgetTicketConfirmation(
  customer: { name: string; email: string },
  ticket: { id: string; title: string; public_token: string },
  organization: { name: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResend();
    if (!resend) {
      console.warn(
        "Email service not configured. Skipping confirmation email.",
      );
      return { success: true }; // Don't fail if email not configured
    }

    const html = widgetTicketConfirmationTemplate(
      customer,
      ticket,
      organization,
    );

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: customer.email,
      subject: `Support Ticket Received - ${ticket.title}`,
      html,
    });

    if (result.error) {
      console.error("Error sending widget confirmation email:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending widget confirmation email:", error);
    return { success: false, error: String(error) };
  }
}

export async function sendAdminWidgetNotification(
  adminEmail: string,
  ticket: TicketRecord,
  organization: { name: string; id: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResend();
    if (!resend) {
      console.warn(
        "Email service not configured. Skipping admin notification.",
      );
      return { success: true };
    }

    const html = adminWidgetNotificationTemplate(ticket, organization);

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `New Support Ticket: ${ticket.title}`,
      html,
    });

    if (result.error) {
      console.error("Error sending admin notification email:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending admin notification email:", error);
    return { success: false, error: String(error) };
  }
}

export async function sendTicketAssignment(
  ticket: TicketRecord,
  assignedTo: { email: string; full_name: string },
  organization: { name: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResend();
    if (!resend) {
      console.warn("Email service not configured. Skipping assignment email.");
      return { success: true };
    }

    const html = ticketAssignmentTemplate(ticket, assignedTo, organization);

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: assignedTo.email,
      subject: `New Assignment: ${ticket.title}`,
      html,
    });

    if (result.error) {
      console.error("Error sending assignment email:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending assignment email:", error);
    return { success: false, error: String(error) };
  }
}

export async function sendTicketStatusUpdate(
  ticket: TicketRecord,
  customer: { name: string; email: string },
  newStatus: string,
  organization: { name: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResend();
    if (!resend) {
      console.warn(
        "Email service not configured. Skipping status update email.",
      );
      return { success: true };
    }

    const html = ticketStatusUpdateTemplate(
      ticket,
      customer,
      newStatus,
      organization,
    );

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: customer.email,
      subject: `Ticket Update: ${ticket.title}`,
      html,
    });

    if (result.error) {
      console.error("Error sending status update email:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending status update email:", error);
    return { success: false, error: String(error) };
  }
}

export async function sendDailyDigest(
  recipientEmail: string,
  recipientName: string,
  stats: {
    newTickets: number;
    resolvedTickets: number;
    openTickets: number;
    pendingTickets: number;
  },
  organization: { name: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResend();
    if (!resend) {
      console.warn("Email service not configured. Skipping daily digest.");
      return { success: true };
    }

    const html = dailyDigestTemplate(recipientName, stats, organization);

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `Daily Summary: ${organization.name}`,
      html,
    });

    if (result.error) {
      console.error("Error sending daily digest email:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending daily digest email:", error);
    return { success: false, error: String(error) };
  }
}
