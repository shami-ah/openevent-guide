// @vitest-environment node
/**
 * The live server was reachable by anyone (no token), echoed any CORS origin,
 * and let a client dodge the rate limit by sending a fresh session id each
 * time. These drive the real routes to pin all three shut.
 */

import { randomUUID } from "crypto";
import { describe, expect, it, vi } from "vitest";

vi.mock("./brain.js", () => ({
  MAX_HISTORY_TURNS: 20,
  buildVoiceInstructions: () => "",
  handleChat: vi.fn(async () => ({ text: "ok", commands: [], flowId: undefined })),
}));

const { createApp } = await import("./app.js");
const { resolveServerConfig } = await import("./security.js");

/** Generated per run: no token value is ever written into the repo. */
const TOKEN = randomUUID();

function publicApp(rateLimit = 30) {
  const config = resolveServerConfig({ GUIDE_HOST: "0.0.0.0", GUIDE_API_TOKEN: TOKEN, NODE_ENV: "production" });
  return createApp({ ...config, rateLimit }).app;
}

/** What @hono/node-server hands the app: the TCP peer of the request. */
function fromPeer(address: string) {
  return { incoming: { socket: { remoteAddress: address } } };
}

function chat(sessionId: string, headers: Record<string, string> = {}) {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ sessionId, message: "hello" }),
  };
}

describe("API token", () => {
  it("rejects /api/* without the token", async () => {
    const res = await publicApp().request("/api/flows", {}, fromPeer("203.0.113.5"));
    expect(res.status).toBe(401);
  });

  it("rejects an unknown /api/* route without the token, rather than 404ing past the check", async () => {
    const res = await publicApp().request("/api/nope", { method: "POST" }, fromPeer("203.0.113.5"));
    expect(res.status).toBe(401);
  });

  it("accepts the token as a bearer or X-Guide-Token", async () => {
    const app = publicApp();
    const bearer = await app.request("/api/flows", { headers: { Authorization: `Bearer ${TOKEN}` } }, fromPeer("203.0.113.5"));
    const header = await app.request("/api/flows", { headers: { "X-Guide-Token": TOKEN } }, fromPeer("203.0.113.5"));
    expect(bearer.status).toBe(200);
    expect(header.status).toBe(200);
  });

  it("needs no token in local development", async () => {
    const { app } = createApp({ ...resolveServerConfig({}), rateLimit: 30 });
    const res = await app.request("/api/flows", {}, fromPeer("127.0.0.1"));
    expect(res.status).toBe(200);
  });
});

describe("CORS", () => {
  it("does not echo an arbitrary origin when no allowlist is set", async () => {
    const res = await publicApp().request(
      "/api/chat",
      { method: "OPTIONS", headers: { Origin: "https://evil-example.com", "Access-Control-Request-Method": "POST" } },
      fromPeer("203.0.113.5"),
    );
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("allows a listed origin", async () => {
    const config = resolveServerConfig({
      GUIDE_HOST: "0.0.0.0",
      GUIDE_API_TOKEN: TOKEN,
      GUIDE_ALLOWED_ORIGINS: "https://app.test.openevent.io",
    });
    const { app } = createApp({ ...config, rateLimit: 30 });
    const res = await app.request(
      "/api/chat",
      { method: "OPTIONS", headers: { Origin: "https://app.test.openevent.io", "Access-Control-Request-Method": "POST" } },
      fromPeer("203.0.113.5"),
    );
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://app.test.openevent.io");
  });
});

describe("rate limit", () => {
  it("is not reset by rotating the session id", async () => {
    const app = publicApp(3);
    const auth = { Authorization: `Bearer ${TOKEN}` };
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) {
      const res = await app.request("/api/chat", chat(`session-${i}`, auth), fromPeer("203.0.113.5"));
      statuses.push(res.status);
    }
    expect(statuses).toEqual([200, 200, 200, 429, 429]);
  });

  it("is not reset by a forged X-Forwarded-For when no proxy is trusted", async () => {
    const app = publicApp(1);
    const auth = { Authorization: `Bearer ${TOKEN}` };
    const first = await app.request("/api/chat", chat("s", { ...auth, "X-Forwarded-For": "1.1.1.1" }), fromPeer("203.0.113.5"));
    const second = await app.request("/api/chat", chat("s", { ...auth, "X-Forwarded-For": "2.2.2.2" }), fromPeer("203.0.113.5"));
    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
  });

  it("keeps separate clients in separate buckets", async () => {
    const app = publicApp(1);
    const auth = { Authorization: `Bearer ${TOKEN}` };
    const a = await app.request("/api/chat", chat("s", auth), fromPeer("203.0.113.5"));
    const b = await app.request("/api/chat", chat("s", auth), fromPeer("203.0.113.6"));
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
  });
});
