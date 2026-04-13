"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  StickyNote,
  Phone,
  Building,
} from "lucide-react";
import { toast } from "react-toastify";
import { handleAdminApiAuthRedirect } from "@/lib/admin-api-client";

interface TicketDetailsData {
  id: string;
  ticketId?: string;
  title: string;
  description: string;
  createdAt: string;
  internalNotes?: string;
  user?: {
    fullName?: string;
    email?: string;
    role?: string;
  };
  customer?: {
    fullName?: string;
    email?: string;
    phone?: string;
    companyName?: string;
  };
}

export default function TicketDetails() {
  const [ticket, setTicket] = useState<TicketDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const params = useParams<{ ticketId: string }>();
  const ticketId = params?.ticketId;

  useEffect(() => {
    if (!ticketId) return;

    fetch(`/api/admin/admin-tickets-route/${ticketId}`)
      .then((res) => {
        if (handleAdminApiAuthRedirect(res)) {
          return { success: false };
        }

        return res.json();
      })
      .then((data) => {
        if (!data.success) {
          toast.error(data.error || "Ticket not found");
          return;
        }

        setTicket(data.ticket);
        setNote(data.ticket?.internalNotes || "");
      })
      .catch((error: unknown) => {
        console.error("[admin-ticket-details] Failed to load ticket", {
          error,
        });
        toast.error("Failed to load ticket details");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [ticketId]);

  const saveNote = async () => {
    if (!ticketId) return;

    setIsSaving(true);
    const res = await fetch(`/api/admin/admin-tickets-route/${ticketId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    if (handleAdminApiAuthRedirect(res)) {
      setIsSaving(false);
      return;
    }

    if (res.ok) {
      setTicket((prev) => (prev ? { ...prev, internalNotes: note } : prev));
      toast.success("Internal note saved!");
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center p-8"
        style={{
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
          <p className="text-muted-foreground font-medium">
            Loading ticket details...
          </p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center p-8"
        style={{
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <p className="text-red-600 text-lg font-medium">Ticket not found</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            Back to Tickets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background"
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-medium text-primary hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Tickets
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h1 className="text-3xl font-bold text-foreground">
                {ticket.title}
              </h1>
              <p className="text-sm text-muted-foreground mt-3 font-medium">
                Ticket ID:{" "}
                <span className="text-foreground font-semibold">
                  {ticket.ticketId || ticket.id}
                </span>
              </p>
              <p className="mt-6 text-foreground whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="flex items-center gap-2 font-semibold text-foreground mb-4">
                <StickyNote className="h-5 w-5 text-primary" /> Internal Admin
                Notes
              </h3>
              <textarea
                className="w-full h-32 p-3 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                placeholder="Add notes only visible to admins..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button
                onClick={saveNote}
                disabled={isSaving}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50 transition-opacity font-medium"
              >
                {isSaving ? "Saving..." : "Save Note"}
              </button>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-5">
                Customer Information
              </h3>
              <div className="space-y-4">
                <div className="pb-4 border-b border-border">
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-primary mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        Name
                      </p>
                      <p className="text-sm text-foreground font-semibold mt-1">
                        {ticket.customer?.fullName || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pb-4 border-b border-border">
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-primary mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        Email
                      </p>
                      <p className="text-sm text-foreground font-semibold mt-1">
                        {ticket.customer?.email || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {ticket.customer?.phone && (
                  <div className="pb-4 border-b border-border">
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-primary mt-1" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                          Phone
                        </p>
                        <p className="text-sm text-foreground font-semibold mt-1">
                          {ticket.customer.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {ticket.customer?.companyName && (
                  <div className="pb-4 border-b border-border">
                    <div className="flex items-start gap-3">
                      <Building className="h-4 w-4 text-primary mt-1" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                          Company
                        </p>
                        <p className="text-sm text-foreground font-semibold mt-1">
                          {ticket.customer.companyName}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-primary mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        Created
                      </p>
                      <p className="text-sm text-foreground font-semibold mt-1">
                        {new Date(ticket.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
