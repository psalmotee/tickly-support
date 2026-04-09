"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Campaign {
  id: string;
  campaign_name: string;
  subject: string;
  status: "draft" | "scheduled" | "sent";
  target_type: "all" | "tag";
  target_tag?: string;
  recipient_count: number;
  sent_count: number;
  created_at: string;
  users?: { full_name: string };
}

export default function CampaignsPage() {
  const params = useParams();
  const organizationId = (params.id as string) || "";

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    campaign_name: "",
    subject: "",
    body: "",
    target_type: "all" as "all" | "tag",
    target_tag: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, [organizationId]);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/organizations/${organizationId}/campaigns`,
      );

      if (!response.ok) {
        throw new Error("Failed to load campaigns");
      }

      const data = await response.json();
      setCampaigns(data.campaigns || []);
      setError("");
    } catch (err) {
      console.error("Error loading campaigns:", err);
      setError("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/admin/organizations/${organizationId}/campaigns`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create",
            ...formData,
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to create campaign");

      const data = await response.json();
      setCampaigns([data.campaign, ...campaigns]);
      setFormData({
        campaign_name: "",
        subject: "",
        body: "",
        target_type: "all",
        target_tag: "",
      });
      setShowForm(false);
      setError("");
    } catch (err) {
      console.error("Error creating campaign:", err);
      setError("Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    if (
      !confirm(
        "Are you sure? This will send the campaign to all target recipients.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/organizations/${organizationId}/campaigns/${campaignId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "send" }),
        },
      );

      if (!response.ok) throw new Error("Failed to send campaign");

      const data = await response.json();

      // Update campaign in list
      setCampaigns(
        campaigns.map((c) =>
          c.id === campaignId
            ? { ...c, status: "sent", sent_count: data.sentCount }
            : c,
        ),
      );
    } catch (err) {
      console.error("Error sending campaign:", err);
      setError("Failed to send campaign");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "sent":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage email campaigns for your customers
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="mb-6">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
            >
              Create Campaign
            </button>
          ) : (
            <div className="p-6 rounded-lg border border-border bg-card">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Create New Campaign
              </h2>

              <form onSubmit={handleCreateCampaign} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    value={formData.campaign_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        campaign_name: e.target.value,
                      })
                    }
                    required
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                    placeholder="Email subject line"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Message Body
                  </label>
                  <textarea
                    value={formData.body}
                    onChange={(e) =>
                      setFormData({ ...formData, body: e.target.value })
                    }
                    required
                    rows={6}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                    placeholder="Email message content"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Target Type
                    </label>
                    <select
                      value={formData.target_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          target_type: e.target.value as "all" | "tag",
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                    >
                      <option value="all">All Customers</option>
                      <option value="tag">By Tag</option>
                    </select>
                  </div>

                  {formData.target_type === "tag" && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Tag
                      </label>
                      <input
                        type="text"
                        value={formData.target_tag}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            target_tag: e.target.value,
                          })
                        }
                        required
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                        placeholder="e.g., vip, priority"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? "Creating..." : "Create Campaign"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading campaigns...</p>
        ) : campaigns.length === 0 ? (
          <div className="p-8 rounded-lg border border-border bg-card text-center">
            <p className="text-muted-foreground">No campaigns yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Create your first campaign to get started
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="p-6 rounded-lg border border-border bg-card hover:border-blue-400 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      {campaign.campaign_name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {campaign.subject}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}
                  >
                    {campaign.status.charAt(0).toUpperCase() +
                      campaign.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Target</p>
                    <p className="font-medium text-foreground">
                      {campaign.target_type === "all"
                        ? "All Customers"
                        : `Tag: ${campaign.target_tag}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Recipients</p>
                    <p className="font-medium text-foreground">
                      {campaign.recipient_count}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sent</p>
                    <p className="font-medium text-foreground">
                      {campaign.sent_count}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium text-foreground">
                      {formatDate(campaign.created_at)}
                    </p>
                  </div>
                </div>

                {campaign.status === "draft" && (
                  <button
                    onClick={() => handleSendCampaign(campaign.id)}
                    className="mt-3 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
                  >
                    Send Campaign
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
