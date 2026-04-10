"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function InviteMemberPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "agent" | "viewer">("agent");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    // Get organization ID
    const fetchOrgId = async () => {
      try {
        const response = await fetch("/api/admin/organizations/current");
        const data = await response.json();
        if (response.ok) {
          setOrgId(data.organization.id);
        }
      } catch (err) {
        console.error("Failed to fetch organization:", err);
      }
    };

    fetchOrgId();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }

    if (!orgId) {
      setError("Organization not found");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/organizations/invite-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase(),
          role,
          organizationId: orgId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to invite member");
      }

      setSuccess(`Invitation sent to ${email}`);
      setEmail("");
      setRole("user");

      // Redirect after success
      setTimeout(() => {
        router.push("/admin-dashboard/users-list");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin-dashboard/users-list"
            className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block"
          >
            ← Back to Users
          </Link>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Invite Team Member
          </h1>
          <p className="text-lg text-slate-600">
            Add a new person to your organization team.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
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
              <p className="text-sm text-green-600 mt-2">
                Redirecting to team members list...
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                placeholder="team@example.com"
              />
              <p className="text-xs text-slate-500 mt-1">
                We'll send an invitation to this email address
              </p>
            </div>

            {/* Role */}
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Role *
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "admin" | "agent" | "viewer")
                }
                disabled={loading}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              >
                <option value="agent">Agent (View & Respond to Tickets)</option>
                <option value="admin">Admin (Full Access)</option>
                <option value="viewer">Viewer (Read-Only)</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                {role === "admin"
                  ? "Admins can manage all features and team members"
                  : role === "agent"
                    ? "Agents can view and respond to tickets"
                    : "Viewers can only view tickets and reports"}
              </p>
            </div>

            {/* Role Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">
                  Agent Permissions:
                </h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>✓ View assigned tickets</li>
                  <li>✓ Update ticket status</li>
                  <li>✓ Add ticket responses</li>
                  <li>✗ Manage team members</li>
                  <li>✗ View analytics</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">
                  Admin Permissions:
                </h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>✓ All agent permissions</li>
                  <li>✓ Manage team members</li>
                  <li>✓ Manage organization settings</li>
                  <li>✓ View analytics & reports</li>
                  <li>✓ Configure custom fields</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">
                  Viewer Permissions:
                </h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>✓ View all tickets</li>
                  <li>✓ View analytics & reports</li>
                  <li>✗ Respond to tickets</li>
                  <li>✗ Manage team members</li>
                  <li>✗ Manage settings</li>
                </ul>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6 border-t border-slate-200">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Sending Invitation...
                  </span>
                ) : (
                  "Send Invitation"
                )}
              </button>
              <Link
                href="/admin-dashboard/users-list"
                className="px-6 py-3 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition text-center"
              >
                Cancel
              </Link>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> An invitation email will be sent to the
              user with a link to create their account and set a password.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
