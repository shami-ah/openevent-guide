/**
 * The brain: routes a user question to either a text answer or a guided flow.
 *
 * Design rule that has not changed: the model may only trigger *predefined*
 * flows. It never invents CSS selectors, because it cannot see the DOM and
 * every invented selector we shipped was wrong. Flow selectors live in
 * src/flows/targets.ts and are verified against the app.
 */

import OpenAI from "openai";
import type { ChatCompletionTool } from "openai/resources/chat/completions.js";
import { getFlowById, getFlowSummaries } from "../flows/registry.js";
import { KNOWLEDGE_BASE } from "../flows/knowledge.js";
import { normalizeLang, type Lang } from "../shared/i18n.js";
import type { AgentCommand, ChatTurn, GuideUser } from "../shared/types.js";

/**
 * Chat providers. Both speak the OpenAI chat completions API, so one client
 * serves either; only the key, base URL and default model differ. Voice is not
 * covered: it needs OpenAI's Realtime API, which NVIDIA does not offer.
 */
const LLM_PROVIDERS = {
  openai: { keyVar: "OPENAI_API_KEY", baseURL: undefined, defaultModel: "gpt-4o" },
  // Default picked on 2026-10-04: of the models on the account that call
  // tools reliably, the largest one that answers in seconds, not minutes.
  nvidia: { keyVar: "NVIDIA_API_KEY", baseURL: "https://integrate.api.nvidia.com/v1", defaultModel: "nvidia/nemotron-3-super-120b-a12b" },
} as const;

export type LlmProvider = keyof typeof LLM_PROVIDERS;

export interface LlmConfig {
  provider: LlmProvider;
  keyVar: string;
  apiKey: string;
  baseURL?: string;
  model: string;
}

/**
 * GUIDE_LLM_PROVIDER picks the provider explicitly. Unset, it is OpenAI when
 * OPENAI_API_KEY is set and NVIDIA when only NVIDIA_API_KEY is. GUIDE_MODEL
 * overrides the provider's default model; leave it empty to use the default.
 */
export function resolveLlmConfig(env: Record<string, string | undefined>): LlmConfig {
  const requested = env.GUIDE_LLM_PROVIDER?.trim().toLowerCase();
  if (requested && !(requested in LLM_PROVIDERS)) {
    throw new Error(`GUIDE_LLM_PROVIDER must be one of ${Object.keys(LLM_PROVIDERS).join(", ")} (got "${requested}").`);
  }
  const provider: LlmProvider =
    (requested as LlmProvider | undefined) ?? (!env.OPENAI_API_KEY && env.NVIDIA_API_KEY ? "nvidia" : "openai");
  const p = LLM_PROVIDERS[provider];
  return {
    provider,
    keyVar: p.keyVar,
    apiKey: env[p.keyVar] ?? "",
    baseURL: p.baseURL,
    model: env.GUIDE_MODEL?.trim() || p.defaultModel,
  };
}

const LLM = resolveLlmConfig(process.env);

/** How many turns of history to send. Keeps cost bounded on long sessions. */
export const MAX_HISTORY_TURNS = 20;

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    if (!LLM.apiKey) {
      throw new Error(`${LLM.keyVar} is not set. Add it to .env in the openevent-guide directory.`);
    }
    _client = new OpenAI({ apiKey: LLM.apiKey, baseURL: LLM.baseURL });
  }
  return _client;
}

/** For the startup banner. */
export function describeLlm(): string {
  return `${LLM.provider} / ${LLM.model}`;
}

function describeUser(user: GuideUser | null | undefined): string {
  if (!user) return "You do not know who you are talking to yet.";
  const bits: string[] = [];
  if (user.name) bits.push(`Their name is ${user.name}. Use it occasionally, not in every message.`);
  if (user.team) bits.push(`They work for ${user.team}.`);
  if (user.language) {
    bits.push(`Their app is set to ${normalizeLang(user.language).toUpperCase()}. Reply in that language unless they write in another one.`);
  }
  return bits.length ? bits.join(" ") : "You do not know who you are talking to yet.";
}

