/**
 * Voice: OpenAI Realtime over WebRTC.
 *
 * Flow:
 *   1. Ask our server for an ephemeral token + the agent instructions.
 *   2. Capture the mic and build the peer connection.
 *   3. Exchange SDP *through our server*, so the page never contacts
 *      api.openai.com and OpenEvent's CSP does not need widening.
 *   4. Tool calls come back over the data channel and are handed to the SDK,
 *      which runs the same flows the chat brain runs.
 *
 * Audio itself flows browser <-> OpenAI directly over WebRTC. Our server only
 * brokers the handshake.
 *
 * Note on the microphone: if OpenEvent still sends
 * `Permissions-Policy: microphone=()`, getUserMedia rejects before any prompt
 * is shown and nothing in this file can work around it. See
 * docs/voice-call-fix.md.
 */

export type VoiceStatus = "connecting" | "live" | "ended";

export interface VoiceCallbacks {
  /** Returns a short result string that is reported back to the model. */
  onToolCall: (name: string, args: Record<string, unknown>) => Promise<string>;
  onTranscript: (text: string, role: "user" | "assistant") => void;
  onStatus: (status: VoiceStatus) => void;
  onError: (message: string) => void;
}

interface VoiceState {
  active: boolean;
  pc: RTCPeerConnection | null;
  dc: RTCDataChannel | null;
  stream: MediaStream | null;
  audioEl: HTMLAudioElement | null;
  micEnabled: boolean;
  callbacks: VoiceCallbacks | null;
}

const vs: VoiceState = {
  active: false,
  pc: null,
  dc: null,
  stream: null,
  audioEl: null,
  micEnabled: true,
  callbacks: null,
};

export interface MicAvailability {
  available: boolean;
  /** Machine-readable cause, for the message we show and the docs we point at. */
  reason?: "no-api" | "blocked-by-permissions-policy" | "insecure-context" | "denied";
  detail?: string;
}

/**
 * Why voice might not be available, checked before we offer it.
 *
 * `document.featurePolicy.allowsFeature("microphone")` is the exact check for
 * the Permissions-Policy case: it reports the *document's* policy, which is
 * what a `microphone=()` response header sets. Detecting it up front lets the
 * UI hide the call button instead of failing after the user commits.
 */
export function checkMicAvailability(): MicAvailability {
  if (typeof window === "undefined") return { available: false, reason: "no-api" };

  if (!window.isSecureContext) {
    return { available: false, reason: "insecure-context", detail: "The page is not served over HTTPS." };
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return { available: false, reason: "no-api", detail: "This browser has no getUserMedia." };
  }

  const policy =
    (document as unknown as { featurePolicy?: { allowsFeature(f: string): boolean } }).featurePolicy ??
    (document as unknown as { permissionsPolicy?: { allowsFeature(f: string): boolean } }).permissionsPolicy;

  if (policy && typeof policy.allowsFeature === "function" && !policy.allowsFeature("microphone")) {
    return {
      available: false,
      reason: "blocked-by-permissions-policy",
      detail:
        "This page sends Permissions-Policy: microphone=(), which disables the microphone for the whole document. " +
        "It has to be changed on the server. See docs/voice-call-fix.md in openevent-guide.",
    };
  }

  return { available: true };
}

// ── Tools ─────────────────────────────────────────────────────────

/**
 * The voice agent gets the same guardrail as the chat brain: it can start a
 * known flow or move to a known page, but it cannot invent CSS selectors. The
 * previous free-form `highlight`/`click` tools handed the model exactly the
 * job the chat side had already been hardened against.
 */
function buildTools(flowIds: string[]) {
  return [
    {
      type: "function" as const,
      name: "guide_flow",
      description:
        "Run a predefined guided walkthrough in the user's browser. Use this whenever they ask how to do something.",
      parameters: {
        type: "object",
        properties: {
          flow_id: { type: "string", enum: flowIds, description: "Which walkthrough to run." },
        },
        required: ["flow_id"],
      },
    },
    {
      type: "function" as const,
      name: "navigate",
      description: "Take the user directly to a page in OpenEvent, without a full walkthrough.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: 'An OpenEvent path such as "/ticketing" or "/settings/payments".' },
          subtitle: { type: "string", description: "One short line to show on screen while navigating." },
        },
        required: ["path"],
      },
    },
  ];
}

// ── Session setup ─────────────────────────────────────────────────

type ApiFetch = (url: string, opts: RequestInit) => Promise<Record<string, unknown>>;

interface StartVoiceOptions {
  serverUrl: string;
  sessionId: string;
  lang?: string;
  flowIds: string[];
  apiFetch: ApiFetch;
  callbacks: VoiceCallbacks;
}

