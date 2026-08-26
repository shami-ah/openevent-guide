/**
 * OpenEvent Guide - Chrome Extension
 * Loads the SDK and boots it with the current user's info.
 * For development/demo only. Production uses a script tag in the app HTML.
 */

(function () {
  if (window.OpenEventGuide) return;

  var SERVER = "https://guide.openevent.io";

  var sdk = document.createElement("script");
  sdk.src = SERVER + "/sdk.js";
  sdk.onload = function () {
    // Try to get user info from the app's auth state
    var user = { user_id: "demo", name: "Demo" };
    try {
      var stored = localStorage.getItem("sb-igrfkpxebvuvfwogondx-auth-token");
      if (stored) {
        var parsed = JSON.parse(stored);
        var u = parsed.user || parsed;
        user = {
          user_id: u.id || "unknown",
          email: u.email || "",
          name: (u.user_metadata && u.user_metadata.full_name) || u.email || "User"
        };
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
