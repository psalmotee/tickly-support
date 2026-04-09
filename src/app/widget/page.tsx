// used
"use client";

import { useState, useEffect } from "react";
import { WidgetForm } from "@/components/widget-form";

export default function WidgetPage() {
  const [websiteId, setWebsiteId] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Get query parameters from URL
    const searchParams = new URLSearchParams(window.location.search);
    const websiteIdParam = searchParams.get("websiteId");
    const colorParam = searchParams.get("primaryColor");

    if (websiteIdParam) {
      setWebsiteId(websiteIdParam);
    }

    if (colorParam) {
      setPrimaryColor(decodeURIComponent(colorParam));
    }

    setMounted(true);

    // Notify parent of height change when form loads
    if (window.parent !== window) {
      setTimeout(() => {
        const height = document.documentElement.scrollHeight;
        window.parent.postMessage(
          { type: "tickly-widget-resize", height },
          "*",
        );
      }, 100);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Notify parent of height changes on DOM changes
    function notifyHeightChange() {
      if (window.parent !== window) {
        const height = document.documentElement.scrollHeight;
        window.parent.postMessage(
          { type: "tickly-widget-resize", height },
          "*",
        );
      }
    }

    // Observe for DOM changes
    const observer = new MutationObserver(notifyHeightChange);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => observer.disconnect();
  }, [mounted]);

  if (!mounted) {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  if (!websiteId) {
    return (
      <div style={{ padding: "20px", color: "red" }}>
        Error: Missing website ID
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "white",
        padding: 0,
        margin: 0,
      }}
    >
      <WidgetForm
        websiteId={websiteId}
        theme={{
          primaryColor,
        }}
        onSubmitSuccess={() => {
          // Notify parent of form submission
          if (window.parent !== window) {
            window.parent.postMessage({ type: "tickly-widget-submitted" }, "*");
          }
        }}
      />
    </div>
  );
}
