/**
 * OpenEvent Guide SDK
 *
 * Chat + Voice + Browser Control + Proactive Triggers.
 * One script tag. One boot call.
 *
 * Usage:
 *   <script src="https://guide.openevent.io/sdk.js"></script>
 *   <script>
 *     OpenEventGuide.boot({
 *       user_id: "usr_123",
 *       name: "Thomas",
 *       team: "MAD Productions"
 *     });
 *   </script>
 */

import { initOverlay, showSubtitle, hideSubtitle, clearHighlight, showStepBadge, hideStepBadge, destroyOverlay } from "../agent/overlay.js";
import { executeCommand } from "../agent/executor.js";
import { startTriggers, stopTriggers, dismissTrigger } from "./triggers.js";
import { startVoice, stopVoice, isVoiceActive } from "./voice.js";
import { KNOWLEDGE_BASE } from "../flows/knowledge.js";

// ── Types ─────────────────────────────────────────────────────────

interface BootOptions {
  user_id: string;
  email?: string;
  name?: string;
  team?: string;
  language?: string;
  server?: string;
  /** Disable proactive help triggers (default: enabled) */
  disableTriggers?: boolean;
  /** Disable voice capability (default: enabled) */
  disableVoice?: boolean;
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
  voiceActive: boolean;
  voiceEnabled: boolean;
  sessionId: string;
  serverUrl: string;
  user: BootOptions | null;
  proactiveMsg: string | null;
}

// ── State ─────────────────────────────────────────────────────────

const W = "oe-guide-widget";
const state: GuideState = {
  booted: false, open: false, messages: [], typing: false,
  running: false, runningCancel: false,
  voiceActive: false, voiceEnabled: true,
  sessionId: crypto.randomUUID(), serverUrl: "", user: null,
  proactiveMsg: null,
};

// ── Helpers ───────────────────────────────────────────────────────

function detectServerUrl(): string {
  for (const s of document.querySelectorAll("script[src]")) {
    const src = (s as HTMLScriptElement).src;
    if (src.includes("/sdk.js") || src.includes("/sdk.iife.js")) return new URL(src).origin;
  }
  return window.location.origin;
}

function isDark(): boolean {
  return document.documentElement.classList.contains("dark") || localStorage.getItem("theme") === "dark";
}

function esc(t: string): string {
  const d = document.createElement("div"); d.textContent = t; return d.innerHTML;
}

// ── Styles ────────────────────────────────────────────────────────

