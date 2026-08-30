/**
 * Content script: asks the background service worker to fetch + inject the SDK.
 * This bypasses the page's CSP because chrome.scripting.executeScript
 * runs with extension permissions, not page permissions.
 */

(function () {
  if (window.__oeGuideLoaded) return;
  window.__oeGuideLoaded = true;
  chrome.runtime.sendMessage({ type: "inject-sdk" });
})();
