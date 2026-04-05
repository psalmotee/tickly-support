"use client";

import { useState, useEffect, useCallback } from "react";
import { type Ticket } from "@/lib/ticket-local-store";
import { sortByCreatedAtDesc } from "@/lib/sort-utils";
import { TicketCard } from "./ticket-card";
import { Modal } from "./modal";
import { EditTicketForm } from "./edit-ticket-form";
import { DeleteConfirmationModal } from "./delete-confirmation-modal";
import { toast } from "react-toastify";
import { useAuth } from "./auth-provider";
import { AlertTriangle, Edit } from "lucide-react";

interface TicketListProps {
  refreshTrigger: number;
  latestCreatedTicket?: Ticket | null;
  onCreatedTicketConsumed?: () => void;
}

export function TicketList({
  refreshTrigger,
  latestCreatedTicket,
  onCreatedTicketConsumed,
}: TicketListProps) {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTickets = useCallback(
    async (targetUserId?: string) => {
      const activeUserId = targetUserId || userId;
      if (!activeUserId) return;

      try {
        const res = await fetch(`/api/tickets?userId=${activeUserId}`, {
          cache: "no-store",
        });
        const data = await res.json();

        if (data.success) {
          setTickets(sortByCreatedAtDesc(data.tickets || []));
        } else {
          toast.error(data.error || "Failed to load tickets");
        }
      } catch {
        toast.error("Failed to load tickets");
      }
    },
    [userId],
  );

  useEffect(() => {
    if (!userId) return;

    const timer = setTimeout(() => {
      void loadTickets(userId);
    }, 0);

    return () => clearTimeout(timer);
  }, [refreshTrigger, userId, loadTickets]);

  useEffect(() => {
    if (!latestCreatedTicket) return;

    // Optimistically prepend the new ticket so the UI is instant
    const optimisticTimer = setTimeout(() => {
      setTickets((prev) => {
        const exists = prev.some(
          (ticket) => ticket.id === latestCreatedTicket.id,
        );
        if (exists) return prev;
        return sortByCreatedAtDesc([latestCreatedTicket, ...prev]);
      });
    }, 0);

    // Then sync with the server to get the final state
    const syncTimer = setTimeout(() => {
      if (userId) {
        void loadTickets(userId);
      }
      onCreatedTicketConsumed?.();
    }, 1200);

    return () => {
      clearTimeout(optimisticTimer);
      clearTimeout(syncTimer);
    };
  }, [latestCreatedTicket, onCreatedTicketConsumed, userId, loadTickets]);

  const handleEdit = (ticket: Ticket) => {
    if (ticket.deletedByAdmin) {
      toast.error("This ticket was deleted by admin and cannot be edited");
      return;
    }

    setSelectedTicket(ticket);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (ticket: Ticket) => {
    if (ticket.deletedByAdmin) {
      toast.error("This ticket was deleted by admin and cannot be accessed");
      return;
    }

    setSelectedTicket(ticket);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedTicket) return;
    setIsDeleting(true);

    fetch(`/api/tickets/${selectedTicket.id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          toast.error(data.error || "Failed to delete ticket");
          return;
        }

        if (userId) {
          void loadTickets(userId);
        }

        toast.success("Ticket deleted successfully 🗑️");
      })
      .catch(() => {
        toast.error("Failed to delete ticket");
      })
      .finally(() => {
        setIsDeleting(false);
        setIsDeleteModalOpen(false);
        setSelectedTicket(null);
      });
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedTicket(null);
    if (userId) {
      void loadTickets(userId);
    }
  };

  if (tickets.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground mb-4">
          No tickets yet. Create one to get started!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onEdit={handleEdit}
            onDelete={() => handleDeleteClick(ticket)}
          />
        ))}
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        className="bg-primary/10"
        icon={<Edit className="h-5 w-5 text-primary" />}
        title="Edit Ticket"
      >
        {selectedTicket && (
          <EditTicketForm
            ticket={selectedTicket}
            onSuccess={handleEditSuccess}
          />
        )}
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        className="bg-destructive/10"
        icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
        title="Delete Ticket"
      >
        {selectedTicket && (
          <DeleteConfirmationModal
            title="Delete Ticket"
            description="Are you sure you want to delete this ticket?"
            itemName={selectedTicket?.title || ""}
            onConfirm={handleConfirmDelete}
            onCancel={() => setIsDeleteModalOpen(false)}
            isLoading={isDeleting}
          />
        )}
      </Modal>
    </>
  );
}
