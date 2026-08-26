/**
 * OpenEvent Guide SDK
 *
 * Single-file SDK: chat widget + browser agent + AI brain connection.
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

import { initOverlay, showSubtitle, hideSubtitle, clearHighlight, showStepBadge, hideStepBadge, destroyOverlay } from "../agent/overlay.js";
import { executeCommand } from "../agent/executor.js";

// ── Types ─────────────────────────────────────────────────────────

interface BootOptions {
  user_id: string;
  email?: string;
  name?: string;
  team?: string;
  language?: string;
  server?: string;
}

interface ChatMessage {
  role: "user" | "assistant" | "status";
  content: string;
}

interface GuideState {
  booted: boolean;
  open: boolean;
  messages: ChatMessage[];
  typing: boolean;
  running: boolean;
  runningCancel: boolean;
  sessionId: string;
  serverUrl: string;
  user: BootOptions | null;
}

// ── State ─────────────────────────────────────────────────────────

const W = "oe-guide-widget";
const state: GuideState = {
  booted: false, open: false, messages: [], typing: false,
  running: false, runningCancel: false,
  sessionId: crypto.randomUUID(), serverUrl: "", user: null,
};

// ── Server URL detection ──────────────────────────────────────────

function detectServerUrl(): string {
  for (const s of document.querySelectorAll("script[src]")) {
    const src = (s as HTMLScriptElement).src;
    if (src.includes("/sdk.js") || src.includes("/sdk.iife.js")) {
      return new URL(src).origin;
    }
  }
  return window.location.origin;
}

// ── Dark mode detection (matches OpenEvent's localStorage.theme) ──

function isDark(): boolean {
  return document.documentElement.classList.contains("dark")
    || localStorage.getItem("theme") === "dark";
}

// ── Styles ────────────────────────────────────────────────────────

function injectStyles(): void {
  if (document.getElementById("oe-guide-sdk-styles")) return;
  const dark = isDark();
  const bg = dark ? "#1e293b" : "#fff";
  const bgMsg = dark ? "#334155" : "#f3f4f6";
  const textMsg = dark ? "#f1f5f9" : "#1f2937";
  const border = dark ? "#475569" : "#e5e7eb";
  const inputBg = dark ? "#334155" : "#fff";
  const inputText = dark ? "#f1f5f9" : "#1f2937";
  const chipBg = dark ? "#334155" : "#fff";
  const chipBorder = dark ? "#475569" : "#e5e7eb";
  const chipHover = dark ? "#475569" : "#eef2ff";

  const s = document.createElement("style");
  s.id = "oe-guide-sdk-styles";
  s.textContent = `
    #${W}{position:fixed;bottom:24px;right:24px;z-index:99990;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
    .oeg-b{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(99,102,241,.4);transition:transform .2s,box-shadow .2s}
    .oeg-b:hover{transform:scale(1.08);box-shadow:0 6px 24px rgba(99,102,241,.5)}
    .oeg-b svg{width:24px;height:24px;fill:#fff}
    .oeg-p{position:absolute;bottom:72px;right:0;width:380px;max-height:560px;background:${bg};border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.2);display:flex;flex-direction:column;overflow:hidden;opacity:0;transform:translateY(10px) scale(.95);transition:opacity .25s,transform .25s;pointer-events:none}
    .oeg-p.open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}
    .oeg-hd{padding:16px 20px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;display:flex;align-items:center;gap:12px}
    .oeg-hi{width:36px;height:36px;background:rgba(255,255,255,.2);border-radius:10px;display:flex;align-items:center;justify-content:center}
    .oeg-hi svg{width:20px;height:20px;fill:#fff}
    .oeg-hd h3{margin:0;font-size:15px;font-weight:600}
    .oeg-hd p{margin:2px 0 0;font-size:12px;opacity:.85}
    .oeg-ms{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;min-height:200px;max-height:380px}
    .oeg-m{max-width:85%;padding:10px 14px;border-radius:12px;font-size:14px;line-height:1.5;word-wrap:break-word;animation:oeg-in .2s ease}
    @keyframes oeg-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
    .oeg-m.user{align-self:flex-end;background:#6366f1;color:#fff;border-bottom-right-radius:4px}
    .oeg-m.assistant{align-self:flex-start;background:${bgMsg};color:${textMsg};border-bottom-left-radius:4px}
    .oeg-m.status{align-self:center;background:transparent;color:#6366f1;font-size:12px;font-weight:500;padding:4px 0;text-align:center}
    .oeg-tp{align-self:flex-start;padding:12px 16px;background:${bgMsg};border-radius:12px;display:flex;gap:4px}
    .oeg-tp span{width:6px;height:6px;background:#9ca3af;border-radius:50%;animation:oeg-bo 1.4s ease-in-out infinite}
    .oeg-tp span:nth-child(2){animation-delay:.2s}.oeg-tp span:nth-child(3){animation-delay:.4s}
    @keyframes oeg-bo{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
    .oeg-ir{padding:12px 16px;border-top:1px solid ${border};display:flex;gap:8px}
    .oeg-in{flex:1;border:1px solid ${chipBorder};border-radius:10px;padding:10px 14px;font-size:14px;outline:none;transition:border-color .2s;background:${inputBg};color:${inputText}}
    .oeg-in:focus{border-color:#6366f1}
    .oeg-in::placeholder{color:#9ca3af}
    .oeg-sb{width:40px;height:40px;border:none;background:#6366f1;color:#fff;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s;flex-shrink:0}
    .oeg-sb:hover{background:#4f46e5}
    .oeg-sb svg{width:18px;height:18px;fill:currentColor}
    .oeg-sg{padding:8px 16px 4px;display:flex;flex-wrap:wrap;gap:6px}
    .oeg-ch{padding:6px 12px;border:1px solid ${chipBorder};border-radius:16px;background:${chipBg};font-size:12px;color:#6366f1;cursor:pointer;transition:all .2s}
    .oeg-ch:hover{background:${chipHover};border-color:#6366f1}
    .oeg-pw{padding:6px 16px 10px;text-align:center;font-size:11px;color:#9ca3af}
    .oeg-pw a{color:#6366f1;text-decoration:none}
    .oeg-cancel{display:flex;justify-content:center;padding:0 16px 8px}
    .oeg-cancel button{padding:6px 16px;border:1px solid #ef4444;border-radius:8px;background:transparent;color:#ef4444;font-size:12px;cursor:pointer;transition:all .2s}
    .oeg-cancel button:hover{background:#ef4444;color:#fff}
    @media(max-width:440px){.oeg-p{width:calc(100vw - 32px);right:-8px;max-height:75vh}}
  `;
  document.head.appendChild(s);
}

// ── SVGs ──────────────────────────────────────────────────────────

const SVG = {
  guide: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>',
  send: '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
};

function esc(t: string): string {
  const d = document.createElement("div"); d.textContent = t; return d.innerHTML;
}

// ── Render ────────────────────────────────────────────────────────

function render(): void {
  let root = document.getElementById(W);
  if (!root) { root = document.createElement("div"); root.id = W; document.body.appendChild(root); }

  const greeting = state.user?.name
    ? `Hi ${esc(state.user.name)}! I'm your OpenEvent Guide. Ask me anything or say "show me" to get a guided walkthrough.`
    : 'Hi! I\'m your OpenEvent Guide. I can answer questions and walk you through any feature step by step.';

  const chips = ["Show me around", "How do I create an event?", "Set up ticketing", "Connect Stripe"];

  root.innerHTML = `
    <div class="oeg-p ${state.open ? "open" : ""}">
      <div class="oeg-hd">
        <div class="oeg-hi">${SVG.guide}</div>
        <div><h3>OpenEvent Guide</h3><p>${state.running ? "Guiding you..." : "Ask me anything"}</p></div>
      </div>
      <div class="oeg-ms" id="oeg-ms">
        ${state.messages.length === 0 ? `<div class="oeg-m assistant">${greeting}</div>` : ""}
        ${state.messages.map((m) => `<div class="oeg-m ${m.role}">${esc(m.content)}</div>`).join("")}
        ${state.typing ? '<div class="oeg-tp"><span></span><span></span><span></span></div>' : ""}
      </div>
      ${state.messages.length === 0 ? `<div class="oeg-sg">${chips.map((c) => `<button class="oeg-ch">${c}</button>`).join("")}</div>` : ""}
      ${state.running ? '<div class="oeg-cancel"><button id="oeg-cancel">Stop guide</button></div>' : ""}
      <div class="oeg-ir">
        <input class="oeg-in" type="text" placeholder="Ask anything about OpenEvent..." id="oeg-in" ${state.typing || state.running ? "disabled" : ""} />
        <button class="oeg-sb" id="oeg-sd" ${state.typing || state.running ? "disabled" : ""}>${SVG.send}</button>
      </div>
      <div class="oeg-pw">Powered by <a href="https://openevent.io" target="_blank" rel="noopener">OpenEvent</a></div>
    </div>
    <button class="oeg-b" id="oeg-tg">${state.open ? SVG.close : SVG.guide}</button>
  `;

  // Scroll
  const ms = document.getElementById("oeg-ms");
  if (ms) ms.scrollTop = ms.scrollHeight;

  // Events
  document.getElementById("oeg-tg")?.addEventListener("click", toggle);
  document.getElementById("oeg-sd")?.addEventListener("click", sendMessage);
  document.getElementById("oeg-in")?.addEventListener("keydown", (e) => {
    if ((e as KeyboardEvent).key === "Enter" && !state.typing && !state.running) sendMessage();
  });
  document.getElementById("oeg-cancel")?.addEventListener("click", cancelFlow);
  root.querySelectorAll(".oeg-ch").forEach((btn) => {
    btn.addEventListener("click", () => {
      const inp = document.getElementById("oeg-in") as HTMLInputElement;
      if (inp) { inp.value = btn.textContent ?? ""; sendMessage(); }
    });
  });
}

function toggle(): void {
  state.open = !state.open;
  render();
  if (state.open) setTimeout(() => (document.getElementById("oeg-in") as HTMLInputElement)?.focus(), 250);
}

// ── Flow execution with live status ───────────────────────────────

async function executeFlow(commands: Array<Record<string, unknown>>): Promise<void> {
  state.running = true;
  state.runningCancel = false;
  render();

  const total = commands.length;
  for (let i = 0; i < commands.length; i++) {
    if (state.runningCancel) break;

    const cmd = commands[i] as import("../shared/types.js").AgentCommand;

    // Show step counter for multi-step flows
    if (total > 2) showStepBadge(i + 1, total);

    // Show live status in chat for navigate/click actions
    if (cmd.type === "navigate" && "path" in cmd) {
      addStatus(`Navigating to ${(cmd as { path: string }).path}...`);
    } else if (cmd.type === "click" && "subtitle" in cmd && cmd.subtitle) {
      addStatus(cmd.subtitle as string);
    }

    await executeCommand(cmd);
    await new Promise((r) => setTimeout(r, 500));
  }

  hideStepBadge();
  clearHighlight();
  hideSubtitle();
  state.running = false;

  if (state.runningCancel) {
    addStatus("Guide stopped.");
  } else {
    addStatus("Guide complete! Ask me anything else.");
  }
  render();
}

function cancelFlow(): void {
  state.runningCancel = true;
  clearHighlight();
  hideSubtitle();
  hideStepBadge();
}

function addStatus(text: string): void {
  state.messages.push({ role: "status", content: text });
  render();
}

// ── Chat ──────────────────────────────────────────────────────────

async function sendMessage(): Promise<void> {
  const input = document.getElementById("oeg-in") as HTMLInputElement;
  if (!input?.value.trim() || state.typing || state.running) return;

  const content = input.value.trim();
  input.value = "";

  state.messages.push({ role: "user", content });
  state.typing = true;
  render();

  try {
    const res = await fetch(`${state.serverUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: state.sessionId, message: content, user: state.user }),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json();

    state.messages.push({ role: "assistant", content: data.reply });
    state.typing = false;
    render();

    if (data.commands?.length > 0) {
      await executeFlow(data.commands);
    }
  } catch {
    state.typing = false;
    state.messages.push({ role: "assistant", content: "I'm having trouble connecting. Please try again." });
    render();
  }
}

// ── Public API ────────────────────────────────────────────────────

function boot(options: BootOptions): void {
  if (state.booted) return;
  state.booted = true;
  state.user = options;
  state.serverUrl = options.server ?? detectServerUrl();
  initOverlay();
  injectStyles();
  render();
  console.log("[OpenEvent Guide] Ready", state.serverUrl);
}

function shutdown(): void {
  state.booted = false; state.open = false; state.messages = [];
  destroyOverlay();
  document.getElementById(W)?.remove();
  document.getElementById("oe-guide-sdk-styles")?.remove();
}

const api = { boot, shutdown, open: () => { state.open = true; render(); }, close: () => { state.open = false; render(); } };
(window as unknown as Record<string, unknown>).OpenEventGuide = api;
export { boot, shutdown };
