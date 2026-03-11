"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { isAdmin } from "@/lib/access-control";
import { AdminDashboardHeader } from "@/components/admin-dashboard-header";
import { AdminStats } from "@/components/admin-stats";
import Link from "next/link";
import { TrendingUp, Users, Ticket } from "lucide-react";
import { handleAdminApiAuthRedirect } from "@/lib/admin-api-client";

interface AdminTicketRecord {
  id: string;
  status: "open" | "in-progress" | "closed";
  userId: string;
  user?: {
    fullName?: string;
    email?: string;
  } | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [tickets, setTickets] = useState<AdminTicketRecord[]>([]);
  const [userCount, setUserCount] = useState(0);

  const stats = useMemo(() => {
    const byUserMap: Record<
      string,
      {
        name: string;
        count: number;
        open: number;
        inProgress: number;
        closed: number;
      }
    > = {};

    for (const ticket of tickets) {
      const userKey = ticket.userId || "unknown";
      const userName =
        ticket.user?.fullName ||
        ticket.user?.email ||
        ticket.userId ||
        "Unknown User";

      if (!byUserMap[userKey]) {
        byUserMap[userKey] = {
          name: userName,
          count: 0,
          open: 0,
          inProgress: 0,
          closed: 0,
        };
      }

      byUserMap[userKey].count += 1;
      if (ticket.status === "open") byUserMap[userKey].open += 1;
      if (ticket.status === "in-progress") byUserMap[userKey].inProgress += 1;
      if (ticket.status === "closed") byUserMap[userKey].closed += 1;
    }

    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === "open").length,
      inProgress: tickets.filter((t) => t.status === "in-progress").length,
      closed: tickets.filter((t) => t.status === "closed").length,
      byUser: Object.values(byUserMap).sort((a, b) => b.count - a.count),
    };
  }, [tickets]);

  useEffect(() => {
    if (loading || !session || !isAdmin(session)) return;

    const load = async () => {
      try {
        const res = await fetch("/api/admin/admin-tickets-route", {
          cache: "no-store",
        });
        if (handleAdminApiAuthRedirect(res)) return;

        const data = await res.json();
        if (data.success) {
          setTickets(data.tickets || []);
        }

        const usersRes = await fetch("/api/admin/admin-users-route?page=1", {
          cache: "no-store",
        });
        if (handleAdminApiAuthRedirect(usersRes)) return;

        const usersData = await usersRes.json();
        if (usersData.success) {
          const totalFromMeta = usersData.meta?.total;
          setUserCount(
            typeof totalFromMeta === "number"
              ? totalFromMeta
              : Array.isArray(usersData.users)
                ? usersData.users.length
                : 0,
          );
        }
      } catch {
        
      }
    };

    void load();
  }, [loading, session]);

  useEffect(() => {
    if (!loading && (!session || !isAdmin(session))) {
      router.push("/user-dashboard");
    }
  }, [loading, router, session]);

  if (!loading && (!session || !isAdmin(session))) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminDashboardHeader />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage all tickets and users in the system
          </p>
        </div>

        <AdminStats
          total={stats.total}
          open={stats.open}
          inProgress={stats.inProgress}
          closed={stats.closed}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Link
            href="/admin-dashboard/tickets-list"
            className="rounded-lg border border-border bg-card p-6 hover:border-primary/50 hover:bg-secondary/30 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Manage Tickets</p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {stats.total}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Ticket className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Link>

          <Link
            href="/admin-dashboard/users-list"
            className="rounded-lg border border-border bg-card p-6 hover:border-primary/50 hover:bg-secondary/30 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Manage Users</p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {userCount}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Link>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Closed Rate</p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {stats.total > 0
                    ? Math.round((stats.closed / stats.total) * 100)
                    : 0}
                  %
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Top Users by Ticket Count
          </h2>
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Total Tickets
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Open
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      In Progress
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Closed
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byUser.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-muted-foreground"
                      >
                        No users with tickets
                      </td>
                    </tr>
                  ) : (
                    stats.byUser.slice(0, 5).map((user, index) => (
                      <tr
                        key={`${user.name}-${index}`}
                        className="border-b border-border hover:bg-secondary/30 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-foreground">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {user.count}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-700">
                            {user.open}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-700">
                            {user.inProgress}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-700">
                            {user.closed}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
