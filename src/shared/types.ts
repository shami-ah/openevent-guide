// ── Message Types (Widget <-> Server) ──────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  /** When the assistant triggers a guided flow instead of just text */
  flow?: FlowExecution;
}

export interface FlowExecution {
  flowId: string;
  flowName: string;
  steps: FlowStep[];
  currentStep: number;
  status: "running" | "paused" | "completed" | "cancelled";
}

// ── Agent Commands (Server -> Browser Agent) ───────────────────────

export type AgentCommand =
  | { type: "navigate"; path: string; subtitle?: string }
  | { type: "highlight"; selector: string; subtitle?: string; duration?: number }
  | { type: "click"; selector: string; subtitle?: string }
  | { type: "fill"; selector: string; value: string; subtitle?: string }
  | { type: "scroll"; selector: string; subtitle?: string }
  | { type: "subtitle"; text: string; duration?: number }
  | { type: "wait"; ms: number }
  | { type: "sequence"; commands: AgentCommand[] }
  | { type: "clear" };

export interface AgentEvent {
  type: "command" | "flow-start" | "flow-step" | "flow-end" | "error";
  payload: AgentCommand | FlowStep | { message: string };
}

// ── Flow Definitions ───────────────────────────────────────────────

export interface FlowStep {
  id: string;
  action: AgentCommand["type"];
  /** The command payload for this step */
  command: AgentCommand;
  /** Human-readable description shown as subtitle */
  description: string;
  /** Wait for user action before continuing (interactive mode) */
  waitForUser?: boolean;
  /** CSS selector the user must click to advance (when waitForUser is true) */
  waitSelector?: string;
}

export interface Flow {
  id: string;
  name: string;
  description: string;
  /** Feature area this flow belongs to */
  area: FeatureArea;
  /** Keywords that trigger this flow */
  keywords: string[];
  /** Prerequisite flows (must complete these first) */
  requires?: string[];
  /** Ordered steps */
  steps: FlowStep[];
}

export type FeatureArea =
  | "dashboard"
  | "events"
  | "ticketing"
  | "membership"
  | "pos"
  | "marketing"
  | "floormap"
  | "team"
  | "settings"
  | "website"
  | "knowledge"
  | "analytics"
  | "general";

// ── Knowledge Base ─────────────────────────────────────────────────

export interface FeatureKnowledge {
  area: FeatureArea;
  name: string;
  description: string;
  routes: string[];
  /** What a new organizer needs to know */
  onboardingContext: string;
  /** Related flows */
  flowIds: string[];
  /** FAQ - common questions and short answers */
  faq: Array<{ question: string; answer: string }>;
}

// ── WebSocket Protocol ─────────────────────────────────────────────

export type WSMessageToAgent =
  | { type: "execute"; command: AgentCommand }
  | { type: "flow-start"; flow: Flow; startStep?: number }
  | { type: "flow-pause" }
  | { type: "flow-resume" }
  | { type: "flow-cancel" }
  | { type: "ping" };

export type WSMessageFromAgent =
  | { type: "ready"; url: string }
  | { type: "step-complete"; stepId: string }
  | { type: "step-error"; stepId: string; error: string }
  | { type: "user-action"; selector: string; action: string }
  | { type: "flow-complete"; flowId: string }
  | { type: "pong" };

export type WSMessageToWidget =
  | { type: "chat"; message: ChatMessage }
  | { type: "flow-update"; flow: FlowExecution }
  | { type: "typing"; isTyping: boolean }
  | { type: "connected" };

export type WSMessageFromWidget =
  | { type: "chat"; content: string }
  | { type: "flow-control"; action: "pause" | "resume" | "cancel" | "next" };
