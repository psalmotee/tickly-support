// used
"use client";

import { useEffect, useState } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TeamManagement } from "@/components/team-management";

export default function OrganizationSettingsPage() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const response = await fetch("/api/admin/organizations/current");
        if (response.ok) {
          const data = await response.json();
          setOrganizationId(data.organization.id);
        }
      } catch (error) {
        console.error("Failed to fetch organization:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading organization...</p>
        </div>
      </div>
    );
  }

  if (!organizationId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load organization</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/admin-dashboard"
            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <h1 className="text-3xl font-bold text-foreground">
            Organization Settings
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage your organization, team members, and settings
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              <a
                href="#team"
                className="block px-4 py-2 rounded-lg bg-primary/10 text-primary font-medium"
              >
                Team Members
              </a>
              <a
                href="#billing"
                className="block px-4 py-2 rounded-lg text-muted-foreground hover:bg-background/50 transition-colors"
              >
                Billing
              </a>
              <a
                href="#branding"
                className="block px-4 py-2 rounded-lg text-muted-foreground hover:bg-background/50 transition-colors"
              >
                Branding
              </a>
              <a
                href="#api"
                className="block px-4 py-2 rounded-lg text-muted-foreground hover:bg-background/50 transition-colors"
              >
                API Keys
              </a>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div id="team" className="scroll-mt-8">
              <TeamManagement organizationId={organizationId} />
            </div>

            {/* Placeholder sections for other tabs */}
            <div id="billing" className="mt-16 scroll-mt-8">
              <div className="rounded-lg border border-border bg-card p-8 text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Billing
                </h3>
                <p className="text-muted-foreground">
                  Billing and subscription management coming soon
                </p>
              </div>
            </div>

            <div id="branding" className="mt-16 scroll-mt-8">
              <div className="rounded-lg border border-border bg-card p-8 text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Branding
                </h3>
                <p className="text-muted-foreground">
                  Customize your organization branding coming soon
                </p>
              </div>
            </div>

            <div id="api" className="mt-16 scroll-mt-8">
              <div className="rounded-lg border border-border bg-card p-8 text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  API Keys
                </h3>
                <p className="text-muted-foreground">
                  Manage API keys and integrations coming soon
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
