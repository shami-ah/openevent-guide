/**
 * The guide server's routes.
 *
 * Serves the SDK bundle, answers chat over HTTP POST, and brokers the voice
 * session. Deliberately small: no WebSocket, no database.
 *
 * The voice endpoints proxy OpenAI rather than letting the browser call
 * api.openai.com directly. That is what lets the guide run inside OpenEvent's
 * Content-Security-Policy without widening connect-src : the page only ever
 * talks to this server. See docs/voice-call-fix.md.
 *
 * Built by createApp() with no side effects, so tests can drive the real
 * routes. src/server/index.ts resolves the config and starts listening.
 */

import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { buildVoiceInstructions, handleChat, MAX_HISTORY_TURNS } from "./brain.js";
import { clientAddress, corsOrigin, createRateLimiter, type ServerConfig } from "./security.js";
import { getFlowById, getFlowSummaries } from "../flows/registry.js";
import { normalizeLang } from "../shared/i18n.js";
import type { ChatRequest, ChatTurn, GuideUser } from "../shared/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..", "..");

const REALTIME_MODEL = process.env.GUIDE_REALTIME_MODEL ?? "gpt-4o-realtime-preview";
const REALTIME_VOICE = process.env.GUIDE_REALTIME_VOICE ?? "verse";
/**
 * Both endpoints are env-overridable because OpenAI has moved them once
 * already (the GA Realtime API uses /v1/realtime/client_secrets and
 * /v1/realtime/calls). Overriding beats a redeploy when that happens again.
 */
const REALTIME_SESSION_URL = process.env.GUIDE_REALTIME_SESSION_URL ?? "https://api.openai.com/v1/realtime/sessions";
const REALTIME_SDP_URL = process.env.GUIDE_REALTIME_SDP_URL ?? "https://api.openai.com/v1/realtime";

/** What @hono/node-server passes as c.env: the raw Node request. */
type Bindings = { incoming?: { socket?: { remoteAddress?: string } } };

export interface AppOptions extends ServerConfig {
  /** Requests per minute per client address. */
  rateLimit: number;
}

