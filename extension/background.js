/**
 * Service worker: fetches the SDK from the guide server and injects it
 * into the page using chrome.scripting.executeScript, which bypasses CSP.
 */

var SERVER = "https://ahtesham.dev.wadwarehouse.com/guide";
var sdkCache = null;

// Fetch and cache the SDK code
async function fetchSDK() {
  if (sdkCache) return sdkCache;
  var res = await fetch(SERVER + "/sdk.js");
  if (!res.ok) throw new Error("SDK fetch failed: " + res.status);
  sdkCache = await res.text();
  return sdkCache;
}

// Listen for injection requests from content scripts
chrome.runtime.onMessage.addListener(function (msg, sender) {
  if (msg.type !== "inject-sdk" || !sender.tab) return;

  var tabId = sender.tab.id;

  fetchSDK().then(function (sdkCode) {
    // Inject the SDK code directly into the page
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      world: "MAIN",
      func: function (code, server) {
        // Execute the SDK
        var script = document.createElement("script");
        script.textContent = code;
        document.head.appendChild(script);
        script.remove();

        // Boot with user info from Supabase auth
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
      args: [sdkCode, SERVER]
    });
  }).catch(function (err) {
    console.error("[OpenEvent Guide] SDK injection failed:", err);
  });
});
