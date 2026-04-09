"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface SLAMetric {
  ticketId: string;
  ticketNumber: string;
  title: string;
  customer_name: string;
  created_at: string;
  first_response_at?: string;
  resolved_at?: string;
  response_time_hours?: number;
  resolution_time_hours?: number;
  status: string;
  priority: string;
  breached: boolean;
  response_breached: boolean;
  resolution_breached: boolean;
}

interface SLAStats {
  total_tickets: number;
  sla_breaches: number;
  compliance_rate: number;
  avg_response_time: number;
  avg_resolution_time: number;
}

interface SLASettings {
  first_response_hours: number;
  resolution_hours: number;
}

export default function SLAPage() {
  const params = useParams();
  const organizationId = (params.id as string) || "";

  const [metrics, setMetrics] = useState<SLAMetric[]>([]);
  const [stats, setStats] = useState<SLAStats | null>(null);
  const [settings, setSettings] = useState<SLASettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingSettings, setEditingSettings] = useState(false);
  const [formData, setFormData] = useState({
    first_response_hours: 4,
    resolution_hours: 24,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    loadSLAData();
  }, [organizationId]);

  const loadSLAData = async () => {
    setLoading(true);
    try {
      const [metricsRes, statsRes, settingsRes] = await Promise.all([
        fetch(`/api/admin/organizations/${organizationId}/sla?action=metrics`),
        fetch(`/api/admin/organizations/${organizationId}/sla?action=stats`),
        fetch(`/api/admin/organizations/${organizationId}/sla?action=settings`),
      ]);

      if (!metricsRes.ok || !statsRes.ok || !settingsRes.ok) {
        throw new Error("Failed to load SLA data");
      }

      const metricsData = await metricsRes.json();
      const statsData = await statsRes.json();
      const settingsData = await settingsRes.json();

      setMetrics(metricsData.metrics || []);
      setStats(statsData.stats || null);
      setSettings(settingsData.settings || null);

      if (settingsData.settings) {
        setFormData({
          first_response_hours: settingsData.settings.first_response_hours,
          resolution_hours: settingsData.settings.resolution_hours,
        });
      }

      setError("");
    } catch (err) {
      console.error("Error loading SLA data:", err);
      setError("Failed to load SLA data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `/api/admin/organizations/${organizationId}/sla`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update_settings",
            first_response_hours: parseInt(
              formData.first_response_hours as any,
            ),
            resolution_hours: parseInt(formData.resolution_hours as any),
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to update settings");

      setEditingSettings(false);
      await loadSLAData();
    } catch (err) {
      console.error("Error updating settings:", err);
      setError("Failed to update SLA settings");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMetricColor = (value: number, threshold: number) => {
    return value > threshold ? "text-red-600 font-semibold" : "text-green-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <p className="text-muted-foreground">Loading SLA data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-foreground">SLA Tracking</h1>
          <p className="text-muted-foreground mt-2">
            Monitor service level agreements and response times
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* SLA Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-6 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-2">
                Compliance Rate
              </p>
              <p className="text-3xl font-bold text-foreground">
                {stats.compliance_rate}%
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.total_tickets - stats.sla_breaches} of{" "}
                {stats.total_tickets} on track
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-2">
                Avg Response Time
              </p>
              <p className="text-3xl font-bold text-foreground">
                {stats.avg_response_time}h
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Target: {settings?.first_response_hours || 4}h
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-2">
                Avg Resolution Time
              </p>
              <p className="text-3xl font-bold text-foreground">
                {stats.avg_resolution_time}h
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Target: {settings?.resolution_hours || 24}h
              </p>
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="mb-8 p-6 rounded-lg border border-border bg-card">
          {!editingSettings ? (
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  SLA Settings
                </h2>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      First Response Target
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {settings?.first_response_hours || 4} hours
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Resolution Target
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {settings?.resolution_hours || 24} hours
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setEditingSettings(true)}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
              >
                Edit
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdateSettings}>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Edit SLA Settings
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    First Response (hours)
                  </label>
                  <input
                    type="number"
                    value={formData.first_response_hours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        first_response_hours: e.target.value as any,
                      })
                    }
                    min="1"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Resolution (hours)
                  </label>
                  <input
                    type="number"
                    value={formData.resolution_hours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        resolution_hours: e.target.value as any,
                      })
                    }
                    min="1"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSettings(false)}
                  className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Metrics Table */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Ticket SLA Metrics
          </h2>

          {metrics.length === 0 ? (
            <div className="p-8 rounded-lg border border-border bg-card text-center">
              <p className="text-muted-foreground">No tickets to display</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-lg bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    <th className="px-4 py-3 text-left font-semibold text-foreground">
                      Ticket
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">
                      Response Time
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">
                      Resolution Time
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric) => (
                    <tr
                      key={metric.ticketId}
                      className="border-b border-border hover:bg-muted/50 transition"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">
                            #{metric.ticketNumber}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-xs">
                            {metric.title}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {metric.customer_name}
                      </td>
                      <td className="px-4 py-3">
                        {metric.response_time_hours !== undefined ? (
                          <span
                            className={getMetricColor(
                              metric.response_time_hours,
                              settings?.first_response_hours || 4,
                            )}
                          >
                            {metric.response_time_hours}h
                          </span>
                        ) : (
                          <span className="text-yellow-600">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {metric.resolution_time_hours !== undefined ? (
                          <span
                            className={getMetricColor(
                              metric.resolution_time_hours,
                              settings?.resolution_hours || 24,
                            )}
                          >
                            {metric.resolution_time_hours}h
                          </span>
                        ) : (
                          <span className="text-yellow-600">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {metric.breached ? (
                          <span className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium">
                            ⚠ Breached
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                            ✓ On Track
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
