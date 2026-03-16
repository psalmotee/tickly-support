"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import NextLink from "next/link";
import { type Ticket } from "@/lib/ticket-local-store";
import { Modal } from "./modal";
import { DeleteConfirmationModal } from "./delete-confirmation-modal";
import { Trash2, ChevronDown, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "react-toastify";
import { handleAdminApiAuthRedirect } from "@/lib/admin-api-client";

interface AdminTicketListProps {
  onStatsChange?: (stats: {
    total: number;
    open: number;
    inProgress: number;
    closed: number;
  }) => void;
}

export function AdminTicketList({ onStatsChange }: AdminTicketListProps) {
  const [tickets, setTickets] = useState<
    Array<Ticket & { user?: { fullName?: string; email?: string } | null }>
  >([]);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    ticket: Ticket | null;
  }>({
    isOpen: false,
    ticket: null,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formatCreatedDate = (isoValue?: string) => {
    if (!isoValue) return "Not set";
    const parsed = new Date(isoValue);
    if (Number.isNaN(parsed.getTime())) return "Invalid date";
    return parsed.toLocaleDateString();
  };

  const loadTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/admin-tickets-route");
      if (handleAdminApiAuthRedirect(res)) return;

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || "Failed to load tickets");
        return;
      }

      const nextTickets = data.tickets || [];
      startTransition(() => {
        setTickets(nextTickets);

        if (onStatsChange) {
          onStatsChange({
            total: nextTickets.length,
            open: nextTickets.filter((t: Ticket) => t.status === "open").length,
            inProgress: nextTickets.filter(
              (t: Ticket) => t.status === "in-progress",
            ).length,
            closed: nextTickets.filter((t: Ticket) => t.status === "closed")
              .length,
          });
        }
      });
    } catch {
      toast.error("Failed to load tickets");
    }
  }, [onStatsChange]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const handleStatusChange = async (
    ticket: Ticket,
    status: "open" | "in-progress" | "closed",
  ) => {
    try {
      if (ticket.deletedByAdmin) {
        toast.error("This ticket is marked deleted by admin");
        return;
      }

      const res = await fetch(`/api/admin/admin-tickets-route/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (handleAdminApiAuthRedirect(res)) return;

      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || "Failed to update ticket status");
        return;
      }

      await loadTickets();
    } catch {
      toast.error("Failed to update ticket status");
      return;
    }

    setEditingId(null);
    toast.success(`Ticket marked as ${getStatusLabel(status)} ✅`);
  };

  const handleDeleteClick = (ticket: Ticket) => {
    setDeleteModal({ isOpen: true, ticket });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.ticket) return;
    setIsLoading(true);
    const res = await fetch(
      `/api/admin/admin-tickets-route/${deleteModal.ticket.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ softDelete: true }),
      },
    );
    if (handleAdminApiAuthRedirect(res)) {
      setIsLoading(false);
      return;
    }

    const data = await res.json();

    if (!data.success) {
      toast.error(data.error || "Failed to delete ticket");
      setIsLoading(false);
      return;
    }

    await loadTickets();
    setDeleteModal({ isOpen: false, ticket: null });
    setIsLoading(false);
    toast.success("Ticket marked deleted for user view 🗑️");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-amber-500/10 text-amber-700 border-amber-200";
      case "in-progress":
        return "bg-blue-500/10 text-blue-700 border-blue-200";
      case "closed":
        return "bg-green-500/10 text-green-700 border-green-200";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-amber-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === "closed") return "Resolved";
    if (status === "in-progress") return "In Progress";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <>
      <div className="rounded-lg border border-border bg-card overflow-auto">
        <div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  User
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No tickets found
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-border hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <NextLink
                          href={`/admin-dashboard/tickets-list/${ticket.id}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          {ticket.title}
                        </NextLink>
                        <p className="text-xs text-muted-foreground mt-1">
                          Ticket ID: {ticket.ticketId || "Not set"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {ticket.description}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      <div className="space-y-1">
                        <p className="text-foreground text-sm font-medium">
                          {ticket.user?.fullName ||
                            ticket.userId ||
                            "Unknown User"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ticket.user?.email || "No email"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button
                          disabled={ticket.deletedByAdmin}
                          onClick={() =>
                            setEditingId(
                              editingId === ticket.id ? null : ticket.id,
                            )
                          }
                          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getStatusColor(
                            ticket.status,
                          )}`}
                        >
                          {ticket.status === "closed" && (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {getStatusLabel(ticket.status)}
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        {editingId === ticket.id && (
                          <div className="absolute top-full mt-1 left-0 z-10 rounded-lg border border-border bg-card shadow-lg">
                            {(["open", "in-progress", "closed"] as const).map(
                              (status) => (
                                <button
                                  key={status}
                                  onClick={() =>
                                    handleStatusChange(ticket, status)
                                  }
                                  className="block w-full px-4 py-2 text-left text-sm text-foreground hover:bg-secondary first:rounded-t-lg last:rounded-b-lg transition-colors"
                                >
                                  {getStatusLabel(status)}
                                </button>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-medium capitalize ${getPriorityColor(
                          ticket.priority,
                        )}`}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatCreatedDate(ticket.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteClick(ticket)}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-1 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, ticket: null })}
        className="bg-destructive/10"
                icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
        
        title="Delete Ticket"
      >
        {deleteModal.ticket && (
          <DeleteConfirmationModal
            title="Delete Ticket"
            description="Are you sure you want to delete this ticket?"
            itemName={deleteModal.ticket.title}
            onConfirm={handleConfirmDelete}
            onCancel={() => setDeleteModal({ isOpen: false, ticket: null })}
            isLoading={isLoading}
          />
        )}
      </Modal>
    </>
  );
}
