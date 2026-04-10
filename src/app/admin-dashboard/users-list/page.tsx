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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manage Users</h1>
            <p className="text-muted-foreground mt-2">
              View and manage your team members
            </p>
          </div>
          <a
            href="/admin-dashboard/users-list/invite-member"
            className="inline-block px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            + Invite Member
          </a>
        </div>

        <AdminUserList />
      </main>
    </div>
  );
}
