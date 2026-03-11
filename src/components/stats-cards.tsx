"use client";

import { useEffect, useState } from "react";
import { type Ticket } from "@/lib/ticket-local-store";
import { isTicketDeletedByAdmin } from "@/lib/ticket-soft-delete";

import { useAuth } from "./auth-provider";
import { BarChart3, CheckCircle2, Clock, AlertCircle } from "lucide-react";

const EMPTY_STATS = {
  total: 0,
  open: 0,
  inProgress: 0,
  closed: 0,
};

export function StatsCards() {
  const { session } = useAuth();
  const [stats, setStats] = useState(EMPTY_STATS);
  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const loadStats = async () => {
      try {
        const res = await fetch(`/api/tickets?userId=${userId}`, {
          cache: "no-store",
        });
        const data = await res.json();

        if (!data.success) return;

        const activeTickets = (data.tickets || []).filter(
          (ticket: Ticket) =>
            !ticket.deletedByAdmin &&
            !isTicketDeletedByAdmin(ticket.internalNotes),
        );

        if (!cancelled) {
          setStats({
            total: activeTickets.length,
            open: activeTickets.filter((t: Ticket) => t.status === "open")
              .length,
            inProgress: activeTickets.filter(
              (t: Ticket) => t.status === "in-progress",
            ).length,
            closed: activeTickets.filter((t: Ticket) => t.status === "closed")
              .length,
          });
        }
      } catch {
        if (!cancelled) {
          setStats(EMPTY_STATS);
        }
      }
    };

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const displayStats = userId ? stats : EMPTY_STATS;

  const cards = [
    {
      label: "Total Tickets",
      value: displayStats.total,
      icon: BarChart3,
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      label: "Open",
      value: displayStats.open,
      icon: AlertCircle,
      color: "bg-amber-500/10 text-amber-600",
    },
    {
      label: "In Progress",
      value: displayStats.inProgress,
      icon: Clock,
      color: "bg-purple-500/10 text-purple-600",
    },
    {
      label: "Closed",
      value: displayStats.closed,
      icon: CheckCircle2,
      color: "bg-green-500/10 text-green-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-lg border border-border bg-card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {card.value}
                </p>
              </div>
              <div className={`rounded-lg p-3 ${card.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