function buildSystemPrompt(user: GuideUser | null | undefined, lang: Lang, path?: string): string {
  const flows = getFlowSummaries(lang);

  return `You are the OpenEvent Guide, an AI assistant built into the OpenEvent platform.
You help venue managers, event organizers and club owners learn to use OpenEvent.

Your users are not technical. Use plain language, no developer jargon.
Reply in the user's language: English, German or French. Match the language they write in.

## Who you are talking to
${describeUser(user)}
${path ? `They are currently on the page ${path}. Do not walk them somewhere they already are.` : ""}

## CRITICAL RULES

1. ALWAYS use the guide_flow tool when the user asks "how do I...", "show me...",
   "where is...". The predefined flows have selectors that are verified against
   the real app.
2. You cannot see the page and you must never invent CSS selectors or make up
   page paths. If no flow fits, answer in words only.
3. Keep text answers short: two or three sentences. Then offer a related flow.
4. When the user says "yes", "sure", "go on", "show me" after you described
   something, trigger the matching flow. Do not repeat the explanation.
5. If a flow does not exist for what they asked, say what you do know and name
   the closest flow you can offer. Never pretend to be guiding them.

## OpenEvent feature areas

${KNOWLEDGE_BASE}

## Available guided flows (pass one of these ids to guide_flow)

${flows.map((f) => `- **${f.id}**: ${f.name} : ${f.description} [matches: ${f.keywords.join(", ")}]`).join("\n")}
`;
}

const TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "guide_flow",
      description:
        "Start a predefined guided walkthrough. Use this whenever the user asks how to do something. It navigates their browser, highlights the right elements and narrates each step.",
      parameters: {
        type: "object",
        properties: {
          flow_id: { type: "string", description: "The id of the flow to run, from the available flows list." },
          intro_message: { type: "string", description: "One or two sentences shown before the walkthrough starts, in the user's language." },
        },
        required: ["flow_id", "intro_message"],
        additionalProperties: false,
      },
    },
  },
];

export interface BrainRequest {
  history: ChatTurn[];
  user?: GuideUser | null;
  lang: Lang;
  path?: string;
}

export interface BrainResponse {
  text: string;
  commands: AgentCommand[];
  flowId?: string;
}

export async function handleChat(req: BrainRequest): Promise<BrainResponse> {
  const history = req.history.slice(-MAX_HISTORY_TURNS);

  try {
    const response = await getClient().chat.completions.create({
      model: LLM.model,
      max_tokens: 1024,
      messages: [
        { role: "system", content: buildSystemPrompt(req.user, req.lang, req.path) },
        ...history.map((m) => ({ role: m.role, content: m.content })),
      ],
      tools: TOOLS,
      tool_choice: "auto",
    });

    const message = response.choices[0]?.message;
    if (!message) {
      return { text: "I didn't get a response. Please try again.", commands: [] };
    }

    const textParts: string[] = [];
    const commands: AgentCommand[] = [];
    let flowId: string | undefined;

    if (message.content) textParts.push(message.content);

    for (const toolCall of message.tool_calls ?? []) {
      if (toolCall.type !== "function" || toolCall.function.name !== "guide_flow") continue;

      let args: { flow_id?: string; intro_message?: string };
      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch {
        continue;
      }

      const flow = args.flow_id ? getFlowById(args.flow_id, req.lang) : undefined;
      if (!flow) {
        // Do not silently swallow this: the model picked a flow id we do not
        // have, and the user is owed an honest answer rather than a dead guide.
        textParts.push(
          "I don't have a walkthrough for that one yet, so let me explain it instead : ask me and I'll describe the steps.",
        );
        continue;
      }

      if (args.intro_message) textParts.push(args.intro_message);
      commands.push(...flow.steps.map((s) => s.command));
      flowId = flow.id;
    }

    if (commands.length > 0 && textParts.length === 0) {
      textParts.push("I'm walking you through it now : watch your screen.");
    }

    return {
      text:
        textParts.join("\n\n") ||
        "I'm here to help. Ask me anything about OpenEvent, or say \"show me\" for a guided walkthrough.",
      commands,
      flowId,
    };
  } catch (err) {
    console.error("[brain] Chat model call failed:", err);
    return {
      text: "I'm having trouble connecting right now. Please try again in a moment.",
      commands: [],
    };
  }
}

/** The instructions the voice agent runs with. Shares the brain's knowledge. */
export function buildVoiceInstructions(user: GuideUser | null | undefined, lang: Lang): string {
  const flows = getFlowSummaries(lang);
  return `You are the OpenEvent Guide, talking to a venue manager on a live voice call while you control their browser.

${describeUser(user)}

Keep spoken answers to one or two sentences. You are on a call, not writing documentation.
Speak the user's language: English, German or French.

When they ask how to do something, call guide_flow with one of these ids and then narrate
briefly while it runs. Do not describe the steps yourself, the walkthrough does that.

Available flows:
${flows.map((f) => `- ${f.id}: ${f.name} : ${f.description}`).join("\n")}

You may also call navigate to take them to a page directly. You cannot see the page and you
must never invent CSS selectors. If nothing fits, just answer in words.

Product knowledge:
${KNOWLEDGE_BASE}`;
}
