"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  User as UserIcon,
  Search,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Modal } from "./modal";
import { PromoteDemoteModal } from "./promote-demote-modal";
import { handleAdminApiAuthRedirect } from "@/lib/admin-api-client";

interface AdminUser {
  id: string;
  fullName?: string;
  email?: string;
  role: "admin" | "user";
}

interface PaginationMeta {
  page: number;
  totalPages: number;
}

export function AdminUserList() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, totalPages: 1 });
  const [roleModal, setRoleModal] = useState<{
    isOpen: boolean;
    user: AdminUser | null;
    action: "promote" | "demote";
  }>({
    isOpen: false,
    user: null,
    action: "promote",
  });

  // Function to fetch data
  const fetchUsers = async (page: number, query: string = "") => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/admin-users-route?page=${page}&query=${encodeURIComponent(query)}`,
      );
      if (handleAdminApiAuthRedirect(res)) return;

      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        setMeta(data.meta ?? { page: 1, totalPages: 1 });
      } else {
        toast.error(data.error || "Failed to load users");
      }
    } catch {
      toast.error("An error occurred while fetching users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, "");
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers(1, searchQuery);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";

    setUpdatingId(userId);
    try {
      const res = await fetch("/api/admin/admin-users-route/update-role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newRole }),
      });

      if (handleAdminApiAuthRedirect(res)) return;

      const data = await res.json();

      if (data.success) {
        setUsers((prevUsers) =>
          prevUsers.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
        );
        toast.success(`User is now an ${newRole}`);
      } else {
        toast.error(data.error || "Failed to update role");
      }
    } catch {
      toast.error("Failed to update role");
    } finally {
      setUpdatingId(null);
    }
  };

  const openRoleModal = (user: AdminUser) => {
    setRoleModal({
      isOpen: true,
      user,
      action: user.role === "admin" ? "demote" : "promote",
    });
  };

  const closeRoleModal = () => {
    if (updatingId) return;
    setRoleModal({ isOpen: false, user: null, action: "promote" });
  };

  const confirmRoleUpdate = async () => {
    if (!roleModal.user) return;
    await handleToggleRole(roleModal.user.id, roleModal.user.role);
    setRoleModal({ isOpen: false, user: null, action: "promote" });
  };

  if (isLoading) return <div className="p-8 text-center">Loading users...</div>;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative max-w-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <input
          type="text"
          placeholder="Search name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-border rounded-md bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full">
          {/* ... Table Header ... */}
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-secondary/20 transition-colors"
              >
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {user.fullName || "Unknown User"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {user.email || "No email"}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${
                      user.role === "admin"
                        ? "bg-red-500/10 text-red-600"
                        : "bg-blue-500/10 text-blue-600"
                    }`}
                  >
                    {user.role === "admin" ? (
                      <ShieldAlert className="h-3 w-3" />
                    ) : (
                      <ShieldCheck className="h-3 w-3" />
                    )}
                    {user.role.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    disabled={updatingId === user.id}
                    onClick={() => openRoleModal(user)}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 disabled:opacity-50"
                  >
                    {updatingId === user.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : user.role === "admin" ? (
                      "Demote to User"
                    ) : (
                      "Promote to Admin"
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2 py-4">
        <p className="text-sm text-muted-foreground">
          Page <strong>{meta.page}</strong> of{" "}
          <strong>{meta.totalPages}</strong>
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => fetchUsers(meta.page - 1, searchQuery)}
            disabled={meta.page <= 1 || isLoading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border bg-background text-sm font-medium hover:bg-secondary disabled:opacity-50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <button
            onClick={() => fetchUsers(meta.page + 1, searchQuery)}
            disabled={meta.page >= meta.totalPages || isLoading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border bg-background text-sm font-medium hover:bg-secondary disabled:opacity-50 transition-colors"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Modal
        isOpen={roleModal.isOpen}
        onClose={closeRoleModal}
        title={roleModal.action === "promote" ? "Promote User" : "Demote User"}
      >
        {roleModal.user && (
          <PromoteDemoteModal
            title={
              roleModal.action === "promote" ? "Promote User" : "Demote User"
            }
            description={
              roleModal.action === "promote"
                ? "Are you sure you want to grant admin access to this user?"
                : "Are you sure you want to remove admin access from this user?"
            }
            itemName={
              roleModal.user.fullName || roleModal.user.email || "this user"
            }
            action={roleModal.action}
            onConfirm={confirmRoleUpdate}
            onCancel={closeRoleModal}
            isLoading={updatingId === roleModal.user.id}
          />
        )}
      </Modal>
    </div>
  );
}
