/**
 * OpenEvent Guide SDK
 *
 * Single-file SDK that bundles the chat widget + browser agent.
 * Installed with one script tag, initialized with one boot() call.
 *
 * Usage:
 *   <script src="https://guide.openevent.io/sdk.js"></script>
 *   <script>
 *     OpenEventGuide.boot({
 *       user_id: "usr_123",
 *       email: "name@venue.com",
 *       name: "Thomas",
 *       team: "MAD Productions",
 *       language: "de"
 *     });
 *   </script>
 */

import { initOverlay, destroyOverlay } from "../agent/overlay.js";
import { executeCommand } from "../agent/executor.js";

// ── Types ─────────────────────────────────────────────────────────

interface BootOptions {
  /** Unique user ID */
  user_id: string;
  /** User email */
  email?: string;
  /** Display name */
  name?: string;
  /** Team/company name */
  team?: string;
  /** Preferred language (en, de, fr) - auto-detected if not set */
  language?: string;
  /** Override server URL (default: same origin as SDK script) */
  server?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface GuideState {
  booted: boolean;
  open: boolean;
  messages: ChatMessage[];
  typing: boolean;
  sessionId: string;
  serverUrl: string;
  user: BootOptions | null;
}

// ── State ─────────────────────────────────────────────────────────

const WIDGET_ID = "oe-guide-widget";

const state: GuideState = {
  booted: false,
  open: false,
  messages: [],
  typing: false,
  sessionId: crypto.randomUUID(),
  serverUrl: "",
  user: null,
};

// ── Detect server URL from the SDK script's own src ───────────────

function detectServerUrl(): string {
  const scripts = document.querySelectorAll("script[src]");
  for (const s of scripts) {
    const src = (s as HTMLScriptElement).src;
    if (src.includes("/sdk.js") || src.includes("/sdk.iife.js")) {
      // Server is the origin of the SDK script
      const url = new URL(src);
      return url.origin;
    }
  }
  return window.location.origin;
}

// ── Styles ────────────────────────────────────────────────────────

function injectStyles(): void {
  if (document.getElementById("oe-guide-styles")) return;
  const style = document.createElement("style");
  style.id = "oe-guide-styles";
  style.textContent = `
    #${WIDGET_ID} {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99990;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .oeg-bubble {
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 20px rgba(99,102,241,.4);
      transition: transform .2s, box-shadow .2s;
    }
    .oeg-bubble:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(99,102,241,.5); }
    .oeg-bubble svg { width: 24px; height: 24px; fill: white; }

    .oeg-panel {
      position: absolute; bottom: 72px; right: 0;
      width: 380px; max-height: 520px;
      background: #fff; border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0,0,0,.15);
      display: flex; flex-direction: column; overflow: hidden;
      opacity: 0; transform: translateY(10px) scale(.95);
      transition: opacity .25s ease, transform .25s ease;
      pointer-events: none;
    }
    .oeg-panel.open { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }

    .oeg-header {
      padding: 16px 20px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white; display: flex; align-items: center; gap: 12px;
    }
    .oeg-header-icon {
      width: 36px; height: 36px;
      background: rgba(255,255,255,.2); border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .oeg-header-icon svg { width: 20px; height: 20px; fill: white; }
    .oeg-header h3 { margin: 0; font-size: 15px; font-weight: 600; }
    .oeg-header p { margin: 2px 0 0; font-size: 12px; opacity: .85; }

    .oeg-messages {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 12px;
      min-height: 200px; max-height: 340px;
    }

    .oeg-msg {
      max-width: 85%; padding: 10px 14px;
      border-radius: 12px; font-size: 14px; line-height: 1.5;
      word-wrap: break-word;
    }
    .oeg-msg.user {
      align-self: flex-end; background: #6366f1; color: white;
      border-bottom-right-radius: 4px;
    }
    .oeg-msg.assistant {
      align-self: flex-start; background: #f3f4f6; color: #1f2937;
      border-bottom-left-radius: 4px;
    }

    .oeg-typing {
      align-self: flex-start; padding: 12px 16px;
      background: #f3f4f6; border-radius: 12px;
      display: flex; gap: 4px;
    }
    .oeg-typing span {
      width: 6px; height: 6px; background: #9ca3af;
      border-radius: 50%; animation: oeg-bounce 1.4s ease-in-out infinite;
    }
    .oeg-typing span:nth-child(2) { animation-delay: .2s; }
    .oeg-typing span:nth-child(3) { animation-delay: .4s; }
    @keyframes oeg-bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }

    .oeg-input-row {
      padding: 12px 16px; border-top: 1px solid #e5e7eb;
      display: flex; gap: 8px;
    }
    .oeg-input {
      flex: 1; border: 1px solid #d1d5db; border-radius: 10px;
      padding: 10px 14px; font-size: 14px; outline: none;
      transition: border-color .2s; background: #fff; color: #1f2937;
    }
    .oeg-input:focus { border-color: #6366f1; }
    .oeg-input::placeholder { color: #9ca3af; }
    .oeg-send-btn {
      width: 40px; height: 40px; border: none;
      background: #6366f1; color: white; border-radius: 10px;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: background .2s;
    }
    .oeg-send-btn:hover { background: #4f46e5; }
    .oeg-send-btn:disabled { background: #d1d5db; cursor: not-allowed; }
    .oeg-send-btn svg { width: 18px; height: 18px; fill: currentColor; }

    .oeg-suggestions {
      padding: 8px 16px 12px; display: flex; flex-wrap: wrap; gap: 6px;
    }
    .oeg-chip {
      padding: 6px 12px; border: 1px solid #e5e7eb; border-radius: 16px;
      background: white; font-size: 12px; color: #6366f1; cursor: pointer;
      transition: all .2s;
    }
    .oeg-chip:hover { background: #eef2ff; border-color: #6366f1; }

    .oeg-powered {
      padding: 6px 16px 10px; text-align: center;
      font-size: 11px; color: #9ca3af;
    }
    .oeg-powered a { color: #6366f1; text-decoration: none; }

    @media (max-width: 440px) {
      .oeg-panel { width: calc(100vw - 32px); right: -8px; max-height: 70vh; }
    }

    @media (prefers-color-scheme: dark) {
      .oeg-panel { background: #1f2937; }
      .oeg-msg.assistant { background: #374151; color: #f3f4f6; }
      .oeg-input-row { border-top-color: #374151; }
      .oeg-input { background: #374151; border-color: #4b5563; color: #f3f4f6; }
      .oeg-typing { background: #374151; }
      .oeg-chip { background: #374151; border-color: #4b5563; color: #a5b4fc; }
      .oeg-chip:hover { background: #4b5563; }
    }
  `;
  document.head.appendChild(style);
}

// ── Icons ─────────────────────────────────────────────────────────

const SVG = {
  guide: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>`,
  send: `<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`,
  close: `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
};

// ── Rendering ─────────────────────────────────────────────────────

function esc(t: string): string {
  const d = document.createElement("div");
  d.textContent = t;
  return d.innerHTML;
}

function render(): void {
  let root = document.getElementById(WIDGET_ID);
  if (!root) {
    root = document.createElement("div");
    root.id = WIDGET_ID;
    document.body.appendChild(root);
  }

  const greeting = state.user?.name
    ? `Hi ${esc(state.user.name)}! I'm your OpenEvent Guide. Ask me anything or say "show me" to get a guided walkthrough.`
    : `Hi! I'm your OpenEvent Guide. I can answer questions and walk you through any feature step by step.`;

  const suggestions = ["Show me around", "How do I create an event?", "Set up ticketing", "Connect Stripe"];

  root.innerHTML = `
    <div class="oeg-panel ${state.open ? "open" : ""}">
      <div class="oeg-header">
        <div class="oeg-header-icon">${SVG.guide}</div>
        <div>
          <h3>OpenEvent Guide</h3>
          <p>Ask me anything or say "show me"</p>
        </div>
      </div>
      <div class="oeg-messages" id="oeg-msgs">
        ${state.messages.length === 0 ? `<div class="oeg-msg assistant">${greeting}</div>` : ""}
        ${state.messages.map((m) => `<div class="oeg-msg ${m.role}">${esc(m.content)}</div>`).join("")}
        ${state.typing ? `<div class="oeg-typing"><span></span><span></span><span></span></div>` : ""}
      </div>
      ${state.messages.length === 0
        ? `<div class="oeg-suggestions">${suggestions.map((s) => `<button class="oeg-chip">${s}</button>`).join("")}</div>`
        : ""}
      <div class="oeg-input-row">
        <input class="oeg-input" type="text" placeholder="Ask anything about OpenEvent..." id="oeg-input" />
        <button class="oeg-send-btn" id="oeg-send">${SVG.send}</button>
      </div>
      <div class="oeg-powered">Powered by <a href="https://openevent.io" target="_blank">OpenEvent</a></div>
    </div>
    <button class="oeg-bubble" id="oeg-toggle">${state.open ? SVG.close : SVG.guide}</button>
  `;

  // Scroll to bottom
  const mc = document.getElementById("oeg-msgs");
  if (mc) mc.scrollTop = mc.scrollHeight;

  // Bind events
  document.getElementById("oeg-toggle")?.addEventListener("click", () => {
    state.open = !state.open;
    render();
    if (state.open) {
      setTimeout(() => (document.getElementById("oeg-input") as HTMLInputElement)?.focus(), 250);
    }
  });

  document.getElementById("oeg-send")?.addEventListener("click", sendMessage);
  document.getElementById("oeg-input")?.addEventListener("keydown", (e) => {
    if ((e as KeyboardEvent).key === "Enter") sendMessage();
  });

  root.querySelectorAll(".oeg-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      const inp = document.getElementById("oeg-input") as HTMLInputElement;
      if (inp) {
        inp.value = btn.textContent ?? "";
        sendMessage();
      }
    });
  });
}

