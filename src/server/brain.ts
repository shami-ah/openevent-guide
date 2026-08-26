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

Your users are typically:
- Non-technical venue managers running clubs, bars, restaurants, or event spaces
- Event organizers managing ticketing, guest lists, and seating
- Business owners setting up memberships, POS, and marketing

You communicate in a friendly, clear, professional way. Use simple language.
Never use developer jargon. Think of yourself as a knowledgeable colleague.

## What you can do

1. **Answer questions** about any OpenEvent feature - explain what it does, how it works, tips
2. **Guide users** through features by controlling their browser - navigate to pages, highlight buttons, click things, fill in fields, all with explanatory subtitles
3. **Suggest next steps** based on what the user is trying to accomplish

## Important rules

- When a user asks "how do I..." or "show me..." or "where is...", PREFER guiding them through it (use the guide_flow or execute_actions tools) over just explaining
- When a user asks "what is..." or "explain...", answer with text
- Keep text responses short and actionable (2-3 sentences max, then offer to show)
- If a predefined flow exists for what they're asking, use guide_flow
- If no predefined flow exists but you can navigate them, use execute_actions
- Always offer to continue helping after completing a guide
- Speak the user's language (detect from their message - English, German, French)

## OpenEvent Feature Areas

${KNOWLEDGE_BASE}

## Available Guided Flows

${getAllFlows()
  .map((f) => `- **${f.id}**: ${f.name} - ${f.description} [keywords: ${f.keywords.join(", ")}]`)
  .join("\n")}
`;

/** Tools the LLM can call */
const TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "guide_flow",
      description:
        "Start a predefined guided walkthrough. Use this when a user asks how to do something and a matching flow exists. The flow will navigate their browser, highlight elements, and show subtitles explaining each step.",
      parameters: {
        type: "object",
        properties: {
          flow_id: {
            type: "string",
            description: "The ID of the flow to execute (from the available flows list)",
          },
          intro_message: {
            type: "string",
            description:
              "A brief message to show the user before starting the guide (1-2 sentences)",
          },
        },
        required: ["flow_id", "intro_message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "execute_actions",
      description:
        "Execute custom browser actions when no predefined flow matches. Use this to navigate to a specific page, highlight a specific element, or perform a custom sequence of actions to help the user.",
      parameters: {
        type: "object",
        properties: {
          actions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: [
                    "navigate",
                    "highlight",
                    "click",
                    "fill",
                    "scroll",
                    "subtitle",
                    "wait",
                  ],
                },
                path: { type: "string", description: "For navigate: the URL path" },
                selector: {
                  type: "string",
                  description: "CSS selector for highlight/click/fill/scroll",
                },
                value: { type: "string", description: "For fill: the value to type" },
                text: { type: "string", description: "For subtitle: the text to show" },
                subtitle: {
                  type: "string",
                  description: "Subtitle to show during this action",
                },
                ms: {
                  type: "number",
                  description: "For wait: milliseconds to wait",
                },
                duration: {
                  type: "number",
                  description: "For highlight/subtitle: how long to show (ms)",
                },
              },
              required: ["type"],
            },
            description: "Array of browser actions to execute in sequence",
          },
          explanation: {
            type: "string",
            description: "Brief explanation of what you're about to show the user",
          },
        },
        required: ["actions", "explanation"],
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
        } else if (toolCall.function.name === "execute_actions") {
          textParts.push(args.explanation);

          // Execute actions sequentially via the agent
          for (const action of args.actions) {
            sendToAgent({
              type: "execute",
              command: action as AgentCommand,
            });
            // Small delay between commands so they're visible
            await new Promise((r) => setTimeout(r, 1000));
          }
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
