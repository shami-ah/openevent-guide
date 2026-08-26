# OpenEvent Guide

AI-powered interactive onboarding for OpenEvent. Users chat with the guide, and it controls their browser - navigating, highlighting, clicking, and explaining with subtitles.

## Architecture

```
┌─────────────┐     WebSocket      ┌──────────────┐     WebSocket      ┌──────────────┐
│  Chat Widget │ ◄──────────────── │    Server     │ ──────────────►  │ Browser Agent │
│  (floating)  │     messages      │  (brain +     │     commands     │ (DOM control) │
│              │                   │   routing)    │                   │              │
└─────────────┘                    └──────┬───────┘                    └──────────────┘
                                          │
                                    Claude API
                                  (function calling)
```

**Layer 1 - Brain:** Claude with OpenEvent product knowledge + function calling. Routes questions to either text answers or guided browser flows.

**Layer 3 - Browser Agent:** Injectable script that receives commands via WebSocket and executes them in the user's real browser (navigate, highlight, click, fill, scroll) with visual overlays and subtitles.

**Layer 2 - Voice (future):** OpenAI Realtime API for voice conversation. Architecture is ready - just needs the voice transport layer.

## Quick Start

```bash
# Install dependencies
npm install

# Set up your API key
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Build the injectable scripts
npm run build:widget
npm run build:agent

# Start the server
npm run dev

# Open http://localhost:3847 for the demo page
```

## Inject into OpenEvent

### Option 1: Bookmarklet
Visit http://localhost:3847, drag the "OpenEvent Guide" button to your bookmarks bar, then click it while on app.openevent.io.

### Option 2: Script tags
```html
<script src="http://localhost:3847/agent.js" data-guide-server="ws://localhost:3847"></script>
<script src="http://localhost:3847/widget.js" data-guide-server="http://localhost:3847"></script>
```

## Feature Coverage

The guide covers every major OpenEvent feature:
- Getting Started tour
- Events (create, manage)
- Ticketing (categories, links, split payments)
- Membership (plans, members, app)
- POS (outlets, products, payments)
- Marketing (campaigns, automations)
- Settings (business, Stripe, rooms, staff, taxes)
- Floor plans (seating charts)
- Website Builder
- Reports & Analytics
- CRM, Scanner, Calendar

## How Flows Work

Each feature has a predefined `Flow` - a sequence of browser commands with subtitles:

```typescript
{
  id: "create-ticket-link",
  name: "Create a Ticket Link",
  steps: [
    { action: "navigate", path: "/ticketing", subtitle: "Let's go to Ticketing" },
    { action: "highlight", selector: "button:has-text('Create')", subtitle: "Click here to create a new link" },
    { action: "click", selector: "button:has-text('Create')" },
    // ...
  ]
}
```

The brain (Claude) decides which flow to trigger based on the user's question, or generates custom actions on-the-fly for questions that don't match a predefined flow.

## Adding New Flows

Edit `src/flows/registry.ts` to add new guided walkthroughs. Use the `step()` helper:

```typescript
step("Explanation shown as subtitle", {
  type: "highlight",       // or navigate, click, fill, scroll, subtitle, wait
  selector: "[data-guide='my-element']",
  duration: 5000,
})
```

## Preparing for Layer 2 (Voice)

The architecture separates transport from logic:
- `brain.ts` handles routing (text in, actions + text out)
- WebSocket handles the transport
- Voice would add a parallel transport that converts speech-to-text, passes to the brain, and converts text-to-speech for the response

No changes needed to the brain or the agent - just a new voice transport layer.
