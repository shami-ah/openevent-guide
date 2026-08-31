# OpenEvent Guide

An AI onboarding assistant that lives inside OpenEvent. Users ask a question in
plain language; the guide answers, and where it helps, drives their browser :
navigating, highlighting the right control, and narrating each step on screen.

## Architecture

```
┌──────────────────────────────┐        HTTPS         ┌────────────────────┐
│  SDK (runs in the OpenEvent  │ ───────────────────► │   Guide server     │
│  page: chat UI, overlay,     │   POST /api/chat     │   (Hono + OpenAI)  │
│  command executor)           │ ◄─────────────────── │                    │
└──────────────┬───────────────┘   reply + commands   └────────────────────┘
               │
               │ executes against the real DOM
               ▼
      navigate · highlight · click · fill · scroll · subtitle
```

**The brain** (`src/server/brain.ts`) runs the chat model with the product
knowledge base and the flow list. It can answer in words, or trigger a
predefined flow. It cannot invent CSS selectors, because it cannot see the page
and every selector it invented was wrong.

**Flows** (`src/flows/registry.ts`) are short scripted walkthroughs, authored in
EN, DE and FR. Every navigation target is checked against a route manifest and
every element target against a selector registry.

**The executor** (`src/agent/executor.ts`) runs commands in the page. It
navigates through the History API so the SPA is never reloaded, and reports
honestly when an element is not on screen.

**Voice** (`src/sdk/voice.ts`) is the same guide over a live WebRTC call. It
runs the same flows the chat side runs. See
[docs/voice-call-fix.md](docs/voice-call-fix.md) for its current deployment
blocker.

## Quick start

```bash
npm install
cp .env.example .env          # add your OPENAI_API_KEY
npm run build:sdk             # build the injectable bundle
npm run dev                   # server on http://localhost:3847
```

Open <http://localhost:3847> for the demo page.

## Verifying a change

```bash
npm run verify        # typecheck + tests
npm run test:watch    # while working
```

The test suite exists because of bugs that reached users. It asserts that every
flow navigates to a route the app actually has, that every selector is valid
CSS, that no selector matches on visible text (which would break in DE and FR),
and that navigation uses the History API rather than reloading the page. See
`src/flows/registry.test.ts` and `src/agent/executor.test.ts`.

## Installing into OpenEvent

### Production: a script tag from the app's own origin

Proxy `/guide/` through OpenEvent's nginx to this server, then:

```html
<script src="/guide/sdk.js" defer></script>
<script>
  window.addEventListener("load", function () {
    window.OpenEventGuide.boot({
      user_id: currentUser.id,
      name: currentUser.name,
      language: i18n.language,   // "en" | "de" | "fr"
      server: "/guide",
    });
  });
</script>
```

Because everything is same-origin, OpenEvent's CSP needs no changes at all.
Full instructions in [docs/voice-call-fix.md](docs/voice-call-fix.md) §4.

### Development: the Chrome extension

`extension/` injects the SDK into OpenEvent without touching its deployment. It
exists to work around two page restrictions: `script-src 'self'` (worked around
with `chrome.scripting`) and `connect-src` (worked around by proxying fetches
through the service worker).

```bash
npm run build:sdk                    # refreshes extension/sdk.js
# chrome://extensions -> Developer mode -> Load unpacked -> extension/
```

`extension/sdk.js` is a build artifact. Run `npm run build:sdk` after any SDK
change or the extension will keep injecting a stale bundle;
`npm run check:bundle` fails if it has drifted.

## Configuration

`boot()` options:

| Option | Purpose |
|---|---|
| `user_id`, `name`, `email`, `team` | Who the guide is talking to. Reaches the model, so it can greet by name. |
| `language` | `en`, `de` or `fr`. Selects flow copy and the model's reply language. |
| `server` | Guide server base URL. Auto-detected from the script tag if omitted. |
| `token` | Shared secret, when the server runs with `GUIDE_API_TOKEN`. |
| `disableVoice` | Chat only. Voice is also disabled automatically when the microphone is blocked. |
| `disableTriggers` | Turn off proactive help offers. |

Server configuration lives in `.env`; see `.env.example`.

`window.OpenEventGuide.diagnostics()` reports whether voice is available and,
when it is not, exactly why.

## Adding a flow

Flows are authored in `src/flows/registry.ts`:

```ts
{
  id: "create-ticket-link",
  name: { en: "Create a Ticket Link", de: "Ticketlink erstellen", fr: "Creer un lien" },
  description: { en: "...", de: "...", fr: "..." },
  area: "ticketing",
  keywords: ["ticket link", "ticketlink", "lien billet"],
  steps: [
    { description: { en: "Let me take you to Ticketing.", de: "...", fr: "..." },
      command: { type: "navigate", path: "/ticketing" } },
    { description: { en: "This button creates a new link.", de: "...", fr: "..." },
      command: { type: "highlight", target: "ticketing.createLink", duration: 5000 } },
  ],
}
```

Two rules, both enforced by the tests:

1. `path` must exist in `src/shared/appRoutes.ts`.
2. `target` must exist in `src/flows/targets.ts`. Never inline a selector.

Adding a new element target means adding it to `targets.ts` with a stable
selector. If the app has no stable hook for it, add the entry with
`needsAppHook: true` and record it in [docs/app-side-hooks.md](docs/app-side-hooks.md).

## Layout

```
src/
  shared/     types, i18n helpers, the verified route manifest
  flows/      flow registry, selector targets, product knowledge base
  server/     Hono server and the chat brain
  agent/      overlay rendering and the DOM command executor
  sdk/        widget UI, proactive triggers, voice
extension/    Chrome extension for development installs
docs/         deployment and integration notes
```
