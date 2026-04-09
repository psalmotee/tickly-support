// used
/**
 * Tickly Widget Embed Script
 * 
 * Usage: Add this to your site's HTML:
 * <script src="https://yourapp.com/tickly-widget.js" data-website-id="YOUR_WEBSITE_TOKEN" data-theme-color="#3b82f6"></script>
 * <div id="tickly-widget-container"></div>
 */

(function () {
  // Get script configuration from data attributes
  const script = document.currentScript;
  const websiteId = script?.getAttribute("data-website-id");
  const themeColor = script?.getAttribute("data-theme-color") || "#3b82f6";

  if (!websiteId) {
    console.error(
      "Tickly Widget: Missing data-website-id attribute on script tag",
    );
    return;
  }

  // Find container
  const container = document.getElementById("tickly-widget-container");
  if (!container) {
    console.error(
      "Tickly Widget: Could not find #tickly-widget-container element",
    );
    return;
  }

  // Create iframe
  const iframeId = `tickly-widget-iframe-${Math.random().toString(36).substr(2, 9)}`;
  const iframeWrapper = document.createElement("div");
  iframeWrapper.innerHTML = `
    <iframe
      id="${iframeId}"
      src="${getWidgetUrl()}?websiteId=${encodeURIComponent(websiteId)}&primaryColor=${encodeURIComponent(themeColor)}"
      style="
        width: 100%;
        height: 100%;
        border: none;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      "
      title="Support Ticket Widget"
      allow="payment"
    ></iframe>
  `;

  container.appendChild(iframeWrapper);

  // Helper function to get widget URL
  function getWidgetUrl() {
    // In development, use localhost; in production, use the actual domain
    const protocol = window.location.protocol;
    const host = window.location.host.includes("localhost")
      ? "localhost:3000"
      : window.location.host;

    return `${protocol}//${host}/widget`;
  }

  // Message handling for responsive iframe (optional)
  window.addEventListener("message", function (event) {
    // Verify origin for security
    if (
      event.origin !==
      window.location.protocol + "//" + window.location.host
    ) {
      return;
    }

    if (event.data.type === "tickly-widget-resize") {
      const iframe = document.getElementById(iframeId);
      if (iframe) {
        iframe.style.height = event.data.height + "px";
      }
    }
  });
})();
