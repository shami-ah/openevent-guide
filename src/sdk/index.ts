/**
 * OpenEvent Guide SDK
 *
 * Three UI modes:
 * 1. Welcome card (first visit) - centered, avatar, "Start" button
 * 2. Call mode - bottom pill with mic/chat/end (like Skype)
 * 3. Chat mode - floating panel with text input
 *
 * The bubble opens a picker: Call or Chat.
 */

import { initOverlay, showSubtitle, hideSubtitle, clearHighlight, showStepBadge, hideStepBadge, destroyOverlay } from "../agent/overlay.js";
import { executeCommand } from "../agent/executor.js";
import { startTriggers, stopTriggers, dismissTrigger } from "./triggers.js";
import { startVoice, stopVoice, isVoiceActive } from "./voice.js";

// ── Types ─────────────────────────────────────────────────────────

interface BootOptions {
  user_id: string;
  email?: string;
  name?: string;
  team?: string;
  language?: string;
  server?: string;
  /** Agent display name (default: "Guide") */
  agentName?: string;
  /** Agent avatar URL (default: built-in) */
  agentAvatar?: string;
  disableTriggers?: boolean;
  disableVoice?: boolean;
}

interface ChatMessage { role: "user" | "assistant" | "status"; content: string; }

type UIMode = "hidden" | "welcome" | "picker" | "chat" | "call";

interface GuideState {
  booted: boolean;
  mode: UIMode;
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
  firstVisit: boolean;
}

// ── State ─────────────────────────────────────────────────────────

const W = "oe-guide-widget";
const state: GuideState = {
  booted: false, mode: "hidden", messages: [], typing: false,
  running: false, runningCancel: false, voiceActive: false, voiceEnabled: true,
  sessionId: crypto.randomUUID(), serverUrl: "", user: null,
  proactiveMsg: null, firstVisit: false,
};

// ── Helpers ───────────────────────────────────────────────────────

