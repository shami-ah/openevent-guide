# Handover: enabling the OpenEvent Guide (and its microphone) on staging

**For:** whoever picks up the deployment side, and the Claude session helping them.
**Written:** 2026-09-23. Every "current state" line below was verified live on that date.
**Repo to change:** `fsoell/OpeneventGithub`, branch `staging`.
**Repo that is already done:** `shami-ah/openevent-guide` — no changes needed there.

---

## 1. What this is

The OpenEvent Guide is an AI onboarding assistant that runs inside the OpenEvent
app. The user asks a question in plain language; the guide answers and, where it
helps, drives the browser — navigating, highlighting the right control and
narrating each step. It has a chat mode and a voice mode (a live WebRTC call).

The guide's own repo is finished. What is left is three changes in the OpenEvent
app's deployment. Until they land:

- the guide only reaches the app through a Chrome extension, and
- **voice cannot work at all**, because nginx sends a header that forbids the
  microphone.

---

## 2. Current state, verified 2026-09-23

| Thing | State |
|---|---|
| Guide server `https://ahtesham.dev.wadwarehouse.com/guide/` | Live and healthy. `GET /guide/health` returns `{"status":"ok"}` |
| CORS on the guide server | Already allows `https://app.test.openevent.io` |
| `https://app.test.openevent.io/guide/sdk.js` | **404.** The nginx proxy does not exist yet |
| `index.html` on `staging` | Contains only the meta-CSP allowlist entry for `ahtesham.dev.wadwarehouse.com`. There is **no** `<script>` tag and **no** `boot()` call |
| `Permissions-Policy` on staging | `camera=(), microphone=(), geolocation=(self), payment=(self "https://*.stripe.com")` |
| `GUIDE_API_TOKEN` on the guide server | **Not set.** `/api/*` is open to anyone who knows the URL |

Re-check any of these before starting:

```bash
curl -sI https://app.test.openevent.io/ | grep -i permissions-policy
curl -sI https://app.test.openevent.io/guide/sdk.js | head -1
curl -s  https://ahtesham.dev.wadwarehouse.com/guide/health
```

---

## 3. Connecting to the guide today, with nothing deployed

This is chat only. Voice will not work on this path, and no amount of changing
Chrome's site settings will make it work — see section 5.

```bash
git clone https://github.com/shami-ah/openevent-guide.git
cd openevent-guide
npm install
npm run build:sdk        # refreshes extension/sdk.js — required, it is a build artifact
```

Then `chrome://extensions` → enable Developer mode → **Load unpacked** →
select the `extension/` folder. Open `app.test.openevent.io` and the widget
appears.

The extension exists only to work around two page restrictions during
development: `script-src 'self'` (worked around with `chrome.scripting`) and
`connect-src` (worked around by proxying fetches through the service worker).
Once section 4 is deployed the extension is unnecessary and should be
uninstalled, otherwise it keeps injecting a bundle that drifts out of sync with
the server.

---

## 4. The three changes that make it work properly

All three are in `fsoell/OpeneventGithub` on `staging`.

### Change 1 — proxy the guide through the app's own origin

Add this next to the other `location` blocks inside the nginx `server { }`
block:

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

The nginx config is not a file in the repo. It is heredoc'd onto the VPS by the
deploy workflow, and **the same template appears twice in the same file** —
once in the step "Ensure staging nginx config on VPS (attempt 1)" and once in
the identical retry step "(attempt 2)". Both copies need the block. If only one
is changed, a deploy that hits the retry path silently reverts it.

Find both server blocks:

```bash
grep -n "^\s*server {" .github/workflows/deploy-test-react.yml
# as of 2026-09-23: lines 188 and 373
```

The template already has `resolver 8.8.8.8 1.1.1.1 valid=300s;` in it, which
`proxy_pass` to an external hostname needs. Do not remove it.

