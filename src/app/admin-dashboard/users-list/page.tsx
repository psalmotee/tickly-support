"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { isAdmin } from "@/lib/access-control";
import { AdminDashboardHeader } from "@/components/admin-dashboard-header";
import { AdminUserList } from "@/components/admin-users-list";

export default function AdminUsersPage() {
  const router = useRouter();
  const { session, loading } = useAuth();

  if (!loading && (!session || !isAdmin(session))) {
    router.push("/user-dashboard");
    return null;
  }

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
          <h1 className="text-3xl font-bold text-foreground">Manage Users</h1>
          <p className="text-muted-foreground mt-2">
            View all registered users in the system
          </p>
        </div>

        <AdminUserList />
      </main>
    </div>
  );
}
