/**
 * The Brain - routes user questions to either text answers or guided flows.
 *
 * Uses OpenAI API with function calling. The LLM decides:
 * 1. Answer the question with text (informational)
 * 2. Guide the user through a flow (hands-on walkthrough)
 * 3. Both: explain briefly, then offer to guide
 */

import OpenAI from "openai";
import type { ChatCompletionTool } from "openai/resources/chat/completions.js";
import { getAllFlows, getFlowById } from "../flows/registry.js";
import { KNOWLEDGE_BASE } from "../flows/knowledge.js";
import type { AgentCommand, WSMessageToAgent } from "../shared/types.js";

/** Lazy-init so the server starts even without OPENAI_API_KEY set */
let _openai: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_openai) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error(
        "OPENAI_API_KEY is not set. Add it to .env in the openevent-guide directory."
      );
    }
    _openai = new OpenAI({ apiKey: key });
  }
  return _openai;
}

const SYSTEM_PROMPT = `You are the OpenEvent Guide, an AI assistant built into the OpenEvent platform.
You help venue managers, event organizers, and club owners learn how to use OpenEvent.

Your users are non-technical venue managers, event organizers, and club owners.
Communicate in a friendly, clear way. Use simple language. No developer jargon.
Speak the user's language (detect from their message - English, German, French).

## CRITICAL RULES

1. **ALWAYS use guide_flow** when the user asks "how do I...", "show me...", "where is...".
   NEVER use execute_actions. The predefined flows have tested, working selectors.
   execute_actions uses CSS selectors that will fail on the real app.

2. If no predefined flow matches, answer with text only. Do NOT try to generate
   custom browser actions - they will break because you don't know the real DOM.

3. Keep text responses short (2-3 sentences). After answering, suggest a related flow.

4. When the user says "yes", "sure", "please", "show me" after you described something,
   find the matching guide_flow and trigger it. Don't repeat the explanation.

## Sidebar Navigation (exact selectors - DO NOT use any other selectors)

| Page | Sidebar link | Route |
|------|-------------|-------|
| Calendar | a[href="/calendar"] | /calendar |
| Email | a[href="/email"] | /email |
| Payments | a[href="/payments"] | /payments |
| Ticketing | a[href="/ticketing"] | /ticketing |
| POS | a[href="/pos"] | /pos |
| Members | a[href="/membership"] | /membership |
| Website | a[href="/website"] | /website |
| Audience | a[href="/audience"] | /audience |
| Staff | a[href="/staff"] | /staff |
| Reports | a[href="/reports"] | /reports |
| Files | a[href="/files"] | /files |
| Tasks | a[href="/tasks"] | /tasks |
| Notes | a[href="/notes"] | /notes |
| Settings | a[href="/settings"] | /settings |

There is NO a[href="/events"] link. Events are at /calendar.
There are NO data-guide attributes in the app. Do not use them.

## OpenEvent Feature Areas

${KNOWLEDGE_BASE}

## Available Guided Flows (use guide_flow tool with these IDs)

${getAllFlows()
  .map((f) => `- **${f.id}**: ${f.name} - ${f.description} [keywords: ${f.keywords.join(", ")}]`)
  .join("\n")}

REMEMBER: ALWAYS use guide_flow, NEVER use execute_actions.
`;

/** Only guide_flow - no execute_actions (those use wrong selectors) */
const TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "guide_flow",
      description:
        "Start a predefined guided walkthrough. ALWAYS use this when a user asks how to do something. The flow navigates their browser, highlights elements, and shows subtitles. Never generate custom actions.",
      parameters: {
        type: "object",
        properties: {
          flow_id: {
            type: "string",
            description: "The ID of the flow to execute (from the available flows list)",
          },
          intro_message: {
            type: "string",
            description: "A brief message to show the user before starting the guide (1-2 sentences)",
          },
        },
        required: ["flow_id", "intro_message"],
      },
    },
  },
];

interface BrainResponse {
  text: string;
}

export async function handleChat(
  history: Array<{ role: "user" | "assistant"; content: string }>,
  sendToAgent: (msg: WSMessageToAgent) => boolean,
  agentConnected: boolean
): Promise<BrainResponse> {
  try {
    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1024,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...history.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
      tools: agentConnected ? TOOLS : undefined,
      tool_choice: agentConnected ? "auto" : undefined,
    });

    const message = response.choices[0]?.message;
    if (!message) {
      return { text: "I didn't get a response. Please try again." };
    }

    let textParts: string[] = [];
    let guidedSomething = false;

    // Collect text content
    if (message.content) {
      textParts.push(message.content);
    }

    // Process tool calls
    if (message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        if (toolCall.type !== "function") continue;
        guidedSomething = true;
        const args = JSON.parse(toolCall.function.arguments);

        if (toolCall.function.name === "guide_flow") {
          const flow = getFlowById(args.flow_id);

          if (flow) {
            textParts.push(args.intro_message);
            sendToAgent({ type: "flow-start", flow });
          } else {
            textParts.push(
              `I wanted to show you a guide for that, but the flow "${args.flow_id}" isn't available yet. Let me explain instead.`
            );
          }
        } else {
          // Unknown tool call - ignore
        }
      }
    }

    // If we guided and there's no text, add a completion message
    if (guidedSomething && textParts.length === 0) {
      textParts.push("I'm guiding you through it now. Watch your screen!");
    }

    return {
      text:
        textParts.join("\n\n") ||
        "I'm here to help! Ask me anything about OpenEvent, or say 'show me' to get a guided walkthrough of any feature.",
    };
  } catch (err) {
    console.error("[brain] Error calling OpenAI:", err);
    return {
      text: "I'm having trouble connecting right now. Please try again in a moment.",
    };
  }
}
