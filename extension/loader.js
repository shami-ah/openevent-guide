/**
 * Content script: bridges between the SDK (page context) and
 * the background service worker (extension context, CSP-immune).
 *
 * SDK -> postMessage -> loader.js -> chrome.runtime -> background.js -> fetch
 * Result flows back the same way.
 */

(function () {
  if (window.__oeGuideLoaded) return;
  window.__oeGuideLoaded = true;

  // Ask background to inject the SDK
  chrome.runtime.sendMessage({ type: "inject-sdk" });

  // Relay API calls from SDK (page) to background (extension)
  window.addEventListener("message", function (event) {
    if (event.source !== window) return;
    if (!event.data || event.data.source !== "oeg-sdk") return;

    var msg = event.data;

    if (msg.type === "api-request") {
      chrome.runtime.sendMessage(
        { type: "api-request", url: msg.url, options: msg.options, reqId: msg.reqId },
        function (response) {
          window.postMessage({
            source: "oeg-ext",
            type: "api-response",
            reqId: msg.reqId,
            response: response
          }, "*");
        }
      );
    }
  });
})();
