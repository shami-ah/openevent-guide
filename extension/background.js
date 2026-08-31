/**
 * Service worker: injects the SDK and proxies API calls.
 *
 * The extension exists so the guide can be demoed on OpenEvent without
 * touching the app's deployment. Two page-level restrictions make it
 * necessary:
 *
 *   - script-src 'self' blocks a <script src> from our server, so the SDK is
 *     injected with chrome.scripting instead.
 *   - connect-src does not list our server, so fetches are proxied through
 *     here, where extension privileges apply instead of the page's CSP.
 *
 * It cannot work around Permissions-Policy: microphone=(). That is set on the
 * document and applies to injected code too. See docs/voice-call-fix.md.
 *
 * Production does not need any of this: serve the SDK from the app's own
 * origin and everything falls under 'self'.
 */

var SERVER = "https://ahtesham.dev.wadwarehouse.com/guide";

/** Set when the guide server runs with GUIDE_API_TOKEN. */
var API_TOKEN = "";

/** Supabase project refs whose stored session we accept, staging first. */
var SUPABASE_KEYS = [
  "sb-uwswrtnlqxbcrwcjxeqj-auth-token",
  "sb-igrfkpxebvuvfwogondx-auth-token",
];

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (!sender.tab || !sender.tab.id) return;
  var tabId = sender.tab.id;

  if (msg.type === "inject-sdk") {
    injectSdk(tabId);
    return;
  }

  if (msg.type === "api-request") {
    var headers = Object.assign({}, msg.options && msg.options.headers);
    if (API_TOKEN && !headers.Authorization) headers.Authorization = "Bearer " + API_TOKEN;

    fetch(msg.url, {
      method: (msg.options && msg.options.method) || "GET",
      headers: headers,
      body: (msg.options && msg.options.body) || undefined,
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error((data && data.error) || "Request failed (" + res.status + ")");
          return data;
        });
      })
      .then(function (data) { sendResponse({ ok: true, data: data }); })
      .catch(function (err) { sendResponse({ ok: false, error: err.message }); });

    return true; // keep the response channel open
  }
});

function injectSdk(tabId) {
  chrome.scripting
    .executeScript({ target: { tabId: tabId }, world: "MAIN", files: ["sdk.js"] })
    .then(function () {
      return chrome.scripting.executeScript({
        target: { tabId: tabId },
        world: "MAIN",
        func: bootGuide,
        args: [SERVER, API_TOKEN, SUPABASE_KEYS],
      });
    })
    .catch(function (err) {
      console.error("[OpenEvent Guide] SDK injection failed:", err);
    });
}

/**
 * Runs in the page. Reads the Supabase session to identify the user, then
 * boots the SDK.
 */
function bootGuide(server, token, supabaseKeys) {
  /**
   * supabase-js v2 may store the session as plain JSON *or* as
   * "base64-" + base64url(JSON). The previous version assumed JSON, so on a
   * base64 session JSON.parse threw, the catch swallowed it, and every user
   * silently became "demo".
   */
  function parseStoredSession(raw) {
    if (!raw) return null;
    var text = raw;
    if (raw.indexOf("base64-") === 0) {
      var b64 = raw.slice(7).replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      var binary = atob(b64);
      var bytes = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      text = new TextDecoder().decode(bytes);
    }
    return JSON.parse(text);
  }

  var user = { user_id: "anonymous", name: "" };

  for (var i = 0; i < supabaseKeys.length; i++) {
    try {
      var parsed = parseStoredSession(localStorage.getItem(supabaseKeys[i]));
      if (!parsed) continue;
      var u = parsed.user || parsed;
      if (!u || !u.id) continue;
      user = {
        user_id: u.id,
        email: u.email || "",
        name: (u.user_metadata && (u.user_metadata.full_name || u.user_metadata.name)) || u.email || "",
      };
      break;
    } catch (e) {
      console.warn("[OpenEvent Guide] Could not read session from", supabaseKeys[i], e);
    }
  }

  var language = "en";
  try {
    language = localStorage.getItem("i18nextLng") || navigator.language || "en";
  } catch (e) { /* storage blocked */ }

  window.__oeGuideExtProxy = true;

  if (window.OpenEventGuide) {
    window.OpenEventGuide.boot({
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      language: language,
      server: server,
      token: token || undefined,
    });
  } else {
    console.error("[OpenEvent Guide] SDK did not load.");
  }
}
