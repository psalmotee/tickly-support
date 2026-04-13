// used
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";

interface Website {
  id: string;
  name: string;
  domain: string;
  widget_token: string;
}

export default function WidgetSettingsPage() {
  const searchParams = useSearchParams();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadWebsites();
  }, []);

  // Auto-select website from query parameter if provided
  useEffect(() => {
    const websiteId = searchParams.get("website");
    if (websiteId && websites.length > 0) {
      const website = websites.find((w) => w.id === websiteId);
      if (website) {
        setSelectedWebsite(website);
      }
    }
  }, [websites, searchParams]);

  const loadWebsites = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/websites");

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(
          "[widget-settings] API error:",
          response.status,
          errorData.error || "Unknown error",
        );
        throw new Error(
          errorData.error || `Failed to load websites (${response.status})`,
        );
      }

      const data = await response.json();
      setWebsites(data.websites || []);

      if (data.websites && data.websites.length > 0) {
        setSelectedWebsite(data.websites[0]);
      }
    } catch (error) {
      console.error("Error loading websites:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEmbedCode = (website: Website) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `<!-- IMPORTANT: Add this script tag and container div to your website -->
<!-- Place both lines together in your HTML body, preferably at the end -->

<!-- Step 1: Add the Tickly Widget Script -->
<script src="${baseUrl}/tickly-widget.js" data-website-id="${website.widget_token}" data-theme-color="#3b82f6"></script>

<!-- Step 2: Add the container div (REQUIRED) -->
<!-- Important: The container MUST have a defined height (min 600px recommended) -->
<div id="tickly-widget-container" style="height: 600px;"></div>`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading widgets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/admin-dashboard"
            className="text-sm text-primary hover:text-primary/80 transition-colors mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-foreground">
            Widget Embed Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Get the embed code to add our support widget to your website
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {websites.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <div className="mb-4">
              <p className="text-lg font-semibold text-foreground mb-2">
                No websites configured yet
              </p>
              <p className="text-muted-foreground mb-6">
                Create your first website to get started with widget embeds
              </p>
            </div>
            <Link
              href="/admin-dashboard/websites"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Configure Your First Website
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Website Selector */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Select Website
                </h2>
                <Link
                  href="/admin-dashboard/websites"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded text-sm bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Website
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {websites.map((website) => (
                  <button
                    key={website.id}
                    onClick={() => setSelectedWebsite(website)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedWebsite?.id === website.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background hover:border-primary/50"
                    }`}
                  >
                    <h3 className="font-semibold text-foreground">
                      {website.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {website.domain}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Embed Code */}
            {selectedWebsite && (
              <div className="p-6 rounded-lg border border-border bg-card">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Embed Code
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Copy this code and paste it into your website's HTML:
                </p>

                <div className="relative">
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm font-mono mb-4">
                    <code>{getEmbedCode(selectedWebsite)}</code>
                  </pre>

                  <button
                    onClick={() =>
                      copyToClipboard(getEmbedCode(selectedWebsite))
                    }
                    className="absolute top-2 right-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                  >
                    {copied ? "✓ Copied" : "Copy"}
                  </button>
                </div>

                {/* Configuration Guide */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Configuration Options
                  </h3>
                  <dl className="text-sm text-blue-800 space-y-2">
                    <div>
                      <dt className="font-mono">data-website-id</dt>
                      <dd className="text-blue-700">
                        Your widget token (required)
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono">data-theme-color</dt>
                      <dd className="text-blue-700">
                        Primary color in hex format (default: #3b82f6)
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Installation Instructions
              </h2>

              <ol className="space-y-4 text-sm">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">
                      Copy the embed code above
                    </p>
                    <p className="text-muted-foreground">
                      Click the "Copy" button to copy the code to your clipboard
                    </p>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">
                      Open your website's HTML
                    </p>
                    <p className="text-muted-foreground">
                      Find the location where you want to add the support widget
                      (usually in your footer or sidebar)
                    </p>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                    3
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">
                      Paste the code
                    </p>
                    <p className="text-muted-foreground">
                      Paste the embed code between any `&lt;body&gt;` tags
                    </p>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                    4
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">
                      Save and publish
                    </p>
                    <p className="text-muted-foreground">
                      Your support widget should now appear on your website!
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            {/* Troubleshooting Guide */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Troubleshooting: Widget Not Appearing?
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                If your widget isn't showing on your website, follow these
                debugging steps:
              </p>

              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                      1
                    </span>
                    Check Browser Console
                  </h3>
                  <p className="text-muted-foreground pl-7">
                    Open your browser's Developer Tools (F12), go to the
                    "Console" tab, and look for messages starting with{" "}
                    <code className="bg-slate-100 px-2 py-1 rounded text-xs">
                      [Tickly Widget]
                    </code>
                    . These tell you what's happening during initialization.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                      2
                    </span>
                    Verify Container Exists
                  </h3>
                  <p className="text-muted-foreground pl-7">
                    In the browser console, paste:{" "}
                    <code className="bg-slate-100 px-2 py-1 rounded text-xs">
                      document.getElementById('tickly-widget-container')
                    </code>
                    . If this returns{" "}
                    <code className="bg-slate-100 px-2 py-1 rounded text-xs">
                      null
                    </code>
                    , the container div is missing from your HTML.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                      3
                    </span>
                    Check Container Height
                  </h3>
                  <p className="text-muted-foreground pl-7">
                    The container must have a height of at least 600px. Your
                    embed code includes{" "}
                    <code className="bg-slate-100 px-2 py-1 rounded text-xs">
                      style="height: 600px;"
                    </code>{" "}
                    — don't remove this!
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                      4
                    </span>
                    Verify Script Loads
                  </h3>
                  <p className="text-muted-foreground pl-7">
                    In the Network tab of DevTools, look for a request to{" "}
                    <code className="bg-slate-100 px-2 py-1 rounded text-xs">
                      tickly-widget.js
                    </code>
                    . If it shows as failed (404 or 500), the script URL is
                    incorrect.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                      5
                    </span>
                    Test Script Directly
                  </h3>
                  <p className="text-muted-foreground pl-7">
                    Visit the script URL in your browser (e.g.,{" "}
                    <code className="bg-slate-100 px-2 py-1 rounded text-xs">
                      https://yourapp.com/tickly-widget.js
                    </code>
                    ) to make sure it returns JavaScript code, not an error.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                      6
                    </span>
                    Copy Full Console Output
                  </h3>
                  <p className="text-muted-foreground pl-7">
                    If you still see issues, right-click in the console and
                    select "Save as..." to save all console messages. Share
                    these logs with us for detailed debugging.
                  </p>
                </div>
              </div>
            </div>

            {/* Example HTML */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Example HTML Page
              </h2>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                <code>{`<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
</head>
<body>
    <!-- Your website content -->
    <h1>Welcome to My Site</h1>
    <p>Need help? Check out our support widget below!</p>

    <!-- Tickly Support Widget -->
    <script src="https://yourapp.com/tickly-widget.js" data-website-id="YOUR_WIDGET_TOKEN"></script>
    <div id="tickly-widget-container" style="height: 600px;"></div>
</body>
</html>`}</code>
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
