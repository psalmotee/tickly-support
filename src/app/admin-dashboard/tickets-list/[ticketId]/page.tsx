"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, User, Mail, Calendar, StickyNote } from "lucide-react";
import { toast } from "react-toastify";
import { handleAdminApiAuthRedirect } from "@/lib/admin-api-client";

interface TicketDetailsData {
  id: string;
  ticketId?: string;
  title: string;
  description: string;
  createdAt: string;
  internalNotes?: string;
  users?: {
    fullName?: string;
    email?: string;
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
    return <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="p-10 text-center mt-4 text-muted-foreground">Loading ticket details...</p>
    </div>;
  }

  if (!ticket) {
    return <div className="p-10 text-center">Ticket not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Tickets
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h1 className="text-2xl font-bold">{ticket.title}</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Ticket ID: {ticket.ticketId || ticket.id}
            </p>
            <p className="mt-4 text-foreground whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h3 className="flex items-center gap-2 font-semibold mb-4">
              <StickyNote className="h-4 w-4" /> Internal Admin Notes
            </h3>
            <textarea
              className="w-full h-32 p-3 bg-secondary/30 border rounded-md text-sm focus:ring-1 focus:ring-primary outline-none"
              placeholder="Add notes only visible to admins..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button
              onClick={saveNote}
              disabled={isSaving}
              className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
            >
              {isSaving ? "Saving..." : "Save Note"}
            </button>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Customer Info</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />{" "}
                {ticket.users?.fullName}
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />{" "}
                {ticket.users?.email}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />{" "}
                {new Date(ticket.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
