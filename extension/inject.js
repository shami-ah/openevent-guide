/**
 * OpenEvent Guide - Chrome Extension
 * For dev/demo: injects the SDK from the live server onto OpenEvent pages.
 * Production will use a script tag in the app HTML instead.
 */

(function () {
  if (window.OpenEventGuide) return;

  var SERVER = "https://ahtesham.dev.wadwarehouse.com/guide";

  var sdk = document.createElement("script");
  sdk.src = SERVER + "/sdk.js";
  sdk.onload = function () {
    var user = { user_id: "demo", name: "Demo" };
    try {
      // Try to get user info from Supabase auth (staging key)
      var keys = ["sb-uwswrtnlqxbcrwcjxeqj-auth-token", "sb-igrfkpxebvuvfwogondx-auth-token"];
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
    } catch (e) { /* ignore */ }

    window.OpenEventGuide.boot({
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      server: SERVER
    });
  };
  document.head.appendChild(sdk);
})();
