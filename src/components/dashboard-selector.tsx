// used
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface OrganizationOption {
  id: string;
  name: string;
  memberRole: "owner" | "admin" | "agent" | "viewer";
}

interface WebsiteOption {
  id: string;
  name: string;
  domain: string;
}

interface DashboardSelectorProps {
  onOrgChange?: (orgId: string) => void;
  onWebsiteChange?: (websiteId: string | null) => void;
  initialOrgId?: string;
  initialWebsiteId?: string | null;
}

export function DashboardSelector({
  onOrgChange,
  onWebsiteChange,
  initialOrgId,
  initialWebsiteId,
}: DashboardSelectorProps) {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [websites, setWebsites] = useState<WebsiteOption[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>(
    initialOrgId || "",
  );
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string | null>(
    initialWebsiteId || null,
  );
  const [loading, setLoading] = useState(true);

  // Load organizations on mount
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const response = await fetch("/api/admin/organizations");

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              `Failed to load organizations (${response.status})`,
          );
        }

        const data = await response.json();

        if (data.organizations) {
          setOrganizations(data.organizations);
          if (!selectedOrgId && data.organizations.length > 0) {
            const firstOrgId = data.organizations[0].id;
            setSelectedOrgId(firstOrgId);
            onOrgChange?.(firstOrgId);
            // Load websites for the first org
            await loadWebsites(firstOrgId);
          }
        }
      } catch (error) {
        console.error("Failed to load organizations:", error);
      } finally {
        setLoading(false);
      }
    };

    loadOrganizations();
  }, []);

  const loadWebsites = async (orgId: string) => {
    try {
      if (!orgId) {
        console.error("Organization ID is required to load websites");
        return;
      }

      const response = await fetch(
        `/api/admin/organizations/${orgId}/websites`,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to load websites (${response.status})`,
        );
      }

      const data = await response.json();

      if (data.websites) {
        setWebsites(data.websites);
        setSelectedWebsiteId(null); // Reset website selection
        onWebsiteChange?.(null);
      }
    } catch (error) {
      console.error("Failed to load websites:", error);
      setWebsites([]); // Reset websites on error
    }
  };

  const handleOrgChange = (orgId: string) => {
    setSelectedOrgId(orgId);
    onOrgChange?.(orgId);
    loadWebsites(orgId);
  };

  const handleWebsiteChange = (websiteId: string | null) => {
    setSelectedWebsiteId(websiteId);
    onWebsiteChange?.(websiteId);
  };

  if (loading) {
    return (
      <div className="flex gap-2">
        <div className="h-10 bg-muted rounded-lg w-48 animate-pulse"></div>
        <div className="h-10 bg-muted rounded-lg w-48 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 flex-col sm:flex-row">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Organization
        </label>
        <select
          value={selectedOrgId}
          onChange={(e) => handleOrgChange(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[200px]"
        >
          <option value="">Select an organization</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name} ({org.memberRole})
            </option>
          ))}
        </select>
      </div>

      {websites.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Website (Optional)
          </label>
          <select
            value={selectedWebsiteId || ""}
            onChange={(e) => handleWebsiteChange(e.target.value || null)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[200px]"
          >
            <option value="">All Websites</option>
            {websites.map((website) => (
              <option key={website.id} value={website.id}>
                {website.name} ({website.domain})
              </option>
            ))}
          </select>
        </div>
      )}

      {organizations.length > 1 && (
        <div className="flex items-end">
          <button
            onClick={() => router.push("/admin-dashboard/settings")}
            className="rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground hover:bg-muted transition"
          >
            Manage Organizations
          </button>
        </div>
      )}
    </div>
  );
}
