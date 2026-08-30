/**
 * Service worker: injects the SDK + boot script into OpenEvent pages.
 * Uses chrome.scripting.executeScript with files (bypasses CSP completely).
 */

var SERVER = "https://ahtesham.dev.wadwarehouse.com/guide";

chrome.runtime.onMessage.addListener(function (msg, sender) {
  if (msg.type !== "inject-sdk" || !sender.tab) return;

  var tabId = sender.tab.id;

  // Step 1: inject the SDK (bundled in the extension, CSP-immune)
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    world: "MAIN",
    files: ["sdk.js"]
  }).then(function () {
    // Step 2: boot the SDK with user info
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      world: "MAIN",
      func: function (server) {
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
                name:
                  (u.user_metadata && u.user_metadata.full_name) ||
                  u.email ||
                  "User"
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
    console.error("[OpenEvent Guide] Injection failed:", err);
  });
});
