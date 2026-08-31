# Voice calls: why the microphone is blocked, and how to fix it

Status: **blocked on a one-line header change in the OpenEvent deployment.**
Everything on the guide's side is done. This document is the handover for that
change, plus a workaround that gets voice running for a demo without touching
OpenEvent at all.

---

## 1. The symptom

Click **Start call** on `app.test.openevent.io` and the call never connects.
The browser reports a microphone permission error, and no permission prompt is
ever shown. Granting microphone access in Chrome's site settings changes
nothing.

## 2. The cause

nginx sends this header on every response from `app.test.openevent.io` and
`app.openevent.io`:

```
Permissions-Policy: camera=(), microphone=(), geolocation=(self), payment=(self "https://*.stripe.com")
```

`microphone=()` is an **empty allowlist**. It does not mean "ask the user", it
means *no origin may use the microphone in this document, including the page's
own origin*. The browser applies it before it would ever consider showing a
prompt, so `navigator.mediaDevices.getUserMedia({ audio: true })` rejects
immediately.

This is a deliberate hardening default, not an accident. It is correct for an
app that had no use for a microphone. It now has one.

### Where the header is set

In the OpenEvent app repo (`fsoell/OpeneventGithub`), inside the nginx config
that the deploy workflows write. It is copy-pasted once per server block:

| File | Occurrences | Environment |
|---|---|---|
| `.github/workflows/deploy-test-react.yml` | 6 | staging |
| `.github/workflows/repair-staging-nginx.yml` | 3 | staging repair path |
| `.github/workflows/deploy-react.yml` | 1 | production |

So "change one line" is really ten identical lines across three files. Change
staging first and leave production until it has been used for a while.

### Why it cannot be worked around from inside the page

Three approaches look like they should work and do not:

- **The Chrome extension.** Content scripts and `world: "MAIN"` injections run
  *inside that document* and inherit its Permissions-Policy. This is different
  from CSP, where extensions genuinely do get an exemption, which is why the
  extension's `script-src` and `connect-src` workarounds succeed and this one
  cannot.
- **An iframe with `allow="microphone"`.** Permissions Policy is hierarchical:
  a frame receives the *intersection* of its parent's policy and its own
  `allow` attribute. `allow=` delegates a permission the parent already holds;
  it cannot create one. With `microphone=()` on the parent, no descendant can
  ever have it.
- **The Web Speech API** (`SpeechRecognition`) instead of WebRTC. Same
  permission, same block.

There is no client-side fix. The header has to change.

## 3. The second blocker (already solved in this repo)

Even with the microphone allowed, the SDP handshake used to be a direct
`fetch("https://api.openai.com/v1/realtime...")` from the page. OpenEvent's CSP
does not list `api.openai.com` in `connect-src`, so that request is blocked.
It also bypassed the extension's fetch proxy, because it did not go through
`apiFetch`.

**This is fixed.** The handshake now goes through this server:

```
browser  ->  POST {guide}/api/voice-session   (ephemeral token + instructions)
browser  ->  POST {guide}/api/voice-sdp       (SDP offer, proxied to OpenAI)
browser <-> OpenAI                            (audio, over WebRTC)
```

The page only ever contacts the guide server over HTTPS. Audio still flows
browser-to-OpenAI directly; only the handshake is brokered. The practical
consequence: **`connect-src` does not need to be widened**, which removes the
part of the ask a reviewer would push back on hardest.

## 4. The fix, for production

Three steps. Only the third touches security headers.

### Step 1: serve the guide from the app's own origin

Add to the OpenEvent nginx server block:

```nginx
# The onboarding guide: SDK bundle and API, proxied so the page only ever
# talks to its own origin and no CSP directive needs widening.
location /guide/ {
    proxy_pass         https://ahtesham.dev.wadwarehouse.com/guide/;
    proxy_set_header   Host ahtesham.dev.wadwarehouse.com;
    proxy_ssl_server_name on;
    proxy_read_timeout 60s;
}
```

Now `https://app.test.openevent.io/guide/sdk.js` serves the SDK and
`/guide/api/*` reaches the guide server, both under `'self'`.

### Step 2: boot it with a script tag

In `index.html`, or wherever third-party widgets are loaded:

```html
<script src="/guide/sdk.js" defer></script>
<script>
  window.addEventListener("load", function () {
    window.OpenEventGuide.boot({
      user_id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      language: i18n.language,     // "en" | "de" | "fr"
      server: "/guide",
      token: "<GUIDE_API_TOKEN>",  // only if the server runs with one set
    });
  });
</script>
```

The Chrome extension is then unnecessary and should be uninstalled: no
`chrome.scripting` injection, no fetch proxy, no bundled `sdk.js` drifting out
of sync with the server.

**No CSP change is required for this step.** `script-src 'self'` covers
`/guide/sdk.js` and `connect-src 'self'` covers `/guide/api/*`.

