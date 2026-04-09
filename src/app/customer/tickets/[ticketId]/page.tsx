// used
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

interface CustomerTicket {
  id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

const statusColors = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

function TicketDetailContent() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.ticketId as string;

  const [ticket, setTicket] = useState<CustomerTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTicket = async () => {
      try {
        const customerId = localStorage.getItem("customerId");
        if (!customerId || !ticketId) {
          setError("Invalid ticket information");
          setLoading(false);
          return;
        }

        const response = await fetch(
          `/api/customers/tickets/${ticketId}?customerId=${customerId}`,
        );
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to load ticket");
          setLoading(false);
          return;
        }

        setTicket(data.ticket);
        setLoading(false);
      } catch (err) {
        setError("Failed to load ticket");
        setLoading(false);
      }
    };

    loadTicket();
  }, [ticketId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">
            Ticket Not Found
          </h1>
          <p className="text-muted-foreground">
            {error || "Could not find this ticket"}
          </p>
          <Link
            href="/customer/tickets"
            className="inline-block rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90 transition"
          >
            Back to Tickets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/customer/tickets"
          className="text-primary hover:underline mb-8 inline-flex items-center gap-2"
        >
          ← Back to Tickets
        </Link>

        {/* Ticket Header */}
        <div className="rounded-lg border border-border bg-card p-8 mb-6">
          <div className="flex justify-between items-start gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {ticket.title}
              </h1>
              <p className="text-muted-foreground">Ticket ID: {ticket.id}</p>
            </div>
            <div className="text-right">
              <span
                className={`text-sm font-medium px-3 py-1 rounded capitalize inline-block ${
                  statusColors[ticket.status] || "bg-gray-100 text-gray-800"
                }`}
              >
                {ticket.status}
              </span>
            </div>
          </div>

          {/* Ticket Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Priority</p>
              <span
                className={`text-sm font-medium px-3 py-1 rounded capitalize inline-block ${
                  priorityColors[ticket.priority] || "bg-gray-100 text-gray-800"
                }`}
              >
                {ticket.priority}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Created</p>
              <p className="font-medium">
                {new Date(ticket.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            {ticket.updated_at && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Last Updated
                </p>
                <p className="font-medium">
                  {new Date(ticket.updated_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
            {ticket.resolved_at && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Resolved</p>
                <p className="font-medium">
                  {new Date(ticket.resolved_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Ticket Description */}
        <div className="rounded-lg border border-border bg-card p-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Description
          </h2>
          <p className="text-foreground whitespace-pre-wrap">
            {ticket.description}
          </p>
        </div>

        {/* Conversation Area (Placeholder for future implementation) */}
        <div className="rounded-lg border border-border bg-card p-8 mt-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Conversation
          </h2>
          <p className="text-muted-foreground mb-6">
            Support team responses will appear here. Check back for updates.
          </p>
          {ticket.status === "open" || ticket.status === "in_progress" ? (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm text-blue-800">
                Our support team is working on your ticket. We'll update you
                soon.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function TicketDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <TicketDetailContent />
    </Suspense>
  );
}