function injectStyles(): void {
  if (document.getElementById("oe-guide-sdk-styles")) return;
  const dk = isDark();
  const bg = dk ? "#1e293b" : "#fff";
  const bgMsg = dk ? "#334155" : "#f3f4f6";
  const txtMsg = dk ? "#f1f5f9" : "#1f2937";
  const bdr = dk ? "#475569" : "#e5e7eb";
  const inBg = dk ? "#334155" : "#fff";
  const inTxt = dk ? "#f1f5f9" : "#1f2937";
  const chBg = dk ? "#334155" : "#fff";
  const chBdr = dk ? "#475569" : "#e5e7eb";
  const chHov = dk ? "#475569" : "#eef2ff";

  const s = document.createElement("style");
  s.id = "oe-guide-sdk-styles";
  s.textContent = `
    #${W}{position:fixed;bottom:24px;right:24px;z-index:99990;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
    .oeg-b{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(99,102,241,.4);transition:transform .2s,box-shadow .2s}
    .oeg-b:hover{transform:scale(1.08);box-shadow:0 6px 24px rgba(99,102,241,.5)}
    .oeg-b svg{width:24px;height:24px;fill:#fff}
    .oeg-b.pulse{animation:oeg-pulse 2s ease-in-out infinite}
    @keyframes oeg-pulse{0%,100%{box-shadow:0 4px 20px rgba(99,102,241,.4)}50%{box-shadow:0 4px 30px rgba(99,102,241,.7)}}
    .oeg-hint{position:absolute;bottom:68px;right:0;background:${bg};color:${txtMsg};padding:10px 14px;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.15);font-size:13px;line-height:1.4;max-width:260px;animation:oeg-in .3s ease;cursor:pointer;border:1px solid ${bdr}}
    .oeg-hint::after{content:'';position:absolute;bottom:-6px;right:24px;width:12px;height:12px;background:${bg};border-right:1px solid ${bdr};border-bottom:1px solid ${bdr};transform:rotate(45deg)}
    .oeg-hint-x{position:absolute;top:4px;right:8px;cursor:pointer;color:#9ca3af;font-size:16px;line-height:1}
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
    .oeg-m.assistant{align-self:flex-start;background:${bgMsg};color:${txtMsg};border-bottom-left-radius:4px}
    .oeg-m.status{align-self:center;background:transparent;color:#6366f1;font-size:12px;font-weight:500;padding:4px 0;text-align:center}
    .oeg-tp{align-self:flex-start;padding:12px 16px;background:${bgMsg};border-radius:12px;display:flex;gap:4px}
    .oeg-tp span{width:6px;height:6px;background:#9ca3af;border-radius:50%;animation:oeg-bo 1.4s ease-in-out infinite}
    .oeg-tp span:nth-child(2){animation-delay:.2s}.oeg-tp span:nth-child(3){animation-delay:.4s}
    @keyframes oeg-bo{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
    .oeg-ir{padding:12px 16px;border-top:1px solid ${bdr};display:flex;gap:8px}
    .oeg-in{flex:1;border:1px solid ${chBdr};border-radius:10px;padding:10px 14px;font-size:14px;outline:none;transition:border-color .2s;background:${inBg};color:${inTxt}}
    .oeg-in:focus{border-color:#6366f1}
    .oeg-in::placeholder{color:#9ca3af}
    .oeg-sb{width:40px;height:40px;border:none;background:#6366f1;color:#fff;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s;flex-shrink:0}
    .oeg-sb:hover{background:#4f46e5}
    .oeg-sb svg{width:18px;height:18px;fill:currentColor}
    .oeg-mic{width:40px;height:40px;border:none;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0;background:transparent;color:#9ca3af}
    .oeg-mic:hover{background:${bgMsg};color:#6366f1}
    .oeg-mic.active{background:#ef4444;color:#fff;animation:oeg-pulse-mic 1.5s ease-in-out infinite}
    @keyframes oeg-pulse-mic{0%,100%{opacity:1}50%{opacity:.7}}
    .oeg-mic svg{width:18px;height:18px;fill:currentColor}
    .oeg-sg{padding:8px 16px 4px;display:flex;flex-wrap:wrap;gap:6px}
    .oeg-ch{padding:6px 12px;border:1px solid ${chBdr};border-radius:16px;background:${chBg};font-size:12px;color:#6366f1;cursor:pointer;transition:all .2s}
    .oeg-ch:hover{background:${chHov};border-color:#6366f1}
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
  mic: '<svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>',
  micOff: '<svg viewBox="0 0 24 24"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/></svg>',
};

// ── Render ────────────────────────────────────────────────────────

function render(): void {
  let root = document.getElementById(W);
  if (!root) { root = document.createElement("div"); root.id = W; document.body.appendChild(root); }

  const greeting = state.user?.name
    ? `Hi ${esc(state.user.name)}! I'm your OpenEvent Guide. Ask me anything, say "show me", or click the mic to talk.`
    : 'Hi! I\'m your OpenEvent Guide. Ask questions, get guided walkthroughs, or use your voice.';

  const chips = ["Show me around", "How do I create an event?", "Set up ticketing", "Connect Stripe"];

  const headerStatus = state.voiceActive ? "Listening..." : state.running ? "Guiding you..." : "Ask me anything";

  root.innerHTML = `
    ${state.proactiveMsg && !state.open ? `
      <div class="oeg-hint" id="oeg-hint">
        <span class="oeg-hint-x" id="oeg-hint-x">&times;</span>
        ${esc(state.proactiveMsg)}
      </div>
    ` : ""}
    <div class="oeg-p ${state.open ? "open" : ""}">
      <div class="oeg-hd">
        <div class="oeg-hi">${SVG.guide}</div>
        <div><h3>OpenEvent Guide</h3><p>${headerStatus}</p></div>
      </div>
      <div class="oeg-ms" id="oeg-ms">
        ${state.messages.length === 0 ? `<div class="oeg-m assistant">${greeting}</div>` : ""}
        ${state.messages.map((m) => `<div class="oeg-m ${m.role}">${esc(m.content)}</div>`).join("")}
        ${state.typing ? '<div class="oeg-tp"><span></span><span></span><span></span></div>' : ""}
      </div>
      ${state.messages.length === 0 ? `<div class="oeg-sg">${chips.map((c) => `<button class="oeg-ch">${c}</button>`).join("")}</div>` : ""}
      ${state.running ? '<div class="oeg-cancel"><button id="oeg-cancel">Stop guide</button></div>' : ""}
      <div class="oeg-ir">
        <input class="oeg-in" type="text" placeholder="${state.voiceActive ? "Listening... speak now" : "Ask anything about OpenEvent..."}" id="oeg-in" ${state.typing || state.running || state.voiceActive ? "disabled" : ""} />
        ${state.voiceEnabled ? `<button class="oeg-mic ${state.voiceActive ? "active" : ""}" id="oeg-mic" title="${state.voiceActive ? "Stop voice" : "Start voice"}">${state.voiceActive ? SVG.micOff : SVG.mic}</button>` : ""}
        <button class="oeg-sb" id="oeg-sd" ${state.typing || state.running || state.voiceActive ? "disabled" : ""}>${SVG.send}</button>
      </div>
      <div class="oeg-pw">Powered by <a href="https://openevent.io" target="_blank" rel="noopener">OpenEvent</a></div>
    </div>
    <button class="oeg-b ${state.proactiveMsg && !state.open ? "pulse" : ""}" id="oeg-tg">${state.open ? SVG.close : SVG.guide}</button>
  `;

  // Scroll
  const ms = document.getElementById("oeg-ms");
  if (ms) ms.scrollTop = ms.scrollHeight;

  // Events
  document.getElementById("oeg-tg")?.addEventListener("click", togglePanel);
  document.getElementById("oeg-sd")?.addEventListener("click", sendMessage);
  document.getElementById("oeg-in")?.addEventListener("keydown", (e) => {
    if ((e as KeyboardEvent).key === "Enter" && !state.typing && !state.running && !state.voiceActive) sendMessage();
  });
  document.getElementById("oeg-cancel")?.addEventListener("click", cancelFlow);
  document.getElementById("oeg-mic")?.addEventListener("click", toggleVoice);
  document.getElementById("oeg-hint")?.addEventListener("click", () => {
    state.open = true;
    state.proactiveMsg = null;
    render();
  });
  document.getElementById("oeg-hint-x")?.addEventListener("click", (e) => {
    e.stopPropagation();
    state.proactiveMsg = null;
    dismissTrigger();
    render();
  });
  root.querySelectorAll(".oeg-ch").forEach((btn) => {
    btn.addEventListener("click", () => {
      const inp = document.getElementById("oeg-in") as HTMLInputElement;
      if (inp) { inp.value = btn.textContent ?? ""; sendMessage(); }
    });
  });
}

