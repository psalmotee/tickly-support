// used
"use client";

import { useState } from "react";
import { AdminDashboardHeader } from "@/components/admin-dashboard-header";
import { DashboardSelector } from "@/components/dashboard-selector";
import { DashboardStats } from "@/components/dashboard-stats";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string | null>(
    null,
  );

  return (
    <div className="min-h-screen bg-background">
      <AdminDashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and monitor your support tickets
          </p>
        </div>

        {/* Organization & Website Selector */}
        <div className="mb-8 p-6 rounded-lg border border-border bg-card">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Select Organization
          </h2>
          <DashboardSelector
            initialOrgId={selectedOrgId}
            initialWebsiteId={selectedWebsiteId}
            onOrgChange={setSelectedOrgId}
            onWebsiteChange={setSelectedWebsiteId}
          />
        </div>

        {/* Show stats only if organization is selected */}
        {selectedOrgId ? (
          <>
            {/* Dashboard Stats */}
            <DashboardStats
              organizationId={selectedOrgId}
              websiteId={selectedWebsiteId}
            />

            {/* Quick Access Links */}
            <div className="mt-12">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Quick Access
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link
                  href="/admin-dashboard/tickets-list"
                  className="p-6 rounded-lg border border-border bg-card hover:border-primary hover:shadow-md transition group"
                >
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition mb-2">
                    View All Tickets
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Browse and manage all support tickets
                  </p>
                </Link>

                <Link
                  href="/admin-dashboard/users-list"
                  className="p-6 rounded-lg border border-border bg-card hover:border-primary hover:shadow-md transition group"
                >
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition mb-2">
                    Manage Team
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    View and manage team members and roles
                  </p>
                </Link>

                <Link
                  href="/admin-dashboard/settings"
                  className="p-6 rounded-lg border border-border bg-card hover:border-primary hover:shadow-md transition group"
                >
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition mb-2">
                    Settings
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Configure organization settings and team
                  </p>
                </Link>

                <Link
                  href="/admin-dashboard/widget-settings"
                  className="p-6 rounded-lg border border-border bg-card hover:border-primary hover:shadow-md transition group"
                >
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition mb-2">
                    Embed Widget
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Get the code to embed support form on your site
                  </p>
                </Link>
              </div>
            </div>

            {/* Info Cards */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border border-border bg-blue-50">
                <h3 className="font-semibold text-blue-900 mb-2">
                  📚 Getting Started
                </h3>
                <p className="text-sm text-blue-800 mb-4">
                  Learn how to manage your support tickets and team members
                  effectively.
                </p>
                <Link
                  href="#"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  View documentation →
                </Link>
              </div>

              <div className="p-6 rounded-lg border border-border bg-green-50">
                <h3 className="font-semibold text-green-900 mb-2">
                  🎯 Next Steps
                </h3>
                <p className="text-sm text-green-800 mb-4">
                  {selectedWebsiteId
                    ? "You have selected a specific website. View its tickets to get started."
                    : "Select a website to see ticket statistics and management options."}
                </p>
                <Link
                  href="/admin-dashboard/tickets-list"
                  className="text-sm font-medium text-green-600 hover:underline"
                >
                  Go to tickets →
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 rounded-lg border border-dashed border-border bg-muted/30">
            <p className="text-muted-foreground mb-2">
              No organization selected
            </p>
            <p className="text-sm text-muted-foreground">
              Select an organization from the selector above to view statistics
              and manage tickets
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
