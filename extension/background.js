/**
 * Service worker: injects SDK + proxies API calls (CSP-immune).
 */

var SERVER = "https://ahtesham.dev.wadwarehouse.com/guide";

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (!sender.tab) return;
  var tabId = sender.tab.id;

  // ── Inject SDK ──────────────────────────────
  if (msg.type === "inject-sdk") {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      world: "MAIN",
      files: ["sdk.js"]
    }).then(function () {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        world: "MAIN",
        func: function (server) {
          // Tell SDK to use extension proxy for API calls
          window.__oeGuideExtProxy = true;

          var user = { user_id: "demo", name: "User" };
          try {
            var keys = [
              "sb-uwswrtnlqxbcrwcjxeqj-auth-token",
              "sb-igrfkpxebvuvfwogondx-auth-token"
            ];
            for (var i = 0; i < keys.length; i++) {
              var stored = localStorage.getItem(keys[i]);
              if (stored) {
                var parsed = JSON.parse(stored);
                var u = parsed.user || parsed;
                user = {
                  user_id: u.id || "unknown",
                  email: u.email || "",
                  name: (u.user_metadata && u.user_metadata.full_name) || u.email || "User"
                };
                break;
              }
            }
          } catch (e) {}

          if (window.OpenEventGuide) {
            window.OpenEventGuide.boot({
              user_id: user.user_id,
              email: user.email,
              name: user.name,
              server: server
            });
          }
        },
        args: [SERVER]
      });
    }).catch(function (err) {
      console.error("[OpenEvent Guide] SDK injection failed:", err);
    });
    return;
  }

  // ── Proxy API calls ─────────────────────────
  if (msg.type === "api-request") {
    fetch(msg.url, {
      method: msg.options.method || "GET",
      headers: msg.options.headers || {},
      body: msg.options.body || undefined
    })
      .then(function (res) { return res.json(); })
      .then(function (data) { sendResponse({ ok: true, data: data }); })
      .catch(function (err) { sendResponse({ ok: false, error: err.message }); });

    return true; // keep sendResponse channel open for async
  }
});
