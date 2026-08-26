/**
 * OpenEvent Guide Chat Widget
 *
 * A floating chat bubble that connects to the guide server.
 * Inject this script into the OpenEvent app to enable the guide.
 *
 * Usage:
 *   <script src="https://guide-server/widget.js" data-guide-server="wss://guide-server"></script>
 */

import type {
  WSMessageToWidget,
  WSMessageFromWidget,
  ChatMessage,
} from "../shared/types.js";

const WIDGET_ID = "oe-guide-widget";

interface WidgetState {
  ws: WebSocket | null;
  open: boolean;
  messages: ChatMessage[];
  typing: boolean;
  connected: boolean;
  sessionId: string;
}

const state: WidgetState = {
  ws: null,
  open: false,
  messages: [],
  typing: false,
  connected: false,
  sessionId: crypto.randomUUID(),
};

// ── Styles ────────────────────────────────────────────────────────

function injectStyles(): void {
  if (document.getElementById("oe-guide-widget-styles")) return;

  const style = document.createElement("style");
  style.id = "oe-guide-widget-styles";
  style.textContent = `
    #${WIDGET_ID} {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99990;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .oe-guide-bubble {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .oe-guide-bubble:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 24px rgba(99, 102, 241, 0.5);
    }

    .oe-guide-bubble svg {
      width: 24px;
      height: 24px;
      fill: white;
    }

    .oe-guide-panel {
      position: absolute;
      bottom: 72px;
      right: 0;
      width: 380px;
      max-height: 520px;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      transform: translateY(10px) scale(0.95);
      transition: opacity 0.2s ease, transform 0.2s ease;
      pointer-events: none;
    }

    .oe-guide-panel.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    .oe-guide-header {
      padding: 16px 20px;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .oe-guide-header-icon {
      width: 36px;
      height: 36px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .oe-guide-header-icon svg {
      width: 20px;
      height: 20px;
      fill: white;
    }

    .oe-guide-header-text h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
    }

    .oe-guide-header-text p {
      margin: 2px 0 0;
      font-size: 12px;
      opacity: 0.85;
    }

    .oe-guide-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: 200px;
      max-height: 340px;
    }

    .oe-guide-msg {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.5;
      word-wrap: break-word;
    }

    .oe-guide-msg.user {
      align-self: flex-end;
      background: #6366f1;
      color: white;
      border-bottom-right-radius: 4px;
    }

    .oe-guide-msg.assistant {
      align-self: flex-start;
      background: #f3f4f6;
      color: #1f2937;
      border-bottom-left-radius: 4px;
    }

    .oe-guide-typing {
      align-self: flex-start;
      padding: 12px 16px;
      background: #f3f4f6;
      border-radius: 12px;
      display: flex;
      gap: 4px;
    }

    .oe-guide-typing span {
      width: 6px;
      height: 6px;
      background: #9ca3af;
      border-radius: 50%;
      animation: oe-guide-bounce 1.4s ease-in-out infinite;
    }

    .oe-guide-typing span:nth-child(2) { animation-delay: 0.2s; }
    .oe-guide-typing span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes oe-guide-bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }

    .oe-guide-input-area {
      padding: 12px 16px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 8px;
    }

    .oe-guide-input {
      flex: 1;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }

    .oe-guide-input:focus {
      border-color: #6366f1;
    }

    .oe-guide-send {
      width: 40px;
      height: 40px;
      border: none;
      background: #6366f1;
      color: white;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .oe-guide-send:hover {
      background: #4f46e5;
    }

    .oe-guide-send:disabled {
      background: #d1d5db;
      cursor: not-allowed;
    }

    .oe-guide-send svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }

    .oe-guide-suggestions {
      padding: 8px 16px 12px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .oe-guide-suggestion {
      padding: 6px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      background: white;
      font-size: 12px;
      color: #6366f1;
      cursor: pointer;
      transition: all 0.2s;
    }

    .oe-guide-suggestion:hover {
      background: #eef2ff;
      border-color: #6366f1;
    }

    @media (max-width: 440px) {
      .oe-guide-panel {
        width: calc(100vw - 32px);
        right: -8px;
        max-height: 70vh;
      }
    }

    @media (prefers-color-scheme: dark) {
      .oe-guide-panel {
        background: #1f2937;
      }
      .oe-guide-msg.assistant {
        background: #374151;
        color: #f3f4f6;
      }
      .oe-guide-input-area {
        border-top-color: #374151;
      }
      .oe-guide-input {
        background: #374151;
        border-color: #4b5563;
        color: #f3f4f6;
      }
      .oe-guide-typing {
        background: #374151;
      }
      .oe-guide-suggestion {
        background: #374151;
        border-color: #4b5563;
      }
      .oe-guide-suggestion:hover {
        background: #4b5563;
      }
    }
  `;
  document.head.appendChild(style);
}

// ── Icons ─────────────────────────────────────────────────────────

const ICONS = {
  guide: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>`,
  send: `<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`,
  close: `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
};

// ── Render ────────────────────────────────────────────────────────

