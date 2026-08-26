/**
 * OpenEvent Guide Server
 *
 * Handles:
 * 1. Chat API (widget <-> Claude brain)
 * 2. WebSocket connections (server <-> browser agent)
 * 3. Flow execution coordination
 */

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { handleChat } from "./brain.js";
import type {
  WSMessageToAgent,
  WSMessageFromAgent,
  WSMessageToWidget,
  WSMessageFromWidget,
} from "../shared/types.js";

const app = new Hono();
const PORT = Number(process.env.PORT ?? 3847);

// ── CORS for the widget ───────────────────────────────────────────
app.use(
  "*",
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://app.openevent.io",
      "https://app.test.openevent.io",
      "https://app.play.openevent.io",
    ],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

// ── Static files (built widget + agent scripts, demo page) ───────
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..", "..");

// Serve built scripts
app.get("/agent.js", (c) => {
  const path = join(projectRoot, "dist", "agent", "agent.iife.js");
  if (existsSync(path)) {
    c.header("Content-Type", "application/javascript");
    c.header("Access-Control-Allow-Origin", "*");
    return c.body(readFileSync(path, "utf-8"));
  }
  return c.text("Agent not built yet. Run: npm run build:agent", 404);
});

app.get("/widget.js", (c) => {
  const path = join(projectRoot, "dist", "widget", "widget.iife.js");
  if (existsSync(path)) {
    c.header("Content-Type", "application/javascript");
    c.header("Access-Control-Allow-Origin", "*");
    return c.body(readFileSync(path, "utf-8"));
  }
  return c.text("Widget not built yet. Run: npm run build:widget", 404);
});

// Serve demo page
app.get("/", (c) => {
  const path = join(projectRoot, "public", "demo.html");
  if (existsSync(path)) {
    c.header("Content-Type", "text/html");
    return c.body(readFileSync(path, "utf-8"));
  }
  return c.text("Demo page not found", 404);
});

// ── Health check ──────────────────────────────────────────────────
app.get("/health", (c) => c.json({ status: "ok", uptime: process.uptime() }));

// ── Session management ────────────────────────────────────────────
interface Session {
  id: string;
  agentWs: WebSocket | null;
  widgetWs: WebSocket | null;
  chatHistory: Array<{ role: "user" | "assistant"; content: string }>;
  createdAt: number;
}

const sessions = new Map<string, Session>();

function getOrCreateSession(sessionId: string): Session {
  let session = sessions.get(sessionId);
  if (!session) {
    session = {
      id: sessionId,
      agentWs: null,
      widgetWs: null,
      chatHistory: [],
      createdAt: Date.now(),
    };
    sessions.set(sessionId, session);
  }
  return session;
}

/** Send a command to the browser agent for a session */
function sendToAgent(sessionId: string, msg: WSMessageToAgent): boolean {
  const session = sessions.get(sessionId);
  if (session?.agentWs?.readyState === WebSocket.OPEN) {
    session.agentWs.send(JSON.stringify(msg));
    return true;
  }
  return false;
}

/** Send a message to the chat widget for a session */
function sendToWidget(sessionId: string, msg: WSMessageToWidget): boolean {
  const session = sessions.get(sessionId);
  if (session?.widgetWs?.readyState === WebSocket.OPEN) {
    session.widgetWs.send(JSON.stringify(msg));
    return true;
  }
  return false;
}

// ── HTTP server + WebSocket ───────────────────────────────────────
const httpServer = createServer(async (req, res) => {
  // Let Hono handle non-WebSocket HTTP requests
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  // Skip WebSocket upgrade paths
  if (url.pathname === "/agent" || url.pathname === "/widget") {
    return;
  }

  const honoRes = await app.fetch(
    new Request(url.toString(), {
      method: req.method,
      headers: Object.fromEntries(
        Object.entries(req.headers).filter(
          (h): h is [string, string] => typeof h[1] === "string"
        )
      ),
      body:
        req.method !== "GET" && req.method !== "HEAD"
          ? await new Promise<string>((resolve) => {
              let body = "";
              req.on("data", (chunk: Buffer) => (body += chunk.toString()));
              req.on("end", () => resolve(body));
            })
          : undefined,
    })
  );

  res.writeHead(honoRes.status, Object.fromEntries(honoRes.headers.entries()));
  const body = await honoRes.text();
  res.end(body);
});

// ── WebSocket server for browser agent connections ────────────────
const agentWss = new WebSocketServer({ noServer: true });
const widgetWss = new WebSocketServer({ noServer: true });

