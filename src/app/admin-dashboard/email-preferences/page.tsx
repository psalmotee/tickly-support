"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface EmailPreferences {
  notify_new_tickets: boolean;
  notify_assignment: boolean;
  notify_status_changes: boolean;
  notify_daily_digest: boolean;
  digest_time: string;
}

export default function EmailPreferencesPage() {
  const params = useParams();
  const orgId = params.id as string;

  const [preferences, setPreferences] = useState<EmailPreferences>({
    notify_new_tickets: true,
    notify_assignment: true,
    notify_status_changes: true,
    notify_daily_digest: false,
    digest_time: "09:00",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [orgId]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/organizations/${orgId}/email-preferences`,
      );

      if (!response.ok) {
        throw new Error("Failed to load preferences");
      }

      const data = await response.json();
      setPreferences(data.preferences);
    } catch (err) {
      console.error("Error loading preferences:", err);
      setError("Failed to load preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof EmailPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: typeof prev[key] === "boolean" ? !prev[key] : prev[key],
    }));
    setSuccess(false);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreferences((prev) => ({
      ...prev,
      digest_time: e.target.value,
    }));
    setSuccess(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess(false);

      const response = await fetch(
        `/api/admin/organizations/${orgId}/email-preferences`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(preferences),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/admin-dashboard"
            className="text-sm text-blue-600 hover:underline mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-foreground">
            Email Preferences
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure your notification settings
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Notification Types */}
          <div className="p-6 rounded-lg border border-border bg-card">
            <h2 className="text-lg font-semibold text-foreground mb-6">
              Notification Types
            </h2>

            <div className="space-y-4">
              {/* New Tickets */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition">
                <div>
                  <h3 className="font-medium text-foreground">New Tickets</h3>
                  <p className="text-sm text-muted-foreground">
                    Get notified when new tickets are submitted via widget
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notify_new_tickets}
                  onChange={() => handleToggle("notify_new_tickets")}
                  className="w-5 h-5 rounded cursor-pointer"
                />
              </div>

              {/* Ticket Assignment */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition">
                <div>
                  <h3 className="font-medium text-foreground">
                    Ticket Assignment
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Get notified when a ticket is assigned to you
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notify_assignment}
                  onChange={() => handleToggle("notify_assignment")}
                  className="w-5 h-5 rounded cursor-pointer"
                />
              </div>

              {/* Status Changes */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition">
                <div>
                  <h3 className="font-medium text-foreground">
                    Status Updates
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Get notified when ticket statuses change
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notify_status_changes}
                  onChange={() => handleToggle("notify_status_changes")}
                  className="w-5 h-5 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Daily Digest */}
          <div className="p-6 rounded-lg border border-border bg-card">
            <h2 className="text-lg font-semibold text-foreground mb-6">
              Daily Digest
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition">
                <div>
                  <h3 className="font-medium text-foreground">
                    Enable Daily Summary
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Receive daily summaries of support activity
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notify_daily_digest}
                  onChange={() => handleToggle("notify_daily_digest")}
                  className="w-5 h-5 rounded cursor-pointer"
                />
              </div>

              {preferences.notify_daily_digest && (
                <div className="p-4 rounded-lg border border-border bg-muted/30">
                  <label
                    htmlFor="digest-time"
                    className="block font-medium text-foreground mb-2"
                  >
                    Digest Send Time
                  </label>
                  <input
                    id="digest-time"
                    type="time"
                    value={preferences.digest_time}
                    onChange={handleTimeChange}
                    className="w-32 px-3 py-2 border border-border rounded-lg"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    You'll receive your daily summary at this time (in your
                    timezone)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <p className="text-sm text-green-700">
                ✓ Preferences saved successfully
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
            >
              {saving ? "Saving..." : "Save Preferences"}
            </button>
            <Link
              href="/admin-dashboard"
              className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition"
            >
              Cancel
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