### Step 3: the one header change

In all ten places listed above:

```diff
- add_header Permissions-Policy "camera=(), microphone=(), geolocation=(self), payment=(self \"https://*.stripe.com\")" always;
+ add_header Permissions-Policy "camera=(), microphone=(self), geolocation=(self), payment=(self \"https://*.stripe.com\")" always;
```

What this does and does not do, for the reviewer:

- It allows the app's **own origin** to *request* the microphone. It does not
  grant access. Chrome still shows its permission prompt, the user still has to
  accept, and the choice is still revocable from the address bar.
- `camera=()` is untouched. So is everything else.
- No CSP directive is widened. `script-src`, `connect-src` and `frame-src` stay
  exactly as they are.
- Third-party frames gain nothing: `(self)` delegates to the top-level origin
  only, so Stripe, Chatwoot and the rest still cannot reach the microphone.

Ship it to staging, leave it for a couple of weeks, then take it to production
with the same diff.

## 5. Getting a working demo before that lands

If the header change is going to take time, the microphone can be captured
from the **extension's own origin** instead, using an MV3 offscreen document.
`chrome-extension://` pages have their own Permissions-Policy and are not
subject to the page's CSP.

```
manifest.json   "permissions": ["offscreen", "scripting", "activeTab"]

background.js   chrome.offscreen.createDocument({
                  url: "offscreen.html",
                  reasons: ["USER_MEDIA"],
                  justification: "Voice session with the onboarding guide"
                })

offscreen.html  getUserMedia + RTCPeerConnection live here
                tool call arrives on the data channel
                  -> chrome.tabs.sendMessage(tabId, command)
                  -> content script runs it against the page DOM
```

One wrinkle worth knowing before starting: Chrome will not show a permission
prompt *from* an offscreen document. Grant it once from a normal extension
page (a small options page with a button that calls `getUserMedia`) and the
grant then persists for the extension origin.

This is demo scaffolding, not the shipping design. Step 4 is what ships.

## 6. Verifying the fix

Run these on `app.test.openevent.io` after the header change deploys.

```bash
# 1. The header now allows self
curl -sI https://app.test.openevent.io/ | grep -i permissions-policy
#    expect: microphone=(self)

# 2. The guide is served same-origin
curl -sI https://app.test.openevent.io/guide/sdk.js | head -1
curl -s  https://app.test.openevent.io/guide/health
```

Then in the browser console on any app page:

```js
document.featurePolicy.allowsFeature("microphone")   // must be true
window.OpenEventGuide.diagnostics()                  // { available: true, ... }
```

`diagnostics()` reports exactly why voice is unavailable when it is, so this
does not need to be guessed at again.

Finally, click **Start call** and confirm:

- Chrome shows its microphone prompt (it did not before).
- The call connects and the recording indicator appears.
- Ending the call makes the recording indicator **disappear**. If it stays lit,
  the microphone tracks are not being stopped, which is the bug fixed in
  `src/sdk/voice.ts` `cleanup()`.

## 7. What is already done, and what is left

Done in this repo:

- SDP handshake proxied through the guide server, so `connect-src` does not
  need widening (`src/server/index.ts`, `/api/voice-sdp`).
- Microphone availability detected up front via
  `document.featurePolicy.allowsFeature("microphone")`. When it is blocked, the
  welcome card offers chat only rather than a call button that cannot work
  (`src/sdk/voice.ts`, `checkMicAvailability`).
- `guide_flow` actually runs flows in voice mode. It previously printed
  "Starting guide: <id>" and did nothing, because the browser had no way to
  fetch the steps. `GET /api/flow/:id` now provides them.
- The voice agent gets the flow list and the product knowledge base in its
  session instructions, so it knows which flow ids exist.
- Free-form `highlight`/`click` tools removed from the voice agent. It can run
  a known flow or navigate to a known path; it cannot invent CSS selectors, the
  same guardrail the chat brain has.
- Mute toggles `track.enabled` instead of tearing down and rebuilding the
  session.
- `cleanup()` stops the microphone tracks, so the browser's recording
  indicator actually goes out when the call ends.
- Realtime model and both OpenAI endpoints are environment-overridable
  (`GUIDE_REALTIME_MODEL`, `GUIDE_REALTIME_SESSION_URL`,
  `GUIDE_REALTIME_SDP_URL`), because OpenAI has moved them before.

Left to do, outside this repo:

1. The `microphone=(self)` header change (section 4, step 3).
2. The nginx `/guide/` proxy and the script tag (section 4, steps 1 and 2).
3. Re-verify the Realtime endpoints against OpenAI's current API. This repo
   defaults to `/v1/realtime/sessions` and `/v1/realtime` with the
   `OpenAI-Beta: realtime=v1` header. If OpenAI has retired the beta path, set
   the two env vars rather than editing code.