httpServer.on("upgrade", (request, socket, head) => {
  const url = new URL(request.url ?? "/", `http://localhost:${PORT}`);

  if (url.pathname === "/agent") {
    agentWss.handleUpgrade(request, socket, head, (ws) => {
      agentWss.emit("connection", ws, request);
    });
  } else if (url.pathname === "/widget") {
    widgetWss.handleUpgrade(request, socket, head, (ws) => {
      widgetWss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

// ── Agent WebSocket handler ───────────────────────────────────────
agentWss.on("connection", (ws, req) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const sessionId = url.searchParams.get("session") ?? crypto.randomUUID();
  const session = getOrCreateSession(sessionId);
  session.agentWs = ws;

  console.log(`[agent] Connected: session=${sessionId}`);

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString()) as WSMessageFromAgent;

      switch (msg.type) {
        case "ready":
          console.log(`[agent] Ready at ${msg.url}`);
          // Notify widget that agent is connected
          sendToWidget(sessionId, { type: "connected" });
          break;

        case "step-complete":
          console.log(`[agent] Step complete: ${msg.stepId}`);
          break;

        case "step-error":
          console.log(`[agent] Step error: ${msg.stepId} - ${msg.error}`);
          sendToWidget(sessionId, {
            type: "chat",
            message: {
              id: crypto.randomUUID(),
              role: "assistant",
              content: `I had trouble with that step. Let me try a different approach. Error: ${msg.error}`,
              timestamp: Date.now(),
            },
          });
          break;

        case "flow-complete":
          console.log(`[agent] Flow complete: ${msg.flowId}`);
          break;

        case "pong":
          break;
      }
    } catch (err) {
      console.error("[agent] Invalid message:", err);
    }
  });

  ws.on("close", () => {
    console.log(`[agent] Disconnected: session=${sessionId}`);
    if (session.agentWs === ws) {
      session.agentWs = null;
    }
  });

  // Keepalive
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "ping" }));
    } else {
      clearInterval(pingInterval);
    }
  }, 30000);
});

// ── Widget WebSocket handler ──────────────────────────────────────
widgetWss.on("connection", (ws, req) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const sessionId = url.searchParams.get("session") ?? crypto.randomUUID();
  const session = getOrCreateSession(sessionId);
  session.widgetWs = ws;

  console.log(`[widget] Connected: session=${sessionId}`);

  // Send connection confirmation
  sendToWidget(sessionId, { type: "connected" });

  ws.on("message", async (raw) => {
    try {
      const msg = JSON.parse(raw.toString()) as WSMessageFromWidget;

      switch (msg.type) {
        case "chat": {
          // User sent a message
          session.chatHistory.push({
            role: "user",
            content: msg.content,
          });

          // Show typing indicator
          sendToWidget(sessionId, { type: "typing", isTyping: true });

          // Process with the brain
          const response = await handleChat(
            session.chatHistory,
            (command) => sendToAgent(sessionId, command),
            session.agentWs?.readyState === WebSocket.OPEN
          );

          sendToWidget(sessionId, { type: "typing", isTyping: false });

          // Send response
          session.chatHistory.push({
            role: "assistant",
            content: response.text,
          });

          sendToWidget(sessionId, {
            type: "chat",
            message: {
              id: crypto.randomUUID(),
              role: "assistant",
              content: response.text,
              timestamp: Date.now(),
            },
          });

          break;
        }

        case "flow-control": {
          // User wants to pause/resume/cancel the current flow
          const agentMsg: WSMessageToAgent =
            msg.action === "pause"
              ? { type: "flow-pause" }
              : msg.action === "resume"
                ? { type: "flow-resume" }
                : { type: "flow-cancel" };
          sendToAgent(sessionId, agentMsg);
          break;
        }
      }
    } catch (err) {
      console.error("[widget] Error processing message:", err);
    }
  });

  ws.on("close", () => {
    console.log(`[widget] Disconnected: session=${sessionId}`);
    if (session.widgetWs === ws) {
      session.widgetWs = null;
    }
  });
});

// ── Cleanup stale sessions ────────────────────────────────────────
setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000; // 1 hour
  for (const [id, session] of sessions) {
    if (
      session.createdAt < cutoff &&
      !session.agentWs &&
      !session.widgetWs
    ) {
      sessions.delete(id);
    }
  }
}, 5 * 60 * 1000);

// ── Start ─────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`\n  OpenEvent Guide Server`);
  console.log(`  ─────────────────────`);
  console.log(`  HTTP:      http://localhost:${PORT}`);
  console.log(`  Agent WS:  ws://localhost:${PORT}/agent`);
  console.log(`  Widget WS: ws://localhost:${PORT}/widget`);
  console.log(`  Health:    http://localhost:${PORT}/health\n`);
});