function detectServerUrl(): string {
  for (const s of document.querySelectorAll("script[src]")) {
    const src = (s as HTMLScriptElement).src;
    if (src.includes("/sdk.js") || src.includes("/sdk.iife.js")) {
      const url = new URL(src);
      const dir = url.pathname.replace(/\/sdk(\.iife)?\.js$/, "");
      return url.origin + (dir === "/" ? "" : dir);
    }
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
  const txt2 = dk ? "#94a3b8" : "#6b7280";
  const bdr = dk ? "#475569" : "#e5e7eb";
  const inBg = dk ? "#334155" : "#fff";
  const inTxt = dk ? "#f1f5f9" : "#1f2937";
  const chBdr = dk ? "#475569" : "#e5e7eb";
  const chHov = dk ? "#475569" : "#eef2ff";
  const cardBg = dk ? "#1e293b" : "#fff";

  const s = document.createElement("style");
  s.id = "oe-guide-sdk-styles";
  s.textContent = `
    #${W}{position:fixed;z-index:99990;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
    #${W} *{box-sizing:border-box}

    /* ── Bubble (bottom-right) ─────────────────── */
    .oeg-bubble{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(99,102,241,.4);transition:transform .2s,box-shadow .2s;z-index:99991}
    .oeg-bubble:hover{transform:scale(1.08);box-shadow:0 6px 24px rgba(99,102,241,.5)}
    .oeg-bubble svg{width:24px;height:24px;fill:#fff}
    .oeg-bubble.pulse{animation:oeg-pulse 2s ease-in-out infinite}
    @keyframes oeg-pulse{0%,100%{box-shadow:0 4px 20px rgba(99,102,241,.4)}50%{box-shadow:0 4px 30px rgba(99,102,241,.7)}}

    /* ── Proactive hint ────────────────────────── */
    .oeg-hint{position:fixed;bottom:92px;right:24px;background:${cardBg};color:${txtMsg};padding:12px 16px;border-radius:14px;box-shadow:0 4px 20px rgba(0,0,0,.15);font-size:14px;line-height:1.5;max-width:280px;animation:oeg-fadein .3s ease;cursor:pointer;border:1px solid ${bdr};z-index:99991}
    .oeg-hint::after{content:'';position:absolute;bottom:-6px;right:24px;width:12px;height:12px;background:${cardBg};border-right:1px solid ${bdr};border-bottom:1px solid ${bdr};transform:rotate(45deg)}
    .oeg-hint-x{position:absolute;top:6px;right:10px;cursor:pointer;color:${txt2};font-size:18px;line-height:1}
    @keyframes oeg-fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

    /* ── Welcome card (centered) ───────────────── */
    .oeg-welcome-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:99995;animation:oeg-fadein .3s ease;backdrop-filter:blur(4px)}
    .oeg-welcome{background:${cardBg};border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,.2);max-width:480px;width:90%;overflow:hidden;animation:oeg-scalein .35s ease}
    @keyframes oeg-scalein{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:none}}
    .oeg-welcome-img{width:100%;height:200px;object-fit:cover;display:block;background:linear-gradient(135deg,#e0e7ff 0%,#c7d2fe 50%,#a5b4fc 100%)}
    .oeg-welcome-body{padding:24px 28px}
    .oeg-welcome-body h2{margin:0 0 8px;font-size:22px;font-weight:700;color:${txtMsg}}
    .oeg-welcome-body p{margin:0 0 20px;font-size:15px;color:${txt2};line-height:1.6}
    .oeg-welcome-agent{display:flex;align-items:center;gap:10px;margin-bottom:20px}
    .oeg-welcome-avatar{width:36px;height:36px;border-radius:50%;background:#6366f1;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:14px;flex-shrink:0;overflow:hidden}
    .oeg-welcome-avatar img{width:100%;height:100%;object-fit:cover}
    .oeg-welcome-name{font-size:14px;font-weight:600;color:${txtMsg}}
    .oeg-welcome-role{font-size:12px;color:${txt2}}
    .oeg-welcome-actions{display:flex;gap:10px}
    .oeg-welcome-btn{flex:1;padding:12px;border-radius:12px;border:none;cursor:pointer;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .2s}
    .oeg-welcome-btn.primary{background:#6366f1;color:#fff}
    .oeg-welcome-btn.primary:hover{background:#4f46e5}
    .oeg-welcome-btn.secondary{background:${bgMsg};color:${txtMsg};border:1px solid ${bdr}}
    .oeg-welcome-btn.secondary:hover{background:${chHov}}
    .oeg-welcome-btn svg{width:18px;height:18px;fill:currentColor}
    .oeg-welcome-skip{display:block;margin:16px auto 0;background:none;border:none;color:${txt2};font-size:13px;cursor:pointer;padding:4px 8px}
    .oeg-welcome-skip:hover{color:${txtMsg}}

    /* ── Picker (call or chat) ─────────────────── */
    .oeg-picker{position:fixed;bottom:92px;right:24px;background:${cardBg};border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.18);padding:8px;display:flex;flex-direction:column;gap:4px;min-width:200px;animation:oeg-fadein .2s ease;z-index:99992;border:1px solid ${bdr}}
    .oeg-picker-btn{display:flex;align-items:center;gap:12px;padding:12px 16px;border:none;background:none;cursor:pointer;border-radius:12px;font-size:14px;color:${txtMsg};transition:background .15s;width:100%;text-align:left}
    .oeg-picker-btn:hover{background:${bgMsg}}
    .oeg-picker-btn svg{width:20px;height:20px;fill:#6366f1;flex-shrink:0}
    .oeg-picker-label{font-weight:500}
    .oeg-picker-desc{font-size:12px;color:${txt2}}

    /* ── Call pill (bottom center) ──────────────── */
    .oeg-call-pill{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:4px;padding:8px;background:${dk ? "#0f172a" : "#1e293b"};border-radius:28px;box-shadow:0 8px 32px rgba(0,0,0,.3);z-index:99993;animation:oeg-fadein .2s ease}
    .oeg-call-btn{width:44px;height:44px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
    .oeg-call-btn svg{width:20px;height:20px;fill:currentColor}
    .oeg-call-btn.mic{background:${dk ? "#334155" : "#374151"};color:#fff}
    .oeg-call-btn.mic:hover{background:#6366f1}
    .oeg-call-btn.mic.muted{background:#ef4444;color:#fff}
    .oeg-call-btn.chat{background:${dk ? "#334155" : "#374151"};color:#fff}
    .oeg-call-btn.chat:hover{background:#6366f1}
    .oeg-call-btn.end{background:#ef4444;color:#fff}
    .oeg-call-btn.end:hover{background:#dc2626}
    .oeg-call-status{color:#fff;font-size:13px;padding:0 12px;min-width:100px;text-align:center}
    .oeg-call-status .listening{color:#22c55e}
    .oeg-call-status .speaking{color:#6366f1}
    .oeg-call-wave{display:flex;gap:2px;align-items:center;justify-content:center;height:20px}
    .oeg-call-wave span{width:3px;background:#6366f1;border-radius:2px;animation:oeg-wave 1s ease-in-out infinite}
    .oeg-call-wave span:nth-child(1){height:8px;animation-delay:0s}
    .oeg-call-wave span:nth-child(2){height:14px;animation-delay:.15s}
    .oeg-call-wave span:nth-child(3){height:20px;animation-delay:.3s}
    .oeg-call-wave span:nth-child(4){height:14px;animation-delay:.45s}
    .oeg-call-wave span:nth-child(5){height:8px;animation-delay:.6s}
    @keyframes oeg-wave{0%,100%{height:8px}50%{height:20px}}

    /* ── Chat panel ────────────────────────────── */
    .oeg-chat{position:fixed;bottom:92px;right:24px;width:380px;max-height:520px;background:${bg};border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.2);display:flex;flex-direction:column;overflow:hidden;animation:oeg-fadein .25s ease;z-index:99992;border:1px solid ${bdr}}
    .oeg-chat-hd{padding:14px 18px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;display:flex;align-items:center;gap:10px}
    .oeg-chat-hd svg{width:20px;height:20px;fill:#fff;opacity:.8}
    .oeg-chat-hd h3{margin:0;font-size:15px;font-weight:600;flex:1}
    .oeg-chat-close{background:none;border:none;cursor:pointer;color:rgba(255,255,255,.7);padding:4px}
    .oeg-chat-close:hover{color:#fff}
    .oeg-chat-close svg{width:18px;height:18px;fill:currentColor}
    .oeg-ms{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;min-height:180px;max-height:360px}
    .oeg-m{max-width:85%;padding:10px 14px;border-radius:12px;font-size:14px;line-height:1.5;word-wrap:break-word;animation:oeg-fadein .2s ease}
    .oeg-m.user{align-self:flex-end;background:#6366f1;color:#fff;border-bottom-right-radius:4px}
    .oeg-m.assistant{align-self:flex-start;background:${bgMsg};color:${txtMsg};border-bottom-left-radius:4px}
    .oeg-m.status{align-self:center;background:transparent;color:#6366f1;font-size:12px;font-weight:500;padding:2px 0}
    .oeg-tp{align-self:flex-start;padding:10px 14px;background:${bgMsg};border-radius:12px;display:flex;gap:4px}
    .oeg-tp span{width:5px;height:5px;background:#9ca3af;border-radius:50%;animation:oeg-bo 1.4s ease-in-out infinite}
    .oeg-tp span:nth-child(2){animation-delay:.2s}.oeg-tp span:nth-child(3){animation-delay:.4s}
    @keyframes oeg-bo{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
    .oeg-sg{padding:6px 14px 2px;display:flex;flex-wrap:wrap;gap:5px}
    .oeg-ch{padding:5px 10px;border:1px solid ${chBdr};border-radius:14px;background:${dk?"#334155":"#fff"};font-size:12px;color:#6366f1;cursor:pointer;transition:all .15s}
    .oeg-ch:hover{background:${chHov};border-color:#6366f1}
    .oeg-ir{padding:10px 14px;border-top:1px solid ${bdr};display:flex;gap:6px}
    .oeg-in{flex:1;border:1px solid ${chBdr};border-radius:10px;padding:9px 12px;font-size:14px;outline:none;transition:border-color .2s;background:${inBg};color:${inTxt}}
    .oeg-in:focus{border-color:#6366f1}
    .oeg-in::placeholder{color:#9ca3af}
    .oeg-sb{width:38px;height:38px;border:none;background:#6366f1;color:#fff;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .oeg-sb:hover{background:#4f46e5}
    .oeg-sb svg{width:16px;height:16px;fill:currentColor}
    .oeg-cancel{display:flex;justify-content:center;padding:0 14px 6px}
    .oeg-cancel button{padding:5px 14px;border:1px solid #ef4444;border-radius:8px;background:transparent;color:#ef4444;font-size:12px;cursor:pointer}
    .oeg-cancel button:hover{background:#ef4444;color:#fff}

    @media(max-width:440px){.oeg-chat{width:calc(100vw - 16px);right:8px;bottom:80px}.oeg-welcome{width:95%}}
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
  phone: '<svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>',
  phoneEnd: '<svg viewBox="0 0 24 24"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/></svg>',
  chat: '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>',
};

// ── Render ────────────────────────────────────────────────────────

function render(): void {
  let root = document.getElementById(W);
  if (!root) { root = document.createElement("div"); root.id = W; document.body.appendChild(root); }

  const agentName = state.user?.agentName ?? "Guide";
  const userName = state.user?.name ? esc(state.user.name) : "";

  let html = "";

  // ── Welcome card ────────────────────────────
  if (state.mode === "welcome") {
    html = `
      <div class="oeg-welcome-overlay" id="oeg-welcome-overlay">
        <div class="oeg-welcome">
          <div class="oeg-welcome-img"></div>
          <div class="oeg-welcome-body">
            <h2>Ready for a quick walkthrough?</h2>
            <p>I'll guide you through the platform step by step, and I can answer any questions you might have.</p>
            <div class="oeg-welcome-agent">
              <div class="oeg-welcome-avatar">${agentName[0]}</div>
              <div>
                <div class="oeg-welcome-name">${esc(agentName)}</div>
                <div class="oeg-welcome-role">Your OpenEvent assistant</div>
              </div>
            </div>
            <div class="oeg-welcome-actions">
              <button class="oeg-welcome-btn primary" id="oeg-start-call">${SVG.phone} Start call</button>
              <button class="oeg-welcome-btn secondary" id="oeg-start-chat">${SVG.chat} Chat instead</button>
            </div>
            <button class="oeg-welcome-skip" id="oeg-skip">Skip for now</button>
          </div>
        </div>
      </div>`;
  }

  // ── Picker (call or chat choice) ────────────
  if (state.mode === "picker") {
    html += `
      <div class="oeg-picker" id="oeg-picker">
        <button class="oeg-picker-btn" id="oeg-pick-call">
          ${SVG.phone}
          <div>
            <div class="oeg-picker-label">Start a call</div>
            <div class="oeg-picker-desc">Voice walkthrough with your guide</div>
          </div>
        </button>
        <button class="oeg-picker-btn" id="oeg-pick-chat">
          ${SVG.chat}
          <div>
            <div class="oeg-picker-label">Chat</div>
            <div class="oeg-picker-desc">Type your questions</div>
          </div>
        </button>
      </div>`;
  }

  // ── Call pill ───────────────────────────────
  if (state.mode === "call") {
    html += `
      <div class="oeg-call-pill">
        <button class="oeg-call-btn mic ${state.voiceActive ? "" : "muted"}" id="oeg-call-mic" title="${state.voiceActive ? "Mute" : "Unmute"}">
          ${state.voiceActive ? SVG.mic : SVG.micOff}
        </button>
        <div class="oeg-call-status">
          ${state.voiceActive ? '<div class="oeg-call-wave"><span></span><span></span><span></span><span></span><span></span></div>' : '<span style="color:#9ca3af">Muted</span>'}
        </div>
        <button class="oeg-call-btn chat" id="oeg-call-chat" title="Open chat">${SVG.chat}</button>
        <button class="oeg-call-btn end" id="oeg-call-end" title="End call">${SVG.phoneEnd}</button>
      </div>`;
  }

  // ── Chat panel ──────────────────────────────
  if (state.mode === "chat") {
    const greeting = userName
      ? `Hi ${userName}! I'm your OpenEvent Guide. How can I help?`
      : 'Hi! I\'m your OpenEvent Guide. Ask anything or say "show me".';
    const chips = ["Show me around", "Create an event", "Set up ticketing", "Connect Stripe"];

    html += `
      <div class="oeg-chat">
        <div class="oeg-chat-hd">
          ${SVG.guide}
          <h3>OpenEvent Guide</h3>
          <button class="oeg-chat-close" id="oeg-chat-close">${SVG.close}</button>
        </div>
        <div class="oeg-ms" id="oeg-ms">
          ${state.messages.length === 0 ? `<div class="oeg-m assistant">${greeting}</div>` : ""}
          ${state.messages.map((m) => `<div class="oeg-m ${m.role}">${esc(m.content)}</div>`).join("")}
          ${state.typing ? '<div class="oeg-tp"><span></span><span></span><span></span></div>' : ""}
        </div>
        ${state.messages.length === 0 ? `<div class="oeg-sg">${chips.map((c) => `<button class="oeg-ch">${c}</button>`).join("")}</div>` : ""}
        ${state.running ? '<div class="oeg-cancel"><button id="oeg-cancel">Stop guide</button></div>' : ""}
        <div class="oeg-ir">
          <input class="oeg-in" type="text" placeholder="Ask anything..." id="oeg-in" ${state.typing || state.running ? "disabled" : ""} />
          <button class="oeg-sb" id="oeg-sd" ${state.typing || state.running ? "disabled" : ""}>${SVG.send}</button>
        </div>
      </div>`;
  }

  // ── Proactive hint ──────────────────────────
  if (state.proactiveMsg && state.mode === "hidden") {
    html += `<div class="oeg-hint" id="oeg-hint"><span class="oeg-hint-x" id="oeg-hint-x">&times;</span>${esc(state.proactiveMsg)}</div>`;
  }

  // ── Bubble (always visible except during welcome/call) ──
  if (state.mode !== "welcome" && state.mode !== "call") {
    html += `<button class="oeg-bubble ${state.proactiveMsg && state.mode === "hidden" ? "pulse" : ""}" id="oeg-tg">
      ${state.mode === "chat" || state.mode === "picker" ? SVG.close : SVG.guide}
    </button>`;
  }

  root.innerHTML = html;

  // Scroll chat
  const ms = document.getElementById("oeg-ms");
  if (ms) ms.scrollTop = ms.scrollHeight;

  // ── Bind events ─────────────────────────────
  // Welcome
  document.getElementById("oeg-start-call")?.addEventListener("click", () => startCall());
  document.getElementById("oeg-start-chat")?.addEventListener("click", () => { state.mode = "chat"; render(); });
  document.getElementById("oeg-skip")?.addEventListener("click", () => { state.mode = "hidden"; localStorage.setItem("oe-guide-seen", "1"); render(); });
  document.getElementById("oeg-welcome-overlay")?.addEventListener("click", (e) => { if ((e.target as Element).classList.contains("oeg-welcome-overlay")) { state.mode = "hidden"; localStorage.setItem("oe-guide-seen", "1"); render(); } });

  // Bubble toggle
  document.getElementById("oeg-tg")?.addEventListener("click", () => {
    if (state.mode === "chat" || state.mode === "picker") { state.mode = "hidden"; }
    else { state.mode = state.voiceEnabled ? "picker" : "chat"; state.proactiveMsg = null; }
    render();
  });

  // Picker
  document.getElementById("oeg-pick-call")?.addEventListener("click", () => startCall());
  document.getElementById("oeg-pick-chat")?.addEventListener("click", () => { state.mode = "chat"; render(); });

  // Call pill
  document.getElementById("oeg-call-mic")?.addEventListener("click", toggleMic);
  document.getElementById("oeg-call-chat")?.addEventListener("click", () => { state.mode = "chat"; render(); });
  document.getElementById("oeg-call-end")?.addEventListener("click", endCall);

  // Chat
  document.getElementById("oeg-chat-close")?.addEventListener("click", () => { state.mode = "hidden"; render(); });
  document.getElementById("oeg-sd")?.addEventListener("click", sendMessage);
  document.getElementById("oeg-in")?.addEventListener("keydown", (e) => { if ((e as KeyboardEvent).key === "Enter" && !state.typing && !state.running) sendMessage(); });
  document.getElementById("oeg-cancel")?.addEventListener("click", cancelFlow);
  root.querySelectorAll(".oeg-ch").forEach((btn) => {
    btn.addEventListener("click", () => { const inp = document.getElementById("oeg-in") as HTMLInputElement; if (inp) { inp.value = btn.textContent ?? ""; sendMessage(); } });
  });

  // Hints
  document.getElementById("oeg-hint")?.addEventListener("click", () => { state.mode = "chat"; state.proactiveMsg = null; render(); });
  document.getElementById("oeg-hint-x")?.addEventListener("click", (e) => { e.stopPropagation(); state.proactiveMsg = null; dismissTrigger(); render(); });

  // Focus
  if (state.mode === "chat") setTimeout(() => (document.getElementById("oeg-in") as HTMLInputElement)?.focus(), 200);
}

