// used
/**
 * Tickly Widget Embed Script
 *
 * Usage: Add this to your site's HTML:
 * <script src="https://yourapp.com/tickly-widget.js" data-website-id="YOUR_WEBSITE_TOKEN" data-theme-color="#3b82f6"></script>
 * <div id="tickly-widget-container" style="height: 600px;"></div>
 */

(function () {
  console.log("[Tickly Widget] Initializing...");

  // Get script configuration from data attributes
  const script = document.currentScript;
  const websiteId = script?.getAttribute("data-website-id");
  const themeColor = script?.getAttribute("data-theme-color") || "#3b82f6";

  console.log("[Tickly Widget] Config:", {
    websiteId,
    themeColor,
    hasScript: !!script,
  });

  if (!websiteId) {
    console.error(
      "Tickly Widget: Missing data-website-id attribute on script tag",
    );
    return;
  }

  // Find container - with retry logic
  const findContainer = () => {
    const container = document.getElementById("tickly-widget-container");
    if (container) {
      console.log("[Tickly Widget] Container found:", container);
      return container;
    }
    return null;
  };

  // Try to initialize with retries if needed
  const tryInitialize = () => {
    let container = findContainer();

    if (container) {
      initializeWidget(container);
      return;
    }

    console.warn(
      "[Tickly Widget] Container #tickly-widget-container not found yet. Will retry...",
    );

    // If DOM is still loading, wait for DOMContentLoaded
    if (document.readyState === "loading") {
      console.log(
        "[Tickly Widget] DOM still loading, waiting for DOMContentLoaded event...",
      );
      document.addEventListener("DOMContentLoaded", function () {
        console.log(
          "[Tickly Widget] DOMContentLoaded fired, checking for container again...",
        );
        container = findContainer();
        if (container) {
          initializeWidget(container);
        } else {
          console.error(
            "Tickly Widget: Could not find #tickly-widget-container element even after DOM load. Please ensure the div exists in your HTML.",
          );
        }
      });
      return;
    }

    // DOM is already loaded but container not found - try polling for a short time
    console.log("[Tickly Widget] DOM already loaded, polling for container...");
    let attempts = 0;
    const maxAttempts = 10;
    const pollInterval = setInterval(() => {
      attempts++;
      container = findContainer();
      if (container) {
        clearInterval(pollInterval);
        console.log(
          "[Tickly Widget] Container found after " + attempts + " polls",
        );
        initializeWidget(container);
        return;
      }

      if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
        console.error(
          "Tickly Widget: Could not find #tickly-widget-container element after " +
            maxAttempts +
            " attempts. Please check that:" +
            "\n1. The div with id='tickly-widget-container' exists in your HTML" +
            "\n2. The div has a style='height: 600px;' or similar height property" +
            "\n3. The script tag and div are in the same document" +
            "\n4. The div ID is spelled correctly (case-sensitive)",
        );
      }
    }, 100);
  };

  tryInitialize();

  function initializeWidget(container) {
    console.log("[Tickly Widget] Creating iframe...");

    // Ensure container has proper styling
    if (!container.style.height) {
      container.style.height = "600px";
    }

    // Create iframe
    const iframeId = `tickly-widget-iframe-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const iframeWrapper = document.createElement("div");
    iframeWrapper.style.width = "100%";
    iframeWrapper.style.height = "100%";

    const widgetUrl = getWidgetUrl();
    const iframeSrc = `${widgetUrl}?websiteId=${encodeURIComponent(
      websiteId,
    )}&primaryColor=${encodeURIComponent(themeColor)}`;

    console.log("[Tickly Widget] Loading iframe from:", iframeSrc);

    iframeWrapper.innerHTML = `
      <iframe
        id="${iframeId}"
        src="${iframeSrc}"
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
    console.log("[Tickly Widget] Iframe created and inserted");

    // Message handling for responsive iframe
    window.addEventListener("message", function (event) {
      if (event.data.type === "tickly-widget-resize") {
        const iframe = document.getElementById(iframeId);
        if (iframe && event.data.height) {
          console.log("[Tickly Widget] Resizing iframe to", event.data.height);
          iframe.style.height = event.data.height + "px";
        }
      }
    });
  }

  // Helper function to get widget URL
  function getWidgetUrl() {
    const protocol = window.location.protocol;
    const host = window.location.host;

    // For local development
    if (host.includes("localhost") || host.includes("127.0.0.1")) {
      return `${protocol}//localhost:3000/widget`;
    }

    // For production - same domain
    return `${protocol}//${host}/widget`;
  }

  console.log("[Tickly Widget] Setup complete");
})();
