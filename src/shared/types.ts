import type { Text } from "./i18n.js";

// ── Agent commands (server -> browser) ─────────────────────────────
// These are the resolved, on-the-wire shape: language already picked,
// target ids already turned into selectors.

export type AgentCommand =
  | { type: "navigate"; path: string; subtitle?: string }
  | { type: "highlight"; selector: string; label?: string; subtitle?: string; duration?: number }
  | { type: "click"; selector: string; label?: string; subtitle?: string }
  | { type: "fill"; selector: string; label?: string; value: string; subtitle?: string }
  | { type: "scroll"; selector: string; label?: string; subtitle?: string }
  | { type: "subtitle"; text: string; duration?: number }
  | { type: "wait"; ms: number }
  | { type: "clear" };

export type AgentCommandType = AgentCommand["type"];

/**
 * Every command reports whether it actually did anything.
 *
 * This used to be void, so a missing element only produced a console.warn
 * while the subtitle kept confidently saying "click here". Permission-filtered
 * navigation makes a missing target normal rather than exceptional, so the
 * user has to be told.
 */
export interface CommandResult {
  ok: boolean;
  /** Short, user-facing reason. Present only when ok is false. */
  reason?: string;
  /** True when the rest of the flow can no longer make sense (bad navigate). */
  fatal?: boolean;
}

// ── Authored flows (localized, server-side) ────────────────────────

export interface FlowStepDef {
  /** Narration for this step. Doubles as the command's subtitle. */
  description: Text;
  command: FlowCommandDef;
}

/**
 * The authored form of a command. `highlight`/`click`/`scroll` reference a
 * semantic target id from src/flows/targets.ts rather than a raw selector, so
 * selectors live in exactly one place.
 */
export type FlowCommandDef =
  | { type: "navigate"; path: string }
  | { type: "highlight"; target: string; duration?: number }
  | { type: "click"; target: string }
  | { type: "fill"; target: string; value: string }
  | { type: "scroll"; target: string }
  | { type: "subtitle"; text: Text; duration?: number }
  | { type: "wait"; ms: number };

export interface FlowDef {
  id: string;
  name: Text;
  description: Text;
  area: FeatureArea;
  /** Keywords the model matches against. Keep EN + DE + FR terms here. */
  keywords: string[];
  steps: FlowStepDef[];
}

// ── Resolved flows (what the browser receives) ─────────────────────

export interface FlowStep {
  id: string;
  action: AgentCommandType;
  command: AgentCommand;
  description: string;
}

export interface Flow {
  id: string;
  name: string;
  description: string;
  area: FeatureArea;
  keywords: string[];
  steps: FlowStep[];
}

/** The lightweight shape used for tool descriptions and the voice prompt. */
export interface FlowSummary {
  id: string;
  name: string;
  description: string;
  keywords: string[];
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

// ── Knowledge base ─────────────────────────────────────────────────

export interface FeatureKnowledge {
  area: FeatureArea;
  name: string;
  description: string;
  routes: string[];
  onboardingContext: string;
  flowIds: string[];
  faq: Array<{ question: string; answer: string }>;
}

// ── Chat API ───────────────────────────────────────────────────────

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface GuideUser {
  user_id?: string;
  email?: string;
  name?: string;
  team?: string;
  language?: string;
}

export interface ChatRequest {
  sessionId: string;
  message: string;
  user?: GuideUser;
  /** Where the user currently is, so the guide can skip redundant steps. */
  path?: string;
}

export interface ChatResponse {
  reply: string;
  commands: AgentCommand[];
  /** Set when the model started a flow, for the step badge and cancel UI. */
  flowId?: string;
}