function togglePanel(): void {
  state.open = !state.open;
  if (state.open) state.proactiveMsg = null;
  render();
  if (state.open) setTimeout(() => (document.getElementById("oeg-in") as HTMLInputElement)?.focus(), 250);
}

// ── Proactive trigger handler ─────────────────────────────────────

function handleProactiveTrigger(message: string): void {
  if (state.open) {
    // Widget is open, add as assistant message
    state.messages.push({ role: "assistant", content: message });
    render();
  } else {
    // Widget is closed, show as hint bubble above the chat button
    state.proactiveMsg = message;
    render();
  }
}

// ── Voice ─────────────────────────────────────────────────────────

const VOICE_SYSTEM_PROMPT = `You are the OpenEvent Guide, a voice assistant helping venue managers use OpenEvent.
Keep responses short and conversational (1-2 sentences). You can control the user's browser.
When they ask "how do I..." or "show me...", use the navigate, highlight, or click tools.
Speak the user's language. Be warm, helpful, and concise.

Available pages: /calendar, /ticketing, /membership, /pos, /audience, /payments, /reports,
/staff, /settings/business, /settings/payments, /settings/rooms, /settings/staff,
/settings/ticketing, /settings/taxes, /email, /files, /tasks, /notes, /scan, /crm, /website`;

