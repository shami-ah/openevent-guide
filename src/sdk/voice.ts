/**
 * Voice Module - OpenAI Realtime API via WebRTC
 *
 * Flow:
 * 1. User clicks mic button in chat widget
 * 2. SDK requests an ephemeral token from our server (POST /api/voice-session)
 * 3. SDK opens WebRTC connection directly to OpenAI
 * 4. User speaks, OpenAI responds with audio + tool calls
 * 5. Tool calls execute browser commands (same as chat)
 * 6. User hears the response AND sees the browser actions
 *
 * The server never touches audio - it only mints the ephemeral token.
 * Audio flows directly: browser <-> OpenAI via WebRTC.
 */

import type { AgentCommand } from "../shared/types.js";

// ── Types ─────────────────────────────────────────────────────────

interface VoiceState {
  active: boolean;
  pc: RTCPeerConnection | null;
  dc: RTCDataChannel | null;
  audioEl: HTMLAudioElement | null;
  onToolCall: ((cmd: AgentCommand) => Promise<void>) | null;
  onTranscript: ((text: string, role: "user" | "assistant") => void) | null;
  onStateChange: ((active: boolean) => void) | null;
}

const vs: VoiceState = {
  active: false,
  pc: null,
  dc: null,
  audioEl: null,
  onToolCall: null,
  onTranscript: null,
  onStateChange: null,
};

// ── Tool definitions for OpenAI Realtime ──────────────────────────

const VOICE_TOOLS = [
  {
    type: "function" as const,
    name: "guide_flow",
    description: "Start a predefined guided walkthrough that navigates the user's browser, highlights elements, and shows subtitles.",
    parameters: {
      type: "object",
      properties: {
        flow_id: { type: "string", description: "Flow ID to execute" },
      },
      required: ["flow_id"],
    },
  },
  {
    type: "function" as const,
    name: "navigate",
    description: "Navigate the user's browser to a specific page in OpenEvent.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "URL path like /ticketing or /settings/payments" },
        subtitle: { type: "string", description: "Text to show on screen" },
      },
      required: ["path"],
    },
  },
  {
    type: "function" as const,
    name: "highlight",
    description: "Highlight a UI element on the page to draw the user's attention.",
    parameters: {
      type: "object",
      properties: {
        selector: { type: "string", description: "CSS selector of the element" },
        subtitle: { type: "string", description: "Text to show on screen" },
      },
      required: ["selector"],
    },
  },
  {
    type: "function" as const,
    name: "click",
    description: "Click a UI element on the page.",
    parameters: {
      type: "object",
      properties: {
        selector: { type: "string", description: "CSS selector of the element" },
        subtitle: { type: "string", description: "Text to show on screen" },
      },
      required: ["selector"],
    },
  },
];

// ── Session creation ──────────────────────────────────────────────

async function getEphemeralToken(serverUrl: string, sessionId: string, apiFetchFn?: (url: string, opts: RequestInit) => Promise<Record<string, unknown>>): Promise<string> {
  const url = `${serverUrl}/api/voice-session`;
  const opts: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  };

  if (apiFetchFn) {
    const data = await apiFetchFn(url, opts);
    return (data as { clientSecret: string }).clientSecret;
  }

  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`Voice session failed: ${res.status}`);
  const data = await res.json();
  return data.clientSecret;
}

// ── WebRTC connection ─────────────────────────────────────────────