**Do not put an `add_header` directive inside the new `location` block.** In
nginx, a single `add_header` in a location discards every `add_header` inherited
from the server block — HSTS, CSP, `X-Frame-Options`, all of them. The block
above deliberately has none, so it inherits correctly.

### Change 2 — boot the SDK from `index.html`

In `index.html`, where third-party widgets are loaded:

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
      // token: "<GUIDE_API_TOKEN>",  // only once the server runs with one set
    });
  });
</script>
```

Because this is same-origin, `script-src 'self'` covers `/guide/sdk.js` and
`connect-src 'self'` covers `/guide/api/*`. **No CSP change is required.**

### Change 3 — the microphone header

This is the actual blocker for voice.

```diff
- add_header Permissions-Policy "camera=(), microphone=(), geolocation=(self), payment=(self \"https://*.stripe.com\")" always;
+ add_header Permissions-Policy "camera=(), microphone=(self), geolocation=(self), payment=(self \"https://*.stripe.com\")" always;
```

It is one line conceptually and ten identical lines in practice, copy-pasted
across three workflow files:

| File | Occurrences | Line numbers as of 2026-09-23 | Scope |
|---|---|---|---|
| `.github/workflows/deploy-test-react.yml` | 6 | 223, 315, 336, 408, 500, 521 | staging (attempt 1 + retry copy) |
| `.github/workflows/repair-staging-nginx.yml` | 3 | 72, 157, 178 | staging manual repair path |
| `.github/workflows/deploy-react.yml` | 1 | 270 | **production — do not change yet** |

Line numbers drift. Locate them fresh instead of trusting the table:

```bash
grep -rn "Permissions-Policy" .github/workflows/
```

Change the **seven staging lines** now. Leave the production line until staging
has run for a couple of weeks, then ship the identical diff.

---

## 5. Why there is no client-side workaround

Worth reading before anyone spends a day on this. `microphone=()` is an **empty
allowlist**. It does not mean "ask the user" — it means *no origin may use the
microphone in this document, including the page's own origin*. The browser
applies it before it would ever consider showing a prompt, so
`navigator.mediaDevices.getUserMedia({ audio: true })` rejects immediately.
Granting microphone access in Chrome's site settings changes nothing.

Three approaches look like they should get around it and do not:

- **The Chrome extension.** Content scripts and `world: "MAIN"` injections run
  *inside that document* and inherit its Permissions-Policy. This is different
  from CSP, where extensions genuinely do get an exemption — which is why the
  extension's `script-src` and `connect-src` workarounds succeed and this one
  cannot.
- **An iframe with `allow="microphone"`.** Permissions Policy is hierarchical: a
  frame receives the *intersection* of its parent's policy and its own `allow`
  attribute. `allow=` delegates a permission the parent already holds; it cannot
  create one. With `microphone=()` on the parent, no descendant can ever have it.
- **The Web Speech API** (`SpeechRecognition`) instead of WebRTC. Same
  permission, same block.

There is one genuine workaround, and it is demo scaffolding rather than a
shipping design: capture the microphone from the **extension's own origin** via
an MV3 offscreen document (`chrome.offscreen.createDocument`, reason
`USER_MEDIA`), and relay tool calls to the content script. `chrome-extension://`
pages have their own Permissions-Policy. Chrome will not show a permission
prompt *from* an offscreen document, so the grant has to be obtained once from a
normal extension page first.

---

## 6. For the security reviewer

The ask is `microphone=()` → `microphone=(self)` on staging. Precisely what that
does and does not do:

- It allows the app's **own origin** to *request* the microphone. It does not
  grant access. Chrome still shows its permission prompt, the user still has to
  accept, and the choice is still revocable from the address bar.
- `camera=()` is untouched. So is everything else in the header.
- **No CSP directive is widened.** `script-src`, `connect-src` and `frame-src`
  stay exactly as they are. This is possible because the SDP handshake for the
  voice call is proxied through the guide server rather than going from the page
  to `api.openai.com`:

  ```
  browser  ->  POST /guide/api/voice-session   (ephemeral token + instructions)
  browser  ->  POST /guide/api/voice-sdp       (SDP offer, proxied to OpenAI)
  browser <-> OpenAI                           (audio, over WebRTC)
  ```

  The page only ever contacts its own origin. Audio still flows
  browser-to-OpenAI directly; only the handshake is brokered.
- Third-party frames gain nothing. `(self)` delegates to the top-level origin
  only, so Stripe, Chatwoot and the rest still cannot reach the microphone.

---

## 7. Traps that cost the most time

1. **The meta CSP in `index.html` is not the binding policy.** It already lists
   `https://ahtesham.dev.wadwarehouse.com` in `script-src` and `connect-src`,
   but the nginx `Content-Security-Policy` **header** does not. A browser
   enforces every policy it receives, so the stricter header wins and a
   cross-origin `<script>` to the guide server fails. This is the reason the
   same-origin `/guide/` proxy is the right integration, not a direct script tag.
2. **The nginx template is written on every deploy.** Anything hand-edited on
   the VPS is gone at the next deploy. Changes belong in the workflow files.
3. **The same template exists twice per workflow file** (attempt 1 and its retry
   copy). Change every occurrence.
4. **`add_header` inside a `location` block drops all inherited headers.** See
   change 1.
5. **`npm run build:sdk` after any SDK change**, or the extension injects a stale
   bundle. `npm run check:bundle` fails if it has drifted.

---

## 8. Before this goes anywhere near production

The guide server currently runs on a personal VPS
(`ahtesham.dev.wadwarehouse.com`) with **no API token set**, meaning anyone who
finds the URL can spend the OpenAI key behind it. Three things to do first:

1. Set `GUIDE_API_TOKEN` on the server and pass the matching `token` in
   `boot()`.
2. Set `GUIDE_ALLOWED_ORIGINS=https://app.test.openevent.io,https://app.openevent.io`.
3. Move the server onto OpenEvent infrastructure and repoint the `proxy_pass`.

Also re-verify the OpenAI Realtime endpoints against their current API. The
guide defaults to `/v1/realtime/sessions` and `/v1/realtime` with the
`OpenAI-Beta: realtime=v1` header; the GA API uses
`/v1/realtime/client_secrets` and `/v1/realtime/calls`. If they have moved, set
`GUIDE_REALTIME_SESSION_URL` and `GUIDE_REALTIME_SDP_URL` rather than editing
code.

---

## 9. Definition of done

After the staging deploy runs:

```bash
# 1. The header now allows self
curl -sI https://app.test.openevent.io/ | grep -i permissions-policy
#    expect: microphone=(self)

# 2. The guide is served same-origin
curl -sI https://app.test.openevent.io/guide/sdk.js | head -1   # expect: 200
curl -s  https://app.test.openevent.io/guide/health             # expect: {"status":"ok",...}
```

Then in the browser console on any app page:

```js
document.featurePolicy.allowsFeature("microphone")   // must be true
window.OpenEventGuide.diagnostics()                  // { available: true, ... }
```

`diagnostics()` reports exactly why voice is unavailable when it is, so this
never has to be guessed at.

Finally, click **Start call** and confirm all three:

- Chrome shows its microphone prompt. It did not before.
- The call connects and the browser's recording indicator appears.
- Ending the call makes the recording indicator **disappear**. If it stays lit,
  the microphone tracks are not being stopped.

---

## 10. Further reading

Both in the `shami-ah/openevent-guide` repo:

- `docs/voice-call-fix.md` — the long-form version of this document, including
  what was already fixed on the guide side.
- `docs/app-side-hooks.md` — elements the guide wants to highlight that have no
  stable selector in the app yet.
- `README.md` — architecture, flow authoring, `boot()` options.
