// used
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Website {
  id: string;
  name: string;
  domain: string;
  widget_token: string;
}

export default function WidgetSettingsPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadWebsites();
  }, []);

  const loadWebsites = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/websites");

      if (!response.ok) {
        throw new Error("Failed to load websites");
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
    return `<!-- Tickly Support Widget -->
<script src="${baseUrl}/tickly-widget.js" data-website-id="${website.widget_token}" data-theme-color="#3b82f6"></script>
<div id="tickly-widget-container" style="height: 600px;"></div>`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-muted-foreground">Loading...</p>
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
            className="text-sm text-blue-600 hover:underline mb-4 inline-block"
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
          <div className="text-center py-12">
            <p className="text-muted-foreground">No websites configured yet</p>
            <Link
              href="/admin-dashboard"
              className="mt-4 inline-block text-blue-600 hover:underline"
            >
              Configure your first website
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Website Selector */}
            <div className="p-6 rounded-lg border border-border bg-card">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Select Website
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {websites.map((website) => (
                  <button
                    key={website.id}
                    onClick={() => setSelectedWebsite(website)}
                    className={`p-4 rounded-lg border-2 text-left transition ${
                      selectedWebsite?.id === website.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-border bg-background hover:border-blue-300"
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
