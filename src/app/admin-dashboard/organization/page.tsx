"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  is_active: boolean;
  created_at: string;
  subscription_plan?: string;
  subscription_status?: string;
  billing_email?: string;
}

interface OrgStats {
  total_users: number;
  total_customers: number;
  total_tickets: number;
  active_campaigns: number;
}

export default function OrganizationSettingsPage() {
  const router = useRouter();
  const [org, setOrg] = useState<Organization | null>(null);
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "settings" | "billing"
  >("overview");

  // Form states
  const [orgName, setOrgName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");

  useEffect(() => {
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/organizations/current");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch organization");
      }

      setOrg(data.organization);
      setStats(data.stats);
      setOrgName(data.organization.name);
      setBillingEmail(
        data.organization.billing_email || "admin@organization.com",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load organization",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(
        `/api/admin/organizations/${org.id}/general`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: orgName,
            billing_email: billingEmail,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save settings");
      }

      setSuccess("Organization settings updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin text-2xl mb-4">⏳</div>
            <p className="text-slate-600">Loading organization settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
            <p className="text-red-700 font-medium">Organization not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-8">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/admin-dashboard"
            className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">
            Organization Settings
          </h1>
          <p className="text-slate-600 mt-2">{org.name}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8 max-w-6xl mx-auto">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-medium">✓ {success}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-3 font-medium border-b-2 -mb-[2px] transition ${
              activeTab === "overview"
                ? "text-blue-600 border-blue-600"
                : "text-slate-600 border-transparent hover:text-slate-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-3 font-medium border-b-2 -mb-[2px] transition ${
              activeTab === "settings"
                ? "text-blue-600 border-blue-600"
                : "text-slate-600 border-transparent hover:text-slate-900"
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`px-4 py-3 font-medium border-b-2 -mb-[2px] transition ${
              activeTab === "billing"
                ? "text-blue-600 border-blue-600"
                : "text-slate-600 border-transparent hover:text-slate-900"
            }`}
          >
            Billing & Plan
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Users Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">
                    Team Members
                  </p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {stats?.total_users || 0}
                  </p>
                </div>
                <div className="text-3xl">👥</div>
              </div>
              <Link
                href="/admin-dashboard/users-list"
                className="text-blue-600 hover:text-blue-700 text-sm mt-4 inline-block"
              >
                Manage team →
              </Link>
            </div>

            {/* Customers Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">
                    Customers
                  </p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {stats?.total_customers || 0}
                  </p>
                </div>
                <div className="text-3xl">👤</div>
              </div>
              <Link
                href="/admin-dashboard/customers"
                className="text-blue-600 hover:text-blue-700 text-sm mt-4 inline-block"
              >
                View customers →
              </Link>
            </div>

            {/* Tickets Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">
                    Total Tickets
                  </p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {stats?.total_tickets || 0}
                  </p>
                </div>
                <div className="text-3xl">🎟️</div>
              </div>
              <Link
                href="/admin-dashboard/tickets-list"
                className="text-blue-600 hover:text-blue-700 text-sm mt-4 inline-block"
              >
                View tickets →
              </Link>
            </div>

            {/* Campaigns Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">
                    Active Campaigns
                  </p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {stats?.active_campaigns || 0}
                  </p>
                </div>
                <div className="text-3xl">📧</div>
              </div>
              <Link
                href="/admin-dashboard/campaigns"
                className="text-blue-600 hover:text-blue-700 text-sm mt-4 inline-block"
              >
                View campaigns →
              </Link>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="bg-white rounded-lg shadow p-8 max-w-2xl">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              General Settings
            </h2>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Organization ID */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Organization ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={org.id}
                    disabled
                    className="w-full px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-600"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Used to identify your organization in API calls
                </p>
              </div>

              {/* Organization Name */}
              <div>
                <label
                  htmlFor="orgName"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Organization Name
                </label>
                <input
                  type="text"
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  disabled={saving}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                  placeholder="Your Organization"
                />
              </div>

              {/* Billing Email */}
              <div>
                <label
                  htmlFor="billingEmail"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Billing Email
                </label>
                <input
                  type="email"
                  id="billingEmail"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  disabled={saving}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                  placeholder="billing@organization.com"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Email address for billing notifications
                </p>
              </div>

              {/* Organization Status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <div className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  {org.is_active ? "Active" : "Inactive"}
                </div>
              </div>

              {/* Created Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Created
                </label>
                <p className="text-slate-600">
                  {new Date(org.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              {/* Save Button */}
              <div className="pt-6 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition"
                >
                  {saving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === "billing" && (
          <div className="bg-white rounded-lg shadow p-8 max-w-2xl">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              Billing & Plan
            </h2>

            <div className="space-y-6">
              {/* Current Plan */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Current Plan
                </label>
                <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium">
                  {org.subscription_plan || "Starter"}
                </div>
              </div>

              {/* Subscription Status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Subscription Status
                </label>
                <div className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
                  {org.subscription_status || "Active"}
                </div>
              </div>

              {/* Billing Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Billing Email
                </label>
                <p className="text-slate-600">{billingEmail}</p>
              </div>

              {/* Plan Features */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-4">
                  Included Features
                </label>
                <ul className="space-y-2 text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> Unlimited Tickets
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> Unlimited Team
                    Members
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> Customer Tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> Email Campaigns
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> SLA Management
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> Public Portal
                  </li>
                </ul>
              </div>

              {/* Contact Support */}
              <div className="pt-6 border-t border-slate-200">
                <p className="text-sm text-slate-600 mb-4">
                  Need to upgrade, downgrade, or cancel? Contact our support
                  team.
                </p>
                <a
                  href="mailto:support@tickly.com"
                  className="inline-block px-6 py-2 bg-slate-600 text-white font-medium rounded-lg hover:bg-slate-700 transition"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
