"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, Plus, Copy, Check } from "lucide-react";

interface Website {
  id: string;
  name: string;
  domain: string;
  widget_token: string;
  primary_color: string;
  is_active: boolean;
  created_at: string;
}

export default function WebsitesManagementPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    primary_color: "#3b82f6",
    logo_url: "",
    description: "",
  });

  useEffect(() => {
    loadWebsites();
  }, []);

  const loadWebsites = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/websites");

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to load websites");
      }

      const data = await response.json();
      setWebsites(data.websites || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load websites");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.domain || !formData.primary_color) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const response = await fetch("/api/admin/websites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create website");
      }

      const data = await response.json();
      setWebsites([...websites, data.website]);
      setSuccess("Website created successfully!");
      setFormData({
        name: "",
        domain: "",
        primary_color: "#3b82f6",
        logo_url: "",
        description: "",
      });
      setShowForm(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create website");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWebsite = async (id: string) => {
    if (!confirm("Are you sure you want to delete this website?")) return;

    try {
      setDeletingId(id);
      const response = await fetch(`/api/admin/websites/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete website");
      }

      setWebsites(websites.filter((w) => w.id !== id));
      setSuccess("Website deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete website");
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading websites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/admin-dashboard"
            className="text-sm text-primary hover:text-primary/80 transition-colors mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Website Management
              </h1>
              <p className="text-muted-foreground mt-2">
                Create and manage websites for your support widget
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Website
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive font-medium">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-medium">✓ {success}</p>
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="mb-8 p-6 rounded-lg border border-border bg-card">
            <h2 className="text-lg font-semibold text-foreground mb-6">
              Create New Website
            </h2>
            <form onSubmit={handleCreateWebsite} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Website Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., My Company Support"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Domain *
                  </label>
                  <input
                    type="text"
                    value={formData.domain}
                    onChange={(e) =>
                      setFormData({ ...formData, domain: e.target.value })
                    }
                    placeholder="e.g., example.com"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Primary Color *
                  </label>
                  <input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        primary_color: e.target.value,
                      })
                    }
                    className="w-full h-10 rounded-lg border border-border cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) =>
                      setFormData({ ...formData, logo_url: e.target.value })
                    }
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Optional description for your website"
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {saving ? "Creating..." : "Create Website"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg border border-border text-foreground font-medium hover:bg-background/50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Websites List */}
        {websites.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <p className="text-lg font-semibold text-foreground mb-2">
              No websites yet
            </p>
            <p className="text-muted-foreground mb-6">
              Create your first website to get started with the support widget
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Website
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {websites.map((website) => (
              <div
                key={website.id}
                className="rounded-lg border border-border bg-card p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {website.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {website.domain}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteWebsite(website.id)}
                    disabled={deletingId === website.id}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {website.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {website.description}
                  </p>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Widget Token
                    </label>
                    <div className="flex gap-2 items-center">
                      <code className="flex-1 px-3 py-2 rounded bg-background text-sm text-muted-foreground truncate">
                        {website.widget_token}
                      </code>
                      <button
                        onClick={() =>
                          copyToClipboard(website.widget_token, website.id)
                        }
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        {copiedId === website.id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Primary Color
                    </label>
                    <div className="flex gap-2 items-center">
                      <div
                        className="w-8 h-8 rounded-lg border border-border"
                        style={{ backgroundColor: website.primary_color }}
                      ></div>
                      <code className="text-sm text-muted-foreground">
                        {website.primary_color}
                      </code>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/admin-dashboard/widget-settings?website=${website.id}`}
                      className="text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      View embed code →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