// ── Chat via HTTP ─────────────────────────────────────────────────

async function sendMessage(): Promise<void> {
  const input = document.getElementById("oeg-input") as HTMLInputElement;
  if (!input?.value.trim()) return;

  const content = input.value.trim();
  input.value = "";

  state.messages.push({ role: "user", content });
  state.typing = true;
  render();

  try {
    const res = await fetch(`${state.serverUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: state.sessionId,
        message: content,
        user: state.user,
      }),
    });

    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json();

    state.messages.push({ role: "assistant", content: data.reply });
    state.typing = false;
    render();

    // Execute browser commands if any
    if (data.commands?.length > 0) {
      for (const cmd of data.commands) {
        await executeCommand(cmd);
        await new Promise((r) => setTimeout(r, 600));
      }
    }
  } catch {
    state.typing = false;
    state.messages.push({
      role: "assistant",
      content: "I'm having trouble connecting right now. Please try again in a moment.",
    });
    render();
  }
}

// ── Public API ────────────────────────────────────────────────────

function boot(options: BootOptions): void {
  if (state.booted) return;
  state.booted = true;
  state.user = options;
  state.serverUrl = options.server ?? detectServerUrl();

  // Init browser agent overlay
  initOverlay();

  // Init widget UI
  injectStyles();
  render();

  console.log("[OpenEvent Guide] Ready", { server: state.serverUrl, user: options.user_id });
}

function shutdown(): void {
  state.booted = false;
  state.open = false;
  state.messages = [];
  destroyOverlay();
  document.getElementById(WIDGET_ID)?.remove();
  document.getElementById("oe-guide-styles")?.remove();
}

function open(): void {
  if (!state.booted) return;
  state.open = true;
  render();
}

function close(): void {
  state.open = false;
  render();
}

// ── Expose on window.OpenEventGuide ───────────────────────────────

const api = { boot, shutdown, open, close };

(window as unknown as Record<string, unknown>).OpenEventGuide = api;

export { boot, shutdown, open, close };