export async function startVoice(opts: StartVoiceOptions): Promise<void> {
  if (vs.active) return;

  const mic = checkMicAvailability();
  if (!mic.available) {
    throw new Error(mic.detail ?? "Microphone is not available on this page.");
  }

  vs.callbacks = opts.callbacks;
  opts.callbacks.onStatus("connecting");

  try {
    // 1. Token + instructions from our server.
    const session = (await opts.apiFetch(`${opts.serverUrl}/api/voice-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: opts.sessionId, lang: opts.lang }),
    })) as { clientSecret?: string; instructions?: string; model?: string };

    if (!session.clientSecret) throw new Error("The server did not return a voice token.");

    // 2. Peer connection + audio sink.
    const pc = new RTCPeerConnection();
    vs.pc = pc;

    const audioEl = document.createElement("audio");
    audioEl.autoplay = true;
    vs.audioEl = audioEl;
    pc.ontrack = (event) => {
      audioEl.srcObject = event.streams[0];
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        opts.callbacks.onError("The call dropped.");
        stopVoice();
      }
    };

    // 3. Microphone.
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    vs.stream = stream;
    vs.micEnabled = true;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    // 4. Data channel for tool calls and transcripts.
    const dc = pc.createDataChannel("oai-events");
    vs.dc = dc;

    dc.onopen = () => {
      dc.send(
        JSON.stringify({
          type: "session.update",
          session: {
            instructions: session.instructions ?? "You are the OpenEvent Guide.",
            tools: buildTools(opts.flowIds),
            tool_choice: "auto",
            input_audio_transcription: { model: "whisper-1" },
          },
        }),
      );
    };

    dc.onmessage = (event) => {
      try {
        handleRealtimeEvent(JSON.parse(event.data));
      } catch {
        /* not JSON, ignore */
      }
    };

    // 5. Offer.
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // 6. SDP through our server, not straight to OpenAI.
    const sdpResult = (await opts.apiFetch(`${opts.serverUrl}/api/voice-sdp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: opts.sessionId,
        sdp: offer.sdp,
        clientSecret: session.clientSecret,
        model: session.model,
      }),
    })) as { answer?: string };

    if (!sdpResult.answer) throw new Error("The voice handshake did not return an answer.");

    await pc.setRemoteDescription({ type: "answer", sdp: sdpResult.answer });

    vs.active = true;
    opts.callbacks.onStatus("live");
  } catch (err) {
    console.error("[oe-guide] Voice start failed:", err);
    cleanup();
    throw err;
  }
}

// ── Realtime events ───────────────────────────────────────────────

function respondToTool(callId: string | undefined, output: string): void {
  if (!callId) return;
  vs.dc?.send(
    JSON.stringify({
      type: "conversation.item.create",
      item: { type: "function_call_output", call_id: callId, output },
    }),
  );
  vs.dc?.send(JSON.stringify({ type: "response.create" }));
}

function handleRealtimeEvent(msg: Record<string, unknown>): void {
  const type = msg.type as string;

  if (type === "conversation.item.input_audio_transcription.completed") {
    const transcript = (msg as { transcript?: string }).transcript;
    if (transcript) vs.callbacks?.onTranscript(transcript, "user");
    return;
  }

  if (type === "response.audio_transcript.done") {
    const transcript = (msg as { transcript?: string }).transcript;
    if (transcript) vs.callbacks?.onTranscript(transcript, "assistant");
    return;
  }

  if (type === "error") {
    const message = (msg as { error?: { message?: string } }).error?.message;
    console.error("[oe-guide] Realtime error:", message ?? msg);
    if (message) vs.callbacks?.onError(message);
    return;
  }

  if (type === "response.function_call_arguments.done") {
    const name = (msg as { name?: string }).name;
    const rawArgs = (msg as { arguments?: string }).arguments;
    const callId = (msg as { call_id?: string }).call_id;
    if (!name || !vs.callbacks) return;

    let args: Record<string, unknown> = {};
    if (rawArgs) {
      try {
        args = JSON.parse(rawArgs);
      } catch {
        respondToTool(callId, JSON.stringify({ ok: false, error: "arguments were not valid JSON" }));
        return;
      }
    }

    // The SDK actually runs the flow and tells us how it went, so the model
    // can react to a step that could not complete instead of assuming success.
    vs.callbacks
      .onToolCall(name, args)
      .then((result) => respondToTool(callId, result))
      .catch((err) => respondToTool(callId, JSON.stringify({ ok: false, error: String(err?.message ?? err) })));
  }
}

// ── Mic + teardown ────────────────────────────────────────────────

/**
 * Mute by disabling the track, not by tearing down the call.
 *
 * Muting used to call stopVoice() and unmuting used to reconnect from scratch:
 * a new token, a new session, and the conversation so far thrown away.
 */
export function setMicEnabled(enabled: boolean): void {
  vs.micEnabled = enabled;
  vs.stream?.getAudioTracks().forEach((track) => {
    track.enabled = enabled;
  });
}

export function isMicEnabled(): boolean {
  return vs.micEnabled;
}

function cleanup(): void {
  // Stopping the tracks is what turns off the browser's recording indicator.
  // Without it the dot stayed lit after the call ended, on a page whose whole
  // premise is that the user trusts us with an open microphone.
  vs.stream?.getTracks().forEach((track) => track.stop());
  vs.dc?.close();
  vs.pc?.close();
  if (vs.audioEl) {
    vs.audioEl.srcObject = null;
    vs.audioEl.remove();
  }
  vs.stream = null;
  vs.pc = null;
  vs.dc = null;
  vs.audioEl = null;
  vs.active = false;
  vs.micEnabled = true;
  vs.callbacks?.onStatus("ended");
  vs.callbacks = null;
}

export function stopVoice(): void {
  if (!vs.pc && !vs.stream && !vs.active) return;
  cleanup();
}

export function isVoiceActive(): boolean {
  return vs.active;
}
