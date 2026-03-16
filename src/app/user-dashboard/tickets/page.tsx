"use client";

import { useState } from "react";
import { UserDashboardHeader } from "@/components/user-dashboard-header";
import { TicketList } from "@/components/ticket-list";
import { CreateTicketForm } from "@/components/create-ticket-form";
import { Modal } from "@/components/modal";
import { Plus } from "lucide-react";
import Link from "next/link";
import type { Ticket } from "@/lib/ticket-local-store";

export default function TicketsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [latestCreatedTicket, setLatestCreatedTicket] = useState<Ticket | null>(
    null,
  );

  const handleCreateSuccess = (ticket?: Ticket) => {
    setIsCreateModalOpen(false);
    setLatestCreatedTicket(ticket || null);
  };

  return (
    <main className="min-h-screen bg-background">
      <UserDashboardHeader />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Tickets</h1>
            <p className="text-muted-foreground">
              Manage and track all your tickets
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Ticket
            </button>
            <Link
              href="/user-dashboard"
              className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 font-medium text-foreground bg-primary/10 hover:bg-primary/20 hover:border-primary/50 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>

        <TicketList
          refreshTrigger={0}
          latestCreatedTicket={latestCreatedTicket}
          onCreatedTicketConsumed={() => setLatestCreatedTicket(null)}
        />
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        className="bg-primary/10"
        icon={<Plus className="h-5 w-5 text-primary" />}
        title="Create New Ticket"
      >
        <CreateTicketForm onSuccess={handleCreateSuccess} />
      </Modal>
    </main>
  );
}
