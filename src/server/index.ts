/**
 * OpenEvent Guide server.
 *
 * Serves the SDK bundle, answers chat over HTTP POST, and brokers the voice
 * session. Deliberately small: no WebSocket, no database.
 *
 * The voice endpoints proxy OpenAI rather than letting the browser call
 * api.openai.com directly. That is what lets the guide run inside OpenEvent's
 * Content-Security-Policy without widening connect-src : the page only ever
 * talks to this server. See docs/voice-call-fix.md.
 */

import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { buildVoiceInstructions, handleChat, MAX_HISTORY_TURNS } from "./brain.js";
import { getFlowById, getFlowSummaries } from "../flows/registry.js";
import { normalizeLang } from "../shared/i18n.js";
import type { ChatRequest, ChatTurn, GuideUser } from "../shared/types.js";

const PORT = Number(process.env.PORT ?? 3847);
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..", "..");

/** Shared secret. When unset the API is open : fine for local, not for a public host. */
const API_TOKEN = process.env.GUIDE_API_TOKEN ?? "";
/** Comma-separated origin allowlist. Empty means allow any origin. */
const ALLOWED_ORIGINS = (process.env.GUIDE_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const REALTIME_MODEL = process.env.GUIDE_REALTIME_MODEL ?? "gpt-4o-realtime-preview";
const REALTIME_VOICE = process.env.GUIDE_REALTIME_VOICE ?? "verse";
/**
 * Both endpoints are env-overridable because OpenAI has moved them once
 * already (the GA Realtime API uses /v1/realtime/client_secrets and
 * /v1/realtime/calls). Overriding beats a redeploy when that happens again.
 */
const REALTIME_SESSION_URL = process.env.GUIDE_REALTIME_SESSION_URL ?? "https://api.openai.com/v1/realtime/sessions";
const REALTIME_SDP_URL = process.env.GUIDE_REALTIME_SDP_URL ?? "https://api.openai.com/v1/realtime";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (ALLOWED_ORIGINS.length === 0) return origin ?? "*";
      return ALLOWED_ORIGINS.includes(origin) ? origin : null;
    },
    allowHeaders: ["Content-Type", "Authorization", "X-Guide-Token"],
  }),
);

// ── Auth ──────────────────────────────────────────────────────────

/**
 * The API used to be wide open on a public host, which meant anyone who found
 * the URL could spend the OpenAI key. When GUIDE_API_TOKEN is set, every
 * /api/* route requires it.
 */
app.use("/api/*", async (c, next) => {
  if (!API_TOKEN) return next();
  const header = c.req.header("Authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  const token = bearer || c.req.header("X-Guide-Token") || "";
  if (token !== API_TOKEN) return c.json({ error: "Unauthorized" }, 401);
  return next();
});

// ── Rate limiting ─────────────────────────────────────────────────

const RATE_LIMIT = Number(process.env.GUIDE_RATE_LIMIT ?? 30); // requests
const RATE_WINDOW_MS = 60_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT;
}

function clientKey(c: { req: { header: (n: string) => string | undefined } }, sessionId?: string): string {
  return sessionId || c.req.header("x-forwarded-for") || "anonymous";
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
  if (rateLimited(clientKey(c, body.sessionId))) {
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
  if (rateLimited(clientKey(c, body.sessionId))) {
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

  const data = (await res.json()) as { client_secret?: { value?: string } | string };
  const clientSecret =
    typeof data.client_secret === "string" ? data.client_secret : data.client_secret?.value;

  if (!clientSecret) {
    console.error("[voice] No client secret in response:", JSON.stringify(data).slice(0, 300));
    return c.json({ error: "Voice session response had no client secret" }, 502);
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
  if (rateLimited(clientKey(c, body.sessionId))) {
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
    console.error("[voice] SDP exchange failed:", res.status, answer.slice(0, 300));
    return c.json({ error: "SDP exchange failed", status: res.status, detail: answer.slice(0, 300) }, 502);
  }

  return c.json({ answer });
});

// ── Cleanup ───────────────────────────────────────────────────────

setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [id, s] of sessions) {
    if (s.lastActivity < cutoff) sessions.delete(id);
  }
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}, 5 * 60 * 1000);

// ── Start ─────────────────────────────────────────────────────────

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`\n  OpenEvent Guide Server`);
  console.log(`  ---------------------`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  GET  /sdk.js             (the SDK bundle)`);
  console.log(`  GET  /api/flows          (flow summaries)`);
  console.log(`  GET  /api/flow/:id       (one resolved flow)`);
  console.log(`  POST /api/chat           (chat)`);
  console.log(`  POST /api/voice-session  (voice token + instructions)`);
  console.log(`  POST /api/voice-sdp      (WebRTC SDP proxy)`);
  console.log(`  GET  /health\n`);
  if (!API_TOKEN) {
    console.warn("  WARNING: GUIDE_API_TOKEN is not set. /api/* is open to anyone.\n");
  }
});