// ── Voice controls ────────────────────────────────────────────────

async function startCall(): Promise<void> {
  state.mode = "call";
  render();

  try {
    await startVoice(state.serverUrl, state.sessionId,
      `You are the OpenEvent Guide. Help ${state.user?.name ?? "the user"} learn to use OpenEvent. Keep responses short (1-2 sentences). You can control their browser with tools. Be warm and conversational.`,
      {
        onToolCall: async (cmd) => { await executeCommand(cmd); },
        onTranscript: (text, role) => { state.messages.push({ role: role === "user" ? "user" : "assistant", content: text }); },
        onStateChange: (active) => { state.voiceActive = active; render(); },
      }
    );
    state.voiceActive = true;
    localStorage.setItem("oe-guide-seen", "1");
    render();
  } catch {
    addStatus("Could not start voice. Check microphone permissions.");
    state.mode = "chat";
    render();
  }
}

function toggleMic(): void {
  if (state.voiceActive) { stopVoice(); state.voiceActive = false; }
  else { startCall(); }
  render();
}

function endCall(): void {
  stopVoice();
  state.voiceActive = false;
  state.mode = "hidden";
  render();
}

// ── Flow execution ────────────────────────────────────────────────

async function executeFlow(commands: Array<Record<string, unknown>>): Promise<void> {
  state.running = true; state.runningCancel = false; render();
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
  addStatus(state.runningCancel ? "Guide stopped." : "Done! Ask me anything else.");
  render();
}