export async function startVoice(
  serverUrl: string,
  sessionId: string,
  systemPrompt: string,
  callbacks: {
    onToolCall: (cmd: AgentCommand) => Promise<void>;
    onTranscript: (text: string, role: "user" | "assistant") => void;
    onStateChange: (active: boolean) => void;
  },
  apiFetchFn?: (url: string, opts: RequestInit) => Promise<Record<string, unknown>>
): Promise<void> {
  if (vs.active) return;

  vs.onToolCall = callbacks.onToolCall;
  vs.onTranscript = callbacks.onTranscript;
  vs.onStateChange = callbacks.onStateChange;

  try {
    // 1. Get ephemeral token from our server
    const token = await getEphemeralToken(serverUrl, sessionId, apiFetchFn);

    // 2. Create peer connection
    const pc = new RTCPeerConnection();
    vs.pc = pc;

    // 3. Set up audio output
    const audioEl = document.createElement("audio");
    audioEl.autoplay = true;
    vs.audioEl = audioEl;

    pc.ontrack = (event) => {
      audioEl.srcObject = event.streams[0];
    };

    // 4. Capture user microphone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    // 5. Create data channel for events (tool calls, transcripts)
    const dc = pc.createDataChannel("oai-events");
    vs.dc = dc;

    dc.onopen = () => {
      // Configure the session with our system prompt and tools
      dc.send(JSON.stringify({
        type: "session.update",
        session: {
          instructions: systemPrompt,
          tools: VOICE_TOOLS,
          input_audio_transcription: { model: "whisper-1" },
        },
      }));
    };

    dc.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleRealtimeEvent(msg);
      } catch {
        // ignore parse errors
      }
    };

    // 6. Create and set local offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // 7. Send offer to OpenAI Realtime API
    const sdpRes = await fetch("https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/sdp",
      },
      body: offer.sdp,
    });

    if (!sdpRes.ok) throw new Error(`SDP exchange failed: ${sdpRes.status}`);

    // 8. Set remote answer
    const answerSdp = await sdpRes.text();
    await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

    vs.active = true;
    vs.onStateChange?.(true);

  } catch (err) {
    console.error("[oe-guide] Voice start failed:", err);
    cleanup();
    throw err;
  }
}

// ── Handle Realtime API events ────────────────────────────────────

function handleRealtimeEvent(msg: Record<string, unknown>): void {
  const type = msg.type as string;

  // User speech transcript
  if (type === "conversation.item.input_audio_transcription.completed") {
    const transcript = (msg as { transcript?: string }).transcript;
    if (transcript) vs.onTranscript?.(transcript, "user");
  }

  // Assistant speech transcript
  if (type === "response.audio_transcript.done") {
    const transcript = (msg as { transcript?: string }).transcript;
    if (transcript) vs.onTranscript?.(transcript, "assistant");
  }

  // Tool call
  if (type === "response.function_call_arguments.done") {
    const name = (msg as { name?: string }).name;
    const args = (msg as { arguments?: string }).arguments;
    const callId = (msg as { call_id?: string }).call_id;

    if (name && args) {
      try {
        const parsed = JSON.parse(args);
        let command: AgentCommand | null = null;

        if (name === "navigate") {
          command = { type: "navigate", path: parsed.path, subtitle: parsed.subtitle };
        } else if (name === "highlight") {
          command = { type: "highlight", selector: parsed.selector, subtitle: parsed.subtitle, duration: 5000 };
        } else if (name === "click") {
          command = { type: "click", selector: parsed.selector, subtitle: parsed.subtitle };
        } else if (name === "guide_flow") {
          // Flow execution handled by the caller via onToolCall
          command = { type: "subtitle", text: `Starting guide: ${parsed.flow_id}`, duration: 3000 };
        }

        if (command && vs.onToolCall) {
          vs.onToolCall(command).then(() => {
            // Report tool result back to OpenAI
            vs.dc?.send(JSON.stringify({
              type: "conversation.item.create",
              item: {
                type: "function_call_output",
                call_id: callId,
                output: JSON.stringify({ success: true }),
              },
            }));
            // Trigger response generation after tool result
            vs.dc?.send(JSON.stringify({ type: "response.create" }));
          });
        }
      } catch {
        // ignore parse errors
      }
    }
  }
}

// ── Stop voice ────────────────────────────────────────────────────

function cleanup(): void {
  vs.pc?.close();
  vs.dc?.close();
  if (vs.audioEl) {
    vs.audioEl.srcObject = null;
    vs.audioEl.remove();
  }
  vs.pc = null;
  vs.dc = null;
  vs.audioEl = null;
  vs.active = false;
  vs.onStateChange?.(false);
}

export function stopVoice(): void {
  cleanup();
}

export function isVoiceActive(): boolean {
  return vs.active;
}
