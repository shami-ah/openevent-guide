/**
 * OpenEvent Guide - Browser Agent
 *
 * This script is injected into the OpenEvent application.
 * It connects to the guide server via WebSocket and executes
 * commands to control the browser (navigate, click, highlight, etc.)
 * while showing visual overlays and subtitles to the user.
 *
 * Usage:
 *   <script src="https://guide-server/agent.js" data-server="wss://guide-server"></script>
 *   OR inject via bookmarklet for demos
 */

import type {
  WSMessageToAgent,
  WSMessageFromAgent,
  Flow,
  FlowStep,
} from "../shared/types.js";
import { initOverlay, showSubtitle, showStepBadge, hideStepBadge, hideSubtitle, clearHighlight, destroyOverlay } from "./overlay.js";
import { executeCommand } from "./executor.js";

interface AgentState {
  ws: WebSocket | null;
  connected: boolean;
  currentFlow: Flow | null;
  currentStepIndex: number;
  paused: boolean;
  sessionId: string;
}

const state: AgentState = {
  ws: null,
  connected: false,
  currentFlow: null,
  currentStepIndex: 0,
  paused: false,
  sessionId: crypto.randomUUID(),
};

/** Send a message to the server */
function send(msg: WSMessageFromAgent): void {
  if (state.ws?.readyState === WebSocket.OPEN) {
    state.ws.send(JSON.stringify(msg));
  }
}

/** Execute a flow step by step */
async function executeFlowStep(step: FlowStep): Promise<void> {
  if (state.paused) {
    // Wait until resumed
    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (!state.paused) {
          clearInterval(check);
          resolve();
        }
      }, 200);
    });
  }

  try {
    await executeCommand(step.command);

    if (step.waitForUser && step.waitSelector) {
      // Wait for the user to perform the action
      showSubtitle(
        `${step.description} -- Click the highlighted element to continue`,
        0
      );
      await new Promise<void>((resolve) => {
        const handler = (e: Event) => {
          const target = e.target as Element;
          if (target.closest(step.waitSelector!)) {
            document.removeEventListener("click", handler, true);
            resolve();
          }
        };
        document.addEventListener("click", handler, true);
      });
    }

    send({ type: "step-complete", stepId: step.id });
  } catch (err) {
    send({
      type: "step-error",
      stepId: step.id,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/** Run an entire flow */
async function executeFlow(flow: Flow, startStep = 0): Promise<void> {
  state.currentFlow = flow;
  state.currentStepIndex = startStep;
  state.paused = false;

  showSubtitle(`Starting: ${flow.name}`, 3000);
  await new Promise((r) => setTimeout(r, 1500));

  for (let i = startStep; i < flow.steps.length; i++) {
    if (!state.currentFlow) break; // Flow was cancelled

    state.currentStepIndex = i;
    showStepBadge(i + 1, flow.steps.length);

    await executeFlowStep(flow.steps[i]);

    // Pause between steps for readability
    await new Promise((r) => setTimeout(r, 600));
  }

  // Flow complete
  hideStepBadge();
  clearHighlight();

  if (state.currentFlow) {
    showSubtitle("Guide complete! Ask me anything else.", 4000);
    send({ type: "flow-complete", flowId: flow.id });
    state.currentFlow = null;
  }
}

/** Handle messages from the server */
function handleMessage(data: WSMessageToAgent): void {
  switch (data.type) {
    case "execute":
      executeCommand(data.command);
      break;

    case "flow-start":
      executeFlow(data.flow, data.startStep);
      break;

    case "flow-pause":
      state.paused = true;
      showSubtitle("Guide paused. Type 'resume' to continue.", 0);
      break;

    case "flow-resume":
      state.paused = false;
      hideSubtitle();
      break;

    case "flow-cancel":
      state.currentFlow = null;
      state.paused = false;
      clearHighlight();
      hideStepBadge();
      hideSubtitle();
      showSubtitle("Guide cancelled.", 2000);
      break;

    case "ping":
      send({ type: "pong" });
      break;
  }
}

/** Connect to the guide server */
function connect(serverUrl: string): void {
  initOverlay();

  const ws = new WebSocket(`${serverUrl}/agent?session=${state.sessionId}`);
  state.ws = ws;

  ws.onopen = () => {
    state.connected = true;
    send({ type: "ready", url: window.location.href });
    console.log("[oe-guide] Connected to guide server");
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as WSMessageToAgent;
      handleMessage(data);
    } catch (err) {
      console.error("[oe-guide] Invalid message:", err);
    }
  };

  ws.onclose = () => {
    state.connected = false;
    console.log("[oe-guide] Disconnected. Reconnecting in 3s...");
    setTimeout(() => connect(serverUrl), 3000);
  };

  ws.onerror = (err) => {
    console.error("[oe-guide] WebSocket error:", err);
  };
}

/** Initialize the agent */
function init(): void {
  // Get server URL from script tag or default
  const scriptTag = document.querySelector(
    'script[data-guide-server]'
  ) as HTMLScriptElement | null;
  const serverUrl =
    scriptTag?.dataset.guideServer ?? "ws://localhost:3847";

  // Expose a global API for debugging and the widget
  (window as unknown as Record<string, unknown>).__oeGuide = {
    state,
    connect: () => connect(serverUrl),
    disconnect: () => {
      state.ws?.close();
      destroyOverlay();
    },
    executeCommand,
    sessionId: state.sessionId,
  };

  connect(serverUrl);
}

// Auto-init when script loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

export { init, connect, state };