function cancelFlow(): void { state.runningCancel = true; clearHighlight(); hideSubtitle(); hideStepBadge(); }
function addStatus(text: string): void { state.messages.push({ role: "status", content: text }); render(); }

// ── API fetch (direct or via extension proxy) ────────────────────

let _reqCounter = 0;

function apiFetch(url: string, options: RequestInit): Promise<Record<string, unknown>> {
  const useProxy = (window as unknown as Record<string, unknown>).__oeGuideExtProxy;

  if (useProxy) {
    // Route through extension service worker to bypass CSP connect-src
    return new Promise((resolve, reject) => {
      const reqId = "oeg-" + (++_reqCounter);

      const handler = (event: MessageEvent) => {
        if (event.data?.source !== "oeg-ext" || event.data?.reqId !== reqId) return;
        window.removeEventListener("message", handler);
        if (event.data.response?.ok) resolve(event.data.response.data);
        else reject(new Error(event.data.response?.error ?? "Extension proxy failed"));
      };
      window.addEventListener("message", handler);

      window.postMessage({
        source: "oeg-sdk",
        type: "api-request",
        reqId,
        url,
        options: { method: options.method, headers: options.headers, body: options.body },
      }, "*");

      // Timeout after 30s
      setTimeout(() => {
        window.removeEventListener("message", handler);
        reject(new Error("Request timed out"));
      }, 30000);
    });
  }

  // Direct fetch (when SDK is loaded via script tag, no CSP issues)
  return fetch(url, options).then((res) => {
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  });
}

