// used
"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "./auth-provider";
import { FormError } from "./form-error";
import { Trash2, UserPlus, Copy, Check } from "lucide-react";

interface TeamMember {
  userId: string;
  email: string;
  fullName: string;
  role: "admin" | "agent" | "viewer";
  createdAt: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: "admin" | "agent" | "viewer";
  expiresAt: string;
  createdAt: string;
}

interface TeamManagementProps {
  organizationId: string;
}

export function TeamManagement({ organizationId }: TeamManagementProps) {
  const { session } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "agent" | "viewer">(
    "agent",
  );
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamData();
  }, [organizationId]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `/api/admin/organizations/${organizationId}/members`,
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage =
          errorData.error ||
          `Failed to fetch team data: ${res.status} ${res.statusText}`;
        console.error("[team-management] Fetch failed:", {
          status: res.status,
          statusText: res.statusText,
          error: errorData,
        });
        throw new Error(errorMessage);
      }

      const data = await res.json();
      console.log("[team-management] Fetched data:", {
        memberCount: data.members?.length,
        inviteCount: data.pendingInvites?.length,
      });
      setMembers(data.members || []);
      setPendingInvites(data.pendingInvites || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load team members";
      console.error("[team-management] Error:", errorMessage, err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess("");
    setInviting(true);

    try {
      if (!inviteEmail.trim()) {
        setInviteError("Email is required");
        setInviting(false);
        return;
      }

      const res = await fetch("/api/admin/organizations/invite-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
          organizationId: organizationId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send invite");
      }

      setInviteEmail("");
      setInviteSuccess(`Invite sent to ${inviteEmail}`);
      setTimeout(() => setInviteSuccess(""), 5000);
      await fetchTeamData();
    } catch (err) {
      setInviteError(
        err instanceof Error ? err.message : "Failed to send invite",
      );
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!confirm(`Remove ${userName} from the organization?`)) return;

    try {
      const res = await fetch(
        `/api/admin/organizations/${organizationId}/members`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove member");
      }

      await fetchTeamData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(
        `/api/admin/organizations/${organizationId}/members`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            role: newRole,
          }),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update role");
      }

      setEditingRole(null);
      await fetchTeamData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/join?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopySuccess(token);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">Loading team members...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && <FormError message={error} />}

      {/* Invite New Member Form */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Invite Team Member
        </h3>

        {inviteError && <FormError message={inviteError} />}
        {inviteSuccess && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
            {inviteSuccess}
          </div>
        )}

        <form onSubmit={handleInvite} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label
                htmlFor="inviteEmail"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Email address
              </label>
              <input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="team@example.com"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={inviting}
              />
            </div>

            <div>
              <label
                htmlFor="inviteRole"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Role
              </label>
              <select
                id="inviteRole"
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as "admin" | "agent" | "viewer")
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={inviting}
              >
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={inviting}
                className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                {inviting ? "Sending..." : "Invite"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Current Members */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Team Members ({members.length})
        </h3>

        {members.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No team members yet. Invite your team to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-4"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {member.fullName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {member.email}
                  </p>
                </div>

                {editingRole === member.userId ? (
                  <div className="flex gap-2">
                    <select
                      value={
                        members.find((m) => m.userId === member.userId)?.role ||
                        "agent"
                      }
                      onChange={(e) =>
                        handleUpdateRole(
                          member.userId,
                          e.target.value as "admin" | "agent" | "viewer",
                        )
                      }
                      className="rounded-lg border border-input bg-background px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="agent">Agent</option>
                      <option value="admin">Admin</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setEditingRole(member.userId)}
                      className="px-3 py-1 text-sm rounded-lg border border-input hover:bg-background/50 transition-colors text-foreground"
                    >
                      {member.role}
                    </button>

                    {session?.user.id !== member.userId && (
                      <button
                        onClick={() =>
                          handleRemoveMember(member.userId, member.fullName)
                        }
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Pending Invites ({pendingInvites.length})
          </h3>

          <div className="space-y-3">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-4"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground">{invite.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 text-sm rounded-lg bg-primary/10 text-primary border border-primary/20">
                    {invite.role}
                  </span>

                  <button
                    onClick={() => {
                      // TODO: Implement revoke invite functionality
                      alert("Revoke invite - to be implemented");
                    }}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    title="Revoke invite"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role Guide */}
      <div className="rounded-lg border border-border/50 bg-background/50 p-6">
        <h4 className="font-semibold text-foreground mb-3">Role Permissions</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-foreground mb-2">Agent</p>
            <ul className="text-muted-foreground space-y-1">
              <li>✓ View assigned tickets</li>
              <li>✓ Update ticket status</li>
              <li>✓ Add ticket responses</li>
              <li>✗ Manage team members</li>
              <li>✗ View analytics</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground mb-2">Admin</p>
            <ul className="text-muted-foreground space-y-1">
              <li>✓ All agent permissions</li>
              <li>✓ Manage team members</li>
              <li>✓ Manage organization settings</li>
              <li>✓ View analytics & reports</li>
              <li>✓ Configure custom fields</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground mb-2">Viewer</p>
            <ul className="text-muted-foreground space-y-1">
              <li>✓ View all tickets</li>
              <li>✓ View analytics & reports</li>
              <li>✗ Respond to tickets</li>
              <li>✗ Manage team members</li>
              <li>✗ Manage settings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