function render(): void {
  let container = document.getElementById(WIDGET_ID);
  if (!container) {
    container = document.createElement("div");
    container.id = WIDGET_ID;
    document.body.appendChild(container);
  }

  const suggestions = [
    "Show me around",
    "How do I create an event?",
    "Set up ticketing",
    "Connect Stripe",
  ];

  container.innerHTML = `
    <div class="oe-guide-panel ${state.open ? "open" : ""}">
      <div class="oe-guide-header">
        <div class="oe-guide-header-icon">${ICONS.guide}</div>
        <div class="oe-guide-header-text">
          <h3>OpenEvent Guide</h3>
          <p>${state.connected ? "Ask me anything or say 'show me'" : "Connecting..."}</p>
        </div>
      </div>
      <div class="oe-guide-messages" id="oe-guide-messages">
        ${
          state.messages.length === 0
            ? `<div class="oe-guide-msg assistant">
                Hi! I'm your OpenEvent Guide. I can answer questions and walk you through any feature step by step. What would you like to learn?
              </div>`
            : ""
        }
        ${state.messages
          .map(
            (m) =>
              `<div class="oe-guide-msg ${m.role}">${escapeHtml(m.content)}</div>`
          )
          .join("")}
        ${
          state.typing
            ? `<div class="oe-guide-typing"><span></span><span></span><span></span></div>`
            : ""
        }
      </div>
      ${
        state.messages.length === 0
          ? `<div class="oe-guide-suggestions">
              ${suggestions.map((s) => `<button class="oe-guide-suggestion">${s}</button>`).join("")}
            </div>`
          : ""
      }
      <div class="oe-guide-input-area">
        <input
          class="oe-guide-input"
          type="text"
          placeholder="Ask anything about OpenEvent..."
          id="oe-guide-input"
        />
        <button class="oe-guide-send" id="oe-guide-send" ${!state.connected ? "disabled" : ""}>
          ${ICONS.send}
        </button>
      </div>
    </div>
    <button class="oe-guide-bubble" id="oe-guide-toggle">
      ${state.open ? ICONS.close : ICONS.guide}
    </button>
  `;

  // Scroll messages to bottom
  const msgContainer = document.getElementById("oe-guide-messages");
  if (msgContainer) {
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  // Bind events
  document
    .getElementById("oe-guide-toggle")
    ?.addEventListener("click", togglePanel);
  document
    .getElementById("oe-guide-send")
    ?.addEventListener("click", sendMessage);
  document
    .getElementById("oe-guide-input")
    ?.addEventListener("keydown", (e) => {
      if ((e as KeyboardEvent).key === "Enter") sendMessage();
    });

  // Suggestion buttons
  container.querySelectorAll(".oe-guide-suggestion").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(
        "oe-guide-input"
      ) as HTMLInputElement;
      if (input) {
        input.value = btn.textContent ?? "";
        sendMessage();
      }
    });
  });
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ── Actions ───────────────────────────────────────────────────────

function togglePanel(): void {
  state.open = !state.open;
  render();

  if (state.open) {
    setTimeout(() => {
      (document.getElementById("oe-guide-input") as HTMLInputElement)?.focus();
    }, 200);
  }
}

function sendMessage(): void {
  const input = document.getElementById("oe-guide-input") as HTMLInputElement;
  if (!input?.value.trim() || !state.ws) return;

  const content = input.value.trim();
  input.value = "";

  // Add user message
  state.messages.push({
    id: crypto.randomUUID(),
    role: "user",
    content,
    timestamp: Date.now(),
  });

  // Send to server
  const msg: WSMessageFromWidget = { type: "chat", content };
  state.ws.send(JSON.stringify(msg));

  render();
}

function send(msg: WSMessageFromWidget): void {
  if (state.ws?.readyState === WebSocket.OPEN) {
    state.ws.send(JSON.stringify(msg));
  }
}

// ── WebSocket ─────────────────────────────────────────────────────

function connect(serverUrl: string): void {
  const wsUrl = serverUrl.replace(/^http/, "ws");
  const ws = new WebSocket(`${wsUrl}/widget?session=${state.sessionId}`);
  state.ws = ws;

  ws.onopen = () => {
    state.connected = true;
    render();
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data) as WSMessageToWidget;

      switch (msg.type) {
        case "chat":
          state.messages.push(msg.message);
          state.typing = false;
          render();
          break;

        case "typing":
          state.typing = msg.isTyping;
          render();
          break;

        case "connected":
          state.connected = true;
          render();
          break;
      }
    } catch (err) {
      console.error("[oe-guide-widget] Invalid message:", err);
    }
  };

  ws.onclose = () => {
    state.connected = false;
    render();
    setTimeout(() => connect(serverUrl), 3000);
  };
}

// ── Init ──────────────────────────────────────────────────────────

function init(): void {
  injectStyles();

  const scriptTag = document.querySelector(
    'script[data-guide-server]'
  ) as HTMLScriptElement | null;
  const serverUrl =
    scriptTag?.dataset.guideServer ?? "http://localhost:3847";

  // Share session ID with the agent
  const agentGlobal = (window as unknown as Record<string, unknown>).__oeGuide as
    | { sessionId?: string }
    | undefined;
  if (agentGlobal?.sessionId) {
    state.sessionId = agentGlobal.sessionId;
  }

  render();
  connect(serverUrl);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

export { init, state };
