/**
 * OpenEvent Guide Server
 *
 * Serves the SDK bundle and handles chat via HTTP POST.
 * No WebSocket. The SDK auto-detects this server's URL from its own script src.
 */

import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { handleChat } from "./brain.js";
import type { AgentCommand, WSMessageToAgent } from "../shared/types.js";

const PORT = Number(process.env.PORT ?? 3847);
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..", "..");

const app = new Hono();

app.use("*", cors({ origin: "*" }));

// ── SDK bundle ────────────────────────────────────────────────────
app.get("/sdk.js", (c) => {
  const p = join(projectRoot, "dist", "sdk", "sdk.iife.js");
  if (existsSync(p)) {
    c.header("Content-Type", "application/javascript");
    c.header("Cache-Control", "public, max-age=3600");
    return c.body(readFileSync(p, "utf-8"));
  }
  return c.text("SDK not built. Run: npm run build:sdk", 404);
});

// ── Demo page ─────────────────────────────────────────────────────
app.get("/", (c) => {
  const p = join(projectRoot, "public", "demo.html");
  if (existsSync(p)) {
    c.header("Content-Type", "text/html");
    return c.body(readFileSync(p, "utf-8"));
  }
  return c.text("Not found", 404);
});

app.get("/health", (c) => c.json({ status: "ok", uptime: process.uptime() }));

// ── Session state ─────────────────────────────────────────────────
interface Session {
  chatHistory: Array<{ role: "user" | "assistant"; content: string }>;
  pendingCommands: AgentCommand[];
  user: Record<string, unknown> | null;
  lastActivity: number;
}

const sessions = new Map<string, Session>();

function getSession(id: string): Session {
  let s = sessions.get(id);
  if (!s) {
    s = { chatHistory: [], pendingCommands: [], user: null, lastActivity: Date.now() };
    sessions.set(id, s);
  }
  s.lastActivity = Date.now();
  return s;
}

// ── Chat API ──────────────────────────────────────────────────────
app.post("/api/chat", async (c) => {
  const body = await c.req.json<{
    sessionId: string;
    message: string;
    user?: Record<string, unknown>;
  }>();

  const session = getSession(body.sessionId);
  if (body.user) session.user = body.user;

  session.chatHistory.push({ role: "user", content: body.message });

  const response = await handleChat(
    session.chatHistory,
    (msg: WSMessageToAgent) => {
      if (msg.type === "execute") {
        session.pendingCommands.push(msg.command);
      } else if (msg.type === "flow-start") {
        for (const step of msg.flow.steps) {
          session.pendingCommands.push(step.command);
        }
      }
      return true;
    },
    true
  );

  session.chatHistory.push({ role: "assistant", content: response.text });

  return c.json({
    reply: response.text,
    commands: session.pendingCommands.splice(0),
  });
});

// ── Voice session (ephemeral token for OpenAI Realtime) ───────────
app.post("/api/voice-session", async (c) => {
  const { sessionId } = await c.req.json<{ sessionId: string }>();
  getSession(sessionId); // ensure session exists

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return c.json({ error: "OPENAI_API_KEY not configured" }, 500);
  }

  // Create an ephemeral token so the browser can connect directly to OpenAI
  // without exposing our API key
  const res = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-realtime-preview",
      voice: "verse",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[voice] Token creation failed:", err);
    return c.json({ error: "Failed to create voice session" }, 502);
  }

  const data = await res.json();
  return c.json({ clientSecret: data.client_secret?.value ?? data.client_secret });
});

// ── Cleanup ───────────────────────────────────────────────────────
setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [id, s] of sessions) {
    if (s.lastActivity < cutoff) sessions.delete(id);
  }
}, 5 * 60 * 1000);

// ── Start ─────────────────────────────────────────────────────────
serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`\n  OpenEvent Guide Server`);
  console.log(`  ─────────────────────`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  GET  /sdk.js     (the SDK bundle)`);
  console.log(`  POST /api/chat          (chat endpoint)`);
  console.log(`  POST /api/voice-session (voice token)`);
  console.log(`  GET  /health            (healthcheck)\n`);
});