export function createApp(config: AppOptions) {
  const app = new Hono<{ Bindings: Bindings }>();

  app.use(
    "*",
    cors({
      origin: corsOrigin(config),
      allowHeaders: ["Content-Type", "Authorization", "X-Guide-Token"],
    }),
  );

  // ── Auth ──────────────────────────────────────────────────────────

  /**
   * The API used to be wide open on a public host, which meant anyone who found
   * the URL could spend the OpenAI key. When GUIDE_API_TOKEN is set, every
   * /api/* route requires it; resolveServerConfig() refuses to start a
   * non-local server without one.
   */
  app.use("/api/*", async (c, next) => {
    if (!config.apiToken) return next();
    const header = c.req.header("Authorization") ?? "";
    const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
    const token = bearer || c.req.header("X-Guide-Token") || "";
    if (token !== config.apiToken) return c.json({ error: "Unauthorized" }, 401);
    return next();
  });

  // ── Rate limiting ─────────────────────────────────────────────────

  /**
   * Keyed on the client address, never on the session id. The caller picks its
   * own session id, so keying on it let a client reset its bucket by sending a
   * new one with every request.
   */
  const limiter = createRateLimiter(config.rateLimit, 60_000);

  function rateLimited(c: Context<{ Bindings: Bindings }>): boolean {
    const peer = c.env?.incoming?.socket?.remoteAddress;
    return limiter.hit(clientAddress(peer, c.req.header("x-forwarded-for"), config.trustProxyHops));
  }

  // ── Static ────────────────────────────────────────────────────────

  app.get("/sdk.js", (c) => {
    const p = join(projectRoot, "dist", "sdk", "sdk.iife.js");
    if (!existsSync(p)) return c.text("SDK not built. Run: npm run build:sdk", 404);
    c.header("Content-Type", "application/javascript");
    c.header("Cache-Control", "public, max-age=300");
    return c.body(readFileSync(p, "utf-8"));
  });

  app.get("/", (c) => {
    const p = join(projectRoot, "public", "demo.html");
    if (!existsSync(p)) return c.text("Not found", 404);
    c.header("Content-Type", "text/html");
    return c.body(readFileSync(p, "utf-8"));
  });

  app.get("/health", (c) => c.json({ status: "ok", uptime: process.uptime() }));

  // ── Sessions ──────────────────────────────────────────────────────

  interface Session {
    chatHistory: ChatTurn[];
    user: GuideUser | null;
    lastActivity: number;
  }

  const sessions = new Map<string, Session>();
  const MAX_SESSIONS = 5000;

  function getSession(id: string): Session {
    let s = sessions.get(id);
    if (!s) {
      // Cheap bound so a flood of session ids cannot grow the map forever.
      if (sessions.size >= MAX_SESSIONS) {
        const oldest = [...sessions.entries()].sort((a, b) => a[1].lastActivity - b[1].lastActivity)[0];
        if (oldest) sessions.delete(oldest[0]);
      }
      s = { chatHistory: [], user: null, lastActivity: Date.now() };
      sessions.set(id, s);
    }
    s.lastActivity = Date.now();
    return s;
  }

  // ── Flows ─────────────────────────────────────────────────────────
  // The voice agent runs in the browser, so it needs to be able to fetch a flow
  // by id. Previously guide_flow in voice mode only printed a subtitle and never
  // ran anything, because the browser had no way to get the steps.

  app.get("/api/flows", (c) => {
    const lang = normalizeLang(c.req.query("lang"));
    return c.json({ flows: getFlowSummaries(lang) });
  });

  app.get("/api/flow/:id", (c) => {
    const lang = normalizeLang(c.req.query("lang"));
    const flow = getFlowById(c.req.param("id"), lang);
    if (!flow) return c.json({ error: "Unknown flow" }, 404);
    return c.json({ flow });
  });

  // ── Chat ──────────────────────────────────────────────────────────

  app.post("/api/chat", async (c) => {
    let body: ChatRequest;
    try {
      body = await c.req.json<ChatRequest>();
    } catch {
      return c.json({ error: "Invalid JSON" }, 400);
    }

    if (!body?.sessionId || typeof body.message !== "string" || !body.message.trim()) {
      return c.json({ error: "sessionId and message are required" }, 400);
    }
    if (body.message.length > 2000) {
      return c.json({ error: "Message too long" }, 413);
    }
    if (rateLimited(c)) {
      return c.json({ error: "Too many requests. Give it a moment." }, 429);
    }

    const session = getSession(body.sessionId);
    if (body.user) session.user = body.user;

    session.chatHistory.push({ role: "user", content: body.message });

    const lang = normalizeLang(body.user?.language ?? session.user?.language);
    const result = await handleChat({
      history: session.chatHistory,
      user: session.user,
      lang,
      path: body.path,
    });

    session.chatHistory.push({ role: "assistant", content: result.text });
    // Trim in place so a long-running session cannot grow without bound.
    if (session.chatHistory.length > MAX_HISTORY_TURNS * 2) {
      session.chatHistory = session.chatHistory.slice(-MAX_HISTORY_TURNS * 2);
    }

    return c.json({ reply: result.text, commands: result.commands, flowId: result.flowId });
  });

  // ── Voice ─────────────────────────────────────────────────────────

  app.post("/api/voice-session", async (c) => {
    let body: { sessionId?: string; lang?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON" }, 400);
    }
    if (!body?.sessionId) return c.json({ error: "sessionId is required" }, 400);
    if (rateLimited(c)) {
      return c.json({ error: "Too many requests." }, 429);
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return c.json({ error: "OPENAI_API_KEY not configured" }, 500);

    const session = getSession(body.sessionId);
    const lang = normalizeLang(body.lang ?? session.user?.language);

    const res = await fetch(REALTIME_SESSION_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // Required by the beta Realtime endpoint. Harmless on the GA one.
        "OpenAI-Beta": "realtime=v1",
      },
      body: JSON.stringify({ model: REALTIME_MODEL, voice: REALTIME_VOICE }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[voice] Token creation failed:", res.status, err);
      return c.json({ error: "Failed to create voice session", detail: err.slice(0, 300) }, 502);
    }

    const data = (await res.json()) as Record<string, unknown>;

    // OpenAI has shipped multiple response shapes for the Realtime session
    // endpoint: { client_secret: "..." }, { client_secret: { value: "..." } },
    // and potentially others. Try all known layouts.
    let clientSecret: string | undefined;
    const raw = data.client_secret;
    if (typeof raw === "string") {
      clientSecret = raw;
    } else if (raw && typeof raw === "object" && "value" in (raw as Record<string, unknown>)) {
      clientSecret = String((raw as Record<string, unknown>).value);
    }

    if (!clientSecret) {
      const preview = JSON.stringify(data).slice(0, 400);
      console.error("[voice] No client secret in response:", preview);
      return c.json({
        error: "Voice session response had no client secret",
        detail: `OpenAI returned an unexpected shape. Preview: ${preview}`,
      }, 502);
    }

    return c.json({
      clientSecret,
      model: REALTIME_MODEL,
      instructions: buildVoiceInstructions(session.user, lang),
    });
  });

  /**
   * SDP exchange proxy.
   *
   * The browser used to POST its offer straight to api.openai.com, which
   * OpenEvent's CSP blocks (connect-src does not list it) and which the
   * extension proxy did not cover, because that call bypassed apiFetch.
   * Routing it through here means the page only ever contacts this origin.
   */
  app.post("/api/voice-sdp", async (c) => {
    let body: { sessionId?: string; sdp?: string; clientSecret?: string; model?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON" }, 400);
    }
    if (!body?.sdp || !body.clientSecret) {
      return c.json({ error: "sdp and clientSecret are required" }, 400);
    }
    if (rateLimited(c)) {
      return c.json({ error: "Too many requests." }, 429);
    }

    const url = `${REALTIME_SDP_URL}?model=${encodeURIComponent(body.model ?? REALTIME_MODEL)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${body.clientSecret}`,
        "Content-Type": "application/sdp",
        "OpenAI-Beta": "realtime=v1",
      },
      body: body.sdp,
    });

    const answer = await res.text();
    if (!res.ok) {
      const detail = answer.slice(0, 400);
      console.error("[voice] SDP exchange failed:", res.status, detail);
      return c.json({
        error: "SDP exchange failed",
        detail: `OpenAI returned ${res.status}. ${detail}`,
      }, 502);
    }

    return c.json({ answer });
  });

  // ── Cleanup ───────────────────────────────────────────────────────

  /** Drops idle sessions and expired rate-limit buckets. index.ts runs it on a timer. */
  function sweep(): void {
    const cutoff = Date.now() - 60 * 60 * 1000;
    for (const [id, s] of sessions) {
      if (s.lastActivity < cutoff) sessions.delete(id);
    }
    limiter.sweep();
  }

  return { app, sweep };
}
