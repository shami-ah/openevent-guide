/**
 * Content script: the bridge between the page and the service worker.
 *
 *   SDK (page) -> postMessage -> loader.js -> chrome.runtime -> background.js
 *
 * and the response back the same way.
 */

(function () {
  if (window.__oeGuideLoaded) return;
  window.__oeGuideLoaded = true;

  chrome.runtime.sendMessage({ type: "inject-sdk" });

  window.addEventListener("message", function (event) {
    // Only accept messages this page posted to itself.
    if (event.source !== window) return;
    if (event.origin !== window.location.origin) return;
    if (!event.data || event.data.source !== "oeg-sdk") return;
    if (event.data.type !== "api-request") return;

    var msg = event.data;

    chrome.runtime.sendMessage(
      { type: "api-request", url: msg.url, options: msg.options, reqId: msg.reqId },
      function (response) {
        window.postMessage(
          {
            source: "oeg-ext",
            type: "api-response",
            reqId: msg.reqId,
            response: response || { ok: false, error: "No response from the extension." },
          },
          window.location.origin
        );
      }
    );
  });
})();