// ── Chat ──────────────────────────────────────────────────────────

async function sendMessage(): Promise<void> {
  const input = document.getElementById("oeg-in") as HTMLInputElement;
  if (!input?.value.trim() || state.typing || state.running) return;
  const content = input.value.trim(); input.value = "";
  state.messages.push({ role: "user", content }); state.typing = true; render();
  try {
    const data = await apiFetch(`${state.serverUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: state.sessionId, message: content, user: state.user }),
    }) as { reply: string; commands?: Array<Record<string, unknown>> };
    state.messages.push({ role: "assistant", content: data.reply }); state.typing = false; render();
    if (data.commands?.length) await executeFlow(data.commands);
  } catch (err) {
    state.typing = false;
    console.error("[oe-guide] Chat failed:", err);
    state.messages.push({ role: "assistant", content: "Connection issue. Please try again." }); render();
  }
}

// ── Proactive trigger handler ─────────────────────────────────────

function handleTrigger(msg: string): void {
  if (state.mode === "chat") { state.messages.push({ role: "assistant", content: msg }); render(); }
  else if (state.mode === "hidden") { state.proactiveMsg = msg; render(); }
}

// ── Public API ────────────────────────────────────────────────────

function boot(options: BootOptions): void {
  if (state.booted) return;
  state.booted = true;
  state.user = options;
  state.serverUrl = options.server ?? detectServerUrl();
  state.voiceEnabled = !options.disableVoice;
  state.firstVisit = !localStorage.getItem("oe-guide-seen");

  initOverlay(); injectStyles();

  // First visit: show welcome card. Returning: just the bubble.
  state.mode = state.firstVisit ? "welcome" : "hidden";
  render();

  if (!options.disableTriggers) startTriggers(handleTrigger);
  console.log("[OpenEvent Guide] Ready", state.serverUrl);
}

function shutdown(): void {
  state.booted = false; state.mode = "hidden"; state.messages = [];
  stopTriggers(); if (isVoiceActive()) stopVoice(); destroyOverlay();
  document.getElementById(W)?.remove();
  document.getElementById("oe-guide-sdk-styles")?.remove();
}

const api = {
  boot, shutdown,
  open: () => { state.mode = state.voiceEnabled ? "picker" : "chat"; render(); },
  close: () => { state.mode = "hidden"; render(); },
  startCall, endCall,
};
(window as unknown as Record<string, unknown>).OpenEventGuide = api;
export { boot, shutdown };
