"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { isAdmin } from "@/lib/access-control";
import { AdminDashboardHeader } from "@/components/admin-dashboard-header";
import { AdminTicketList } from "@/components/admin-ticket-list";
import { AdminStats } from "@/components/admin-stats";

export default function AdminTicketsPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    closed: 0,
  });

  // Redirect if not admin
  if (!loading && (!session || !isAdmin(session))) {
    router.push("/user-dashboard");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminDashboardHeader />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Admin Control Panel
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage all system tickets and users
          </p>
        </div>

        <div className="mb-8">
          <AdminStats {...stats} />
        </div>

        <AdminTicketList onStatsChange={setStats} />
      </main>
    </div>
  );
}
