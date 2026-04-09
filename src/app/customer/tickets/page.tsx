// used
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

export default function CustomerTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<CustomerTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTickets = async () => {
      try {
        // Get customer ID from session
        const response = await fetch("/api/check-auth");
        const data = await response.json();

        if (!response.ok || !data.session) {
          router.push("/customer-signup");
          return;
        }

        // In a real implementation, you'd extract customer ID from session
        // For now, we'll use a placeholder
        const customerId = localStorage.getItem("customerId");
        if (!customerId) {
          setError("Customer information not found");
          setLoading(false);
          return;
        }

        const ticketsResponse = await fetch(
          `/api/customers/tickets?customerId=${customerId}`,
        );
        const ticketsData = await ticketsResponse.json();

        if (!ticketsResponse.ok) {
          setError(ticketsData.error || "Failed to load tickets");
          setLoading(false);
          return;
        }

        setTickets(ticketsData.tickets || []);
        setLoading(false);
      } catch (err) {
        setError("Failed to load tickets");
        setLoading(false);
      }
    };

    loadTickets();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Your Tickets
            </h1>
            <p className="text-muted-foreground">
              Track and manage your support requests
            </p>
          </div>
          <Link
            href="/customer/submit"
            className="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90 transition"
          >
            Create New Ticket
          </Link>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Tickets List */}
        {tickets.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Tickets Yet
            </h3>
            <p className="text-muted-foreground mb-6">
              You haven't created any support tickets yet. Create one to get
              started.
            </p>
            <Link
              href="/customer/submit"
              className="inline-block rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90 transition"
            >
              Create Your First Ticket
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/customer/tickets/${ticket.id}`}
                className="rounded-lg border border-border bg-card p-6 hover:border-primary hover:shadow-md transition"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">
                      {ticket.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {ticket.description}
                    </p>
                    <div className="flex gap-3 mt-4">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded capitalize ${
                          statusColors[ticket.status] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {ticket.status}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded capitalize ${
                          priorityColors[ticket.priority] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground whitespace-nowrap">
                    <p>{new Date(ticket.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