async function toggleVoice(): Promise<void> {
  if (isVoiceActive()) {
    stopVoice();
    state.voiceActive = false;
    addStatus("Voice ended.");
    render();
    return;
  }

  try {
    addStatus("Starting voice...");
    render();

    await startVoice(state.serverUrl, state.sessionId, VOICE_SYSTEM_PROMPT, {
      onToolCall: async (cmd) => {
        await executeCommand(cmd);
      },
      onTranscript: (text, role) => {
        state.messages.push({ role: role === "user" ? "user" : "assistant", content: text });
        render();
      },
      onStateChange: (active) => {
        state.voiceActive = active;
        if (!active) addStatus("Voice ended.");
        render();
      },
    });

    state.voiceActive = true;
    addStatus("Voice active. Speak now!");
    render();
  } catch (err) {
    state.voiceActive = false;
    addStatus("Could not start voice. Check microphone permissions.");
    render();
    console.error("[oe-guide] Voice error:", err);
  }
}

// ── Flow execution ────────────────────────────────────────────────

async function executeFlow(commands: Array<Record<string, unknown>>): Promise<void> {
  state.running = true;
  state.runningCancel = false;
  render();

  const total = commands.length;
  for (let i = 0; i < commands.length; i++) {
    if (state.runningCancel) break;
    const cmd = commands[i] as import("../shared/types.js").AgentCommand;
    if (total > 2) showStepBadge(i + 1, total);
    if (cmd.type === "navigate" && "path" in cmd) addStatus(`Navigating to ${(cmd as { path: string }).path}...`);
    else if ("subtitle" in cmd && cmd.subtitle) addStatus(cmd.subtitle as string);
    await executeCommand(cmd);
    await new Promise((r) => setTimeout(r, 500));
  }

  hideStepBadge(); clearHighlight(); hideSubtitle();
  state.running = false;
  addStatus(state.runningCancel ? "Guide stopped." : "Guide complete! Ask me anything else.");
  render();
}

function cancelFlow(): void {
  state.runningCancel = true;
  clearHighlight(); hideSubtitle(); hideStepBadge();
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

    if (data.commands?.length > 0) await executeFlow(data.commands);
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
  state.voiceEnabled = !options.disableVoice;

  initOverlay();
  injectStyles();
  render();

  // Start proactive triggers
  if (!options.disableTriggers) {
    startTriggers(handleProactiveTrigger);
  }

  console.log("[OpenEvent Guide] Ready", state.serverUrl);
}

function shutdown(): void {
  state.booted = false; state.open = false; state.messages = [];
  stopTriggers();
  if (isVoiceActive()) stopVoice();
  destroyOverlay();
  document.getElementById(W)?.remove();
  document.getElementById("oe-guide-sdk-styles")?.remove();
}

const api = {
  boot,
  shutdown,
  open: () => { state.open = true; render(); },
  close: () => { state.open = false; render(); },
};
(window as unknown as Record<string, unknown>).OpenEventGuide = api;
export { boot, shutdown };
